// Ansichten: Auswertungen (Aggregationen), Vergleich, Kriterien/Methodik.
(() => {
  const { esc, api, CHF, zahl, badge, bar, teilscores } = window.KI;
  const $ = (id) => document.getElementById(id);
  const views = {};
  window.KI.views = views;

  const SEGMENTE = [
    ['kiSinnvoll', 'KI sinnvoll', 'ki'],
    ['kiAssistenz', 'KI als Assistenz', 'assist'],
    ['klassisch', 'Klassisch', 'klassisch'],
    ['manuell', 'Manuell', 'manuell'],
    ['unklar', 'Unklar', 'unklar']
  ];

  const BUCKET = {
    0: '< 50', 50: '50 – 499', 500: '500 – 4’999', 5000: '5’000 – 49’999', 50000: '50’000 – 4.9 Mio.', 5000000: '≥ 5 Mio.', unbekannt: 'unbekannt'
  };
  const label = (id) => (id === null || id === undefined ? 'unbekannt' : id);

  const legende = () => `<div class="legende">${SEGMENTE.map(([, text, klasse]) => `<span><i class="dot dot--${klasse}"></i>${text}</span>`).join('')}</div>`;

  // ------------------------------------------------------------------ Renderer pro Auswertungstyp
  const gestapelt = (daten, labelFn = label) => `
    ${legende()}
    <div class="stack-list">
      ${daten.map((r) => `
        <div class="stack-row">
          <div class="stack-label">${esc(labelFn(r._id))}<small>${esc(r.anzahl)} Fälle</small></div>
          <div class="stack" role="img" aria-label="${SEGMENTE.map(([k, t]) => `${t}: ${r[k]}`).join(', ')}">
            ${SEGMENTE.map(([k, t, klasse]) => (r[k] ? `<span class="seg seg--${klasse}" style="flex:${r[k]}" title="${t}: ${r[k]}">${r[k]}</span>` : '')).join('')}
          </div>
          <div class="stack-meta"><b>${esc(r.kiQuote)} %</b> KI<small>Ø Nutzwert ${esc(r.avgNutzwert)}</small></div>
        </div>`).join('')}
    </div>`;

  const tabelle = (spalten, zeilen) => `
    <div class="table-wrap"><table class="mini-table">
      <thead><tr>${spalten.map((s) => `<th>${esc(s.titel)}</th>`).join('')}</tr></thead>
      <tbody>${zeilen.map((r) => `<tr>${spalten.map((s) => `<td>${s.html ? s.html(r) : esc(s.wert(r))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;

  const keineDaten = '<div class="empty">Keine Treffer.</div>';

  const RENDERER = {
    kpi: (d) => {
      const e = d[0];
      const gesamt = e.gesamt[0] || { anzahl: 0, avgNutzwert: 0 };
      const nach = Object.fromEntries(e.nachEmpfehlung.map((x) => [x._id, x]));
      return `
        <div class="kpis">
          <div class="kpi"><b>${esc(gesamt.anzahl)}</b><span>Use Cases</span></div>
          <div class="kpi"><b>${zahl(gesamt.avgNutzwert, 1)}</b><span>Ø KI-Nutzwert</span></div>
          ${SEGMENTE.map(([, text, klasse], i) => {
            const key = ['KI_SINNVOLL', 'KI_ASSISTENZ', 'KLASSISCH', 'MANUELL', 'UNKLAR'][i];
            return `<div class="kpi kpi--${klasse}"><b>${esc(nach[key]?.anzahl || 0)}</b><span>${text}</span></div>`;
          }).join('')}
        </div>
        <h4>Top 5 geeignete Use Cases</h4>
        ${tabelle([
          { titel: 'Use Case', wert: (r) => r.titel }, { titel: 'Branche', wert: (r) => r.branche },
          { titel: 'Nutzwert', wert: (r) => r.nutzwert }, { titel: 'Empfehlung', html: (r) => badge(r.empfehlung) }
        ], e.top5)}`;
    },
    verteilung: (d) => (!d.length ? keineDaten : d[0].kiSinnvoll !== undefined ? gestapelt(d) : null),
    buckets: (d) => `
      <div class="stack-list">
        ${d.map((r) => `
          <div class="stack-row">
            <div class="stack-label">${esc(BUCKET[r._id] ?? r._id)}<small>${esc(r.anzahl)} ${r.avgBreakEvenMonate !== undefined ? 'Ansätze' : 'Fälle'}</small></div>
            <div>${bar(r.kiQuote !== undefined ? r.kiQuote : Math.min(r.avgBreakEvenMonate, 36), r.kiQuote !== undefined ? 100 : 36, r.kiQuote !== undefined ? 'bar--ki' : 'bar--manuell')}</div>
            <div class="stack-meta">${r.kiQuote !== undefined
              ? `<b>${esc(r.kiQuote)} %</b> KI<small>Ø Nutzwert ${esc(r.avgNutzwert)}</small>`
              : `<b>${zahl(r.avgBreakEvenMonate, 1)} Mt.</b> Ø Break-even<small>schnellster: ${zahl(r.minBreakEvenMonate, 1)} Mt.</small>`}</div>
          </div>`).join('')}
      </div>`,
    korrelation: (d) => {
      const r = d[0]?.r;
      const betrag = Math.abs(r);
      const staerke = betrag >= 0.7 ? 'stark' : betrag >= 0.4 ? 'mittel' : betrag >= 0.2 ? 'schwach' : 'kaum vorhanden';
      return d.length ? `<div class="kpis"><div class="kpi"><b>r = ${zahl(r, 2)}</b><span>Pearson (log₁₀ Volumen ↔ Nutzwert), n = ${esc(d[0].n)}</span></div></div>
        <p class="meta">Zusammenhang: <b>${staerke}</b>. Das Volumen allein erklärt den Nutzwert nur teilweise – Regelkomplexität, Datenstruktur und Fehlertoleranz wirken mindestens ebenso stark.</p>` : keineDaten;
    },
    liste: (d, def) => {
      if (!d.length) return keineDaten;
      if (def.id === 'regelmaschine') {
        return tabelle([
          { titel: 'Use Case', wert: (r) => r.titel }, { titel: 'Empfehlung', html: (r) => badge(r.empfehlung) },
          { titel: 'Kosten Regel (12 Mt.)', wert: (r) => CHF(r.tcoRegel) }, { titel: 'Kosten KI/Hybrid (12 Mt.)', wert: (r) => CHF(r.tcoKi) },
          { titel: 'Ersparnis', wert: (r) => CHF(r.ersparnisCHF) }, { titel: 'Genauigkeit Regel / KI', wert: (r) => `${r.genauigkeitRegel} % / ${r.genauigkeitKi} %` }
        ], d);
      }
      return tabelle([
        { titel: 'Use Case', wert: (r) => r.titel }, { titel: 'Branche', wert: (r) => r.branche }, { titel: 'Risiko', wert: (r) => r.risiko },
        { titel: 'Fehlertoleranz', wert: (r) => r.fehlertoleranz }, { titel: 'Nutzwert', wert: (r) => r.nutzwert }, { titel: 'Empfehlung', html: (r) => badge(r.empfehlung) }
      ], d);
    }
  };

  function zeichne(def, daten) {
    let html = RENDERER[def.typ]?.(daten, def) ?? null;
    if (html === null) {
      // Verteilungen ohne Empfehlungsspalten (Lösungsansätze, Tags)
      if (def.id === 'loesungsansaetze') {
        html = tabelle([
          { titel: 'Ansatz', wert: (r) => r._id }, { titel: 'Anzahl', wert: (r) => r.anzahl },
          { titel: 'Ø Einmalaufwand', wert: (r) => CHF(r.avgEinmalaufwand) }, { titel: 'Ø Kosten / Fall', wert: (r) => 'CHF ' + zahl(r.avgKostenProFall, 2) },
          { titel: 'Ø Genauigkeit', wert: (r) => zahl(r.avgGenauigkeit, 1) + ' %' }
        ], daten);
      } else {
        const max = Math.max(...daten.map((r) => r.anzahl), 1);
        html = `<div class="stack-list">${daten.map((r) => `
          <div class="stack-row"><div class="stack-label">${esc(r._id)}</div><div>${bar(r.anzahl, max, 'bar--assist')}</div>
          <div class="stack-meta"><b>${esc(r.anzahl)}</b><small>Ø Nutzwert ${esc(r.avgNutzwert)}</small></div></div>`).join('')}</div>`;
      }
    }
    return html;
  }

  // ------------------------------------------------------------------ Fazit aus den Daten
  function fazit(erg) {
    const punkte = [];
    const vol = erg.volumen?.daten || [];
    const tief = vol.find((r) => r._id === 0);
    const hoch = vol.filter((r) => typeof r._id === 'number' && r._id >= 50000);
    if (tief && hoch.length) {
      const n = hoch.reduce((a, r) => a + r.anzahl, 0);
      const ki = hoch.reduce((a, r) => a + r.kiGesamt, 0);
      punkte.push(`<b>Volumen:</b> Ab 50’000 Fällen/Monat wird KI bei ${ki} von ${n} Use Cases empfohlen (${Math.round((ki / n) * 100)} %), unter 50 Fällen bei ${tief.kiGesamt} von ${tief.anzahl}. Die Korrelation Volumen ↔ Nutzwert beträgt r = ${zahl(erg.korrelation?.daten?.[0]?.r, 2)} – Volumen ist eine notwendige, aber keine hinreichende Bedingung.`);
    }
    const risikoHoch = (erg.risiko?.daten || []).find((r) => r._id === 'Hoch');
    if (risikoHoch) {
      punkte.push(`<b>Risiko:</b> Bei hohem Risiko wird KI in ${risikoHoch.kiSinnvoll} von ${risikoHoch.anzahl} Fällen vollautomatisch empfohlen, in ${risikoHoch.kiAssistenz} nur als Assistenz (Human in the Loop).`);
    }
    const ds = erg.datenstruktur?.daten || [];
    const unstr = ds.find((r) => r._id === 'unstrukturiert');
    const str = ds.find((r) => r._id === 'strukturiert');
    if (unstr && str) {
      punkte.push(`<b>Datenstruktur:</b> Bei unstrukturierten Daten (Text, Bild) liegt die KI-Quote bei ${unstr.kiQuote} %, bei strukturierten Daten bei ${str.kiQuote} % – dort reichen oft Regeln (${str.klassisch} von ${str.anzahl} klassisch).`);
    }
    const rm = erg.regelmaschine?.daten || [];
    const total = erg.uebersicht?.daten?.[0]?.gesamt?.[0]?.anzahl;
    if (total) {
      punkte.push(`<b>Regelmaschine:</b> Bei ${rm.length} von ${total} Use Cases ist die regelbasierte Lösung über 12 Monate günstiger als KI/Hybrid und höchstens 5 Prozentpunkte weniger genau.`);
    }
    return punkte.length ? `<section class="card wide"><div class="card-title">Fazit aus den Daten <span class="hint">wird live aus den Aggregationen berechnet</span></div><ul class="fazit">${punkte.map((p) => `<li>${p}</li>`).join('')}</ul></section>` : '';
  }

  // ------------------------------------------------------------------ Auswertungen
  views.auswertungen = {
    async laden() {
      const box = $('auswertungen');
      box.innerHTML = '<div class="empty">Lade Auswertungen …</div>';
      try {
        const katalog = await api('/api/auswertungen');
        const ergebnisse = await Promise.all(katalog.map((k) => api('/api/auswertungen/' + k.id)));
        const nachId = Object.fromEntries(ergebnisse.map((e) => [e.id, e]));
        box.innerHTML = fazit(nachId) + ergebnisse.map((e) => `
          <section class="card wide auswertung">
            <div class="card-title">${esc(e.titel)}</div>
            <p class="frage">${esc(e.frage)}</p>
            ${zeichne(e, e.daten)}
            <details class="pipeline"><summary>MongoDB Aggregation Pipeline anzeigen</summary><pre>${esc(JSON.stringify(e.pipeline, null, 2))}</pre></details>
          </section>`).join('') + '<section class="card wide" id="index-card"><div class="card-title">Indexierung & Query-Pläne</div><div class="empty">Lade …</div></section>';
        views.auswertungen.indizes();
      } catch (err) {
        box.innerHTML = `<div class="empty">Fehler: ${esc(err.message)}</div>`;
      }
    },
    async indizes() {
      const card = $('index-card');
      try {
        const [indizes, plaene] = await Promise.all([api('/api/indizes'), api('/api/explain')]);
        card.innerHTML = `
          <div class="card-title">Indexierung & Query-Pläne</div>
          <p class="frage">Jede typische Abfrage wird per <code>explain("executionStats")</code> geprüft – ein Index-Scan statt Collection-Scan belegt die Indexierungsstrategie.</p>
          ${tabelle([
            { titel: 'Abfrage', wert: (r) => r.abfrage }, { titel: 'Index genutzt', html: (r) => (r.indexVerwendet ? '✅ ja' : '❌ nein') },
            { titel: 'Index-Einträge geprüft', wert: (r) => r.gescannteIndexEintraege }, { titel: 'Dokumente geprüft', wert: (r) => r.gescanntDokumente },
            { titel: 'Treffer', wert: (r) => r.geliefert }
          ], plaene)}
          <h4>Vorhandene Indizes</h4>
          ${tabelle([
            { titel: 'Name', wert: (r) => r.name }, { titel: 'Schlüssel', wert: (r) => JSON.stringify(r.key) }
          ], indizes)}`;
      } catch (err) {
        card.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
      }
    }
  };

  // ------------------------------------------------------------------ Vergleich
  views.vergleich = {
    async laden() {
      const auswahl = $('vergleich-auswahl');
      const alle = await api('/api/usecases?sort=titel');
      auswahl.innerHTML = alle.map((u) => `
        <label class="vergleich-opt"><input type="checkbox" value="${esc(u._id)}" ${window.KI.vergleichIds.has(u._id) ? 'checked' : ''}> ${esc(u.titel)}</label>`).join('');
      views.vergleich.rendern();
    },
    async rendern() {
      const ids = [...window.KI.vergleichIds];
      const out = $('vergleich-ergebnis');
      if (ids.length < 2) { out.innerHTML = '<div class="empty">Mindestens 2 Use Cases auswählen.</div>'; return; }
      const docs = await api('/api/vergleich?ids=' + ids.join(','));
      const zeile = (titel, fn) => `<tr><th>${esc(titel)}</th>${docs.map((d) => `<td>${fn(d)}</td>`).join('')}</tr>`;
      const beste = (d) => d.wirtschaftlichkeit?.guenstigsterAnsatz;
      out.innerHTML = `<div class="table-wrap"><table class="mini-table vergleich-table">
        <thead><tr><th></th>${docs.map((d) => `<th>${esc(d.titel)}<br><small>${esc(d.branche)} · ${esc(d.problemtyp)}</small></th>`).join('')}</tr></thead>
        <tbody>
          ${zeile('Empfehlung', (d) => badge(d.bewertung?.empfehlung))}
          ${zeile('KI-Nutzwert', (d) => `<b>${esc(d.bewertung?.nutzwert ?? '–')}</b>/100 ${bar(d.bewertung?.nutzwert)}`)}
          ${zeile('Human in the Loop', (d) => (d.bewertung?.humanInTheLoop ? 'ja' : 'nein'))}
          ${zeile('Risiko', (d) => esc(d.risiko))}
          ${zeile('Fälle / Monat', (d) => zahl(d.kriterien?.fallvolumenProMonat))}
          ${zeile('Datenverfügbarkeit', (d) => `${esc(d.kriterien?.datenverfuegbarkeit ?? '–')} / 5`)}
          ${zeile('Datenstruktur', (d) => esc(d.kriterien?.datenstruktur))}
          ${zeile('Regelkomplexität', (d) => `${esc(d.kriterien?.regelkomplexitaet ?? '–')} / 5`)}
          ${zeile('Fehlertoleranz', (d) => esc(d.kriterien?.fehlertoleranz ?? '–'))}
          ${zeile('Teilscores', (d) => teilscores(d.bewertung?.teilscores))}
          ${zeile('Günstigster Ansatz (12 Mt.)', (d) => esc(beste(d) || '–'))}
          ${zeile('Kosten je Ansatz (12 Mt.)', (d) => (d.wirtschaftlichkeit ? d.wirtschaftlichkeit.ansaetze.map((a) => `${esc(a.typ)}: ${CHF(a.tco12Monate)}${a.breakEvenMonate != null ? ` (Break-even ${zahl(a.breakEvenMonate, 1)} Mt.)` : ''}`).join('<br>') : '–'))}
          ${zeile('Begründung', (d) => `<ul class="begruendung">${(d.bewertung?.begruendung || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`)}
        </tbody></table></div>`;
    }
  };

  $('vergleich-auswahl').addEventListener('change', (e) => {
    const ids = window.KI.vergleichIds;
    if (e.target.checked) {
      if (ids.size >= 4) { e.target.checked = false; alert('Maximal 4 Use Cases vergleichbar.'); return; }
      ids.add(e.target.value);
    } else {
      ids.delete(e.target.value);
    }
    views.vergleich.rendern();
  });

  // ------------------------------------------------------------------ Kriterien & Methodik
  views.kriterien = {
    laden() {
      const meta = window.KI.state.meta;
      $('kriterien').innerHTML = `
        <section class="card wide">
          <div class="card-title">Kriterienkatalog für sinnvollen KI-Einsatz</div>
          <p class="frage">Der KI-Nutzwert (0–100) ist die gewichtete Summe von sieben Teilscores, skaliert mit dem KI-Bedarf: Je besser Regeln die Aufgabe abdecken, desto kleiner der <em>zusätzliche</em> Nutzen von KI.</p>
          ${tabelle([
            { titel: 'Kriterium', html: (r) => `<b>${esc(r.titel)}</b>` }, { titel: 'Leitfrage', wert: (r) => r.frage },
            { titel: 'Gewicht', wert: (r) => Math.round(r.gewicht * 100) + ' %' }, { titel: 'Erläuterung', wert: (r) => r.beschreibung }
          ], meta.kriterienkatalog)}
        </section>
        <section class="card wide">
          <div class="card-title">Entscheidungsregeln (Reihenfolge = Priorität)</div>
          <ol class="regeln">${meta.entscheidungsregeln.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
          <p class="meta">Schwellenwerte: ${Object.entries(meta.schwellen).map(([k, v]) => `${esc(k)} = ${esc(v)}`).join(' · ')}</p>
        </section>
        <section class="card wide">
          <div class="card-title">Die fünf Empfehlungen</div>
          <div class="empf-liste">${Object.entries(meta.empfehlungen).map(([k, v]) => `<div>${badge(k)}<span>${esc(v)}</span></div>`).join('')}</div>
          <p class="meta">Die Bewertung ist bewusst <b>regelbasiert und deterministisch</b> – gleiche Eingabe, gleiche Empfehlung, jede Entscheidung ist nachvollziehbar. Ein Sprachmodell
          ${meta.llm ? `(<b>${esc(meta.llm)}</b> ist konfiguriert)` : '(derzeit nicht konfiguriert; <code>ANTHROPIC_API_KEY</code> oder <code>OLLAMA_MODEL</code> setzen)'}
          formuliert höchstens die textuelle Begründung in der Detailansicht und verändert die Empfehlung nie. Ohne Modell wird die regelbasierte Begründung verwendet.</p>
        </section>`;
    }
  };
})();
