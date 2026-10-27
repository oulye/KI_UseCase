// Hauptlogik: Navigation, Erfassungsformular mit Live-Bewertung, Liste mit Filtern, Detailansicht.
document.addEventListener('DOMContentLoaded', async () => {
  const { esc, api, CHF, CHF2, zahl, badge, bewertungBox, optionen } = window.KI;
  const $ = (id) => document.getElementById(id);

  const felder = {
    titel: $('titel'), beschreibung: $('beschreibung'), tags: $('tags'),
    branche: $('branche'), problemtyp: $('problemtyp'), risiko: $('risiko'),
    fallvolumen: $('fallvolumen'), datenverfuegbarkeit: $('datenverfuegbarkeit'), datenstruktur: $('datenstruktur'),
    regelkomplexitaet: $('regelkomplexitaet'), variabilitaet: $('variabilitaet'), fehlertoleranz: $('fehlertoleranz'),
    erklaerbarkeit: $('erklaerbarkeit'), datenschutz: $('datenschutz'),
    nutzen: $('nutzen'), aufwand: $('aufwand'), zeitersparnis: $('zeitersparnis'),
    kostenersparnis: $('kostenersparnis'), technischeUmsetzbarkeit: $('technische-umsetzbarkeit')
  };
  const sliders = ['erklaerbarkeit', 'datenschutz', 'nutzen', 'aufwand', 'zeitersparnis', 'kostenersparnis', 'technischeUmsetzbarkeit'];
  const DEFAULTS = { erklaerbarkeit: 3, datenschutz: 3, nutzen: 6, aufwand: 4, zeitersparnis: 50, kostenersparnis: 30, technischeUmsetzbarkeit: 5 };

  let editingId = null;
  let previewTimer = null;
  const vergleichIds = new Set();
  window.KI.vergleichIds = vergleichIds;

  // ------------------------------------------------------------------ Meta & Dropdowns
  const meta = await api('/api/meta');
  window.KI.state.meta = meta;

  const skalaOptionen = () => optionen(['1', '2', '3', '4', '5'], 'unbekannt');
  felder.branche.innerHTML = optionen(meta.branchen, 'Branche wählen');
  felder.problemtyp.innerHTML = optionen(meta.problemtypen, 'Problemtyp wählen');
  felder.risiko.innerHTML = optionen(meta.risiken, 'Risiko', 'Mittel').replace('<option value="">Risiko</option>', '');
  felder.datenstruktur.innerHTML = optionen(meta.datenstrukturen, 'Datenstruktur', 'strukturiert').replace('<option value="">Datenstruktur</option>', '');
  felder.fehlertoleranz.innerHTML = optionen(meta.fehlertoleranzen, 'unbekannt');
  ['datenverfuegbarkeit', 'regelkomplexitaet', 'variabilitaet'].forEach((k) => { felder[k].innerHTML = skalaOptionen(); });

  $('f-branche').innerHTML = optionen(meta.branchen, 'Alle Branchen');
  $('f-problemtyp').innerHTML = optionen(meta.problemtypen, 'Alle Problemtypen');
  $('f-risiko').innerHTML = optionen(meta.risiken, 'Alle Risiken');
  $('f-empfehlung').innerHTML = [
    '<option value="">Alle Empfehlungen</option>',
    ...Object.entries(meta.empfehlungen).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`)
  ].join('');

  // ------------------------------------------------------------------ Lösungsansätze (dynamische Zeilen)
  const loesungenBox = $('loesungen');

  const loesungsZeile = (a = {}) => {
    const row = document.createElement('div');
    row.className = 'loesung-row';
    row.innerHTML = `
      <select class="l-typ" aria-label="Typ">${meta.loesungstypen.map((t) => `<option ${t === a.typ ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      <input class="l-text" type="text" placeholder="Beschreibung" value="${esc(a.beschreibung || '')}">
      <input class="l-einmal" type="number" min="0" step="any" placeholder="Einmalaufwand CHF" value="${esc(a.einmalaufwandCHF ?? '')}">
      <input class="l-fall" type="number" min="0" step="any" placeholder="Kosten/Fall CHF" value="${esc(a.laufendeKostenProFall ?? '')}">
      <input class="l-gen" type="number" min="0" max="100" step="any" placeholder="Genauigkeit %" value="${esc(a.genauigkeit ?? '')}">
      <button type="button" class="btn small danger l-del" aria-label="Lösungsansatz entfernen">✕</button>`;
    loesungenBox.appendChild(row);
  };

  const leseLoesungen = () => [...loesungenBox.querySelectorAll('.loesung-row')].map((row) => ({
    typ: row.querySelector('.l-typ').value,
    beschreibung: row.querySelector('.l-text').value,
    einmalaufwandCHF: row.querySelector('.l-einmal').value,
    laufendeKostenProFall: row.querySelector('.l-fall').value,
    genauigkeit: row.querySelector('.l-gen').value
  }));

  $('add-loesung').addEventListener('click', () => { loesungsZeile({ typ: 'Manuell' }); planeVorschau(); });
  loesungenBox.addEventListener('click', (e) => {
    if (e.target.closest('.l-del')) { e.target.closest('.loesung-row').remove(); planeVorschau(); }
  });

  // ------------------------------------------------------------------ Formular
  const leseFormular = () => ({
    titel: felder.titel.value.trim(),
    beschreibung: felder.beschreibung.value.trim(),
    tags: felder.tags.value,
    branche: felder.branche.value,
    problemtyp: felder.problemtyp.value,
    risiko: felder.risiko.value || 'Mittel',
    kriterien: {
      fallvolumenProMonat: felder.fallvolumen.value,
      datenverfuegbarkeit: felder.datenverfuegbarkeit.value,
      datenstruktur: felder.datenstruktur.value,
      regelkomplexitaet: felder.regelkomplexitaet.value,
      variabilitaet: felder.variabilitaet.value,
      fehlertoleranz: felder.fehlertoleranz.value || null,
      erklaerbarkeit: felder.erklaerbarkeit.value,
      datenschutz: felder.datenschutz.value
    },
    geschaeftswert: {
      nutzen: felder.nutzen.value, aufwand: felder.aufwand.value,
      zeitersparnis: felder.zeitersparnis.value, kostenersparnis: felder.kostenersparnis.value,
      technischeUmsetzbarkeit: felder.technischeUmsetzbarkeit.value
    },
    loesungsansaetze: leseLoesungen()
  });

  const syncRange = (input) => {
    const out = document.querySelector(`[data-for="${input.id}"]`);
    if (out) out.textContent = input.value;
  };

  const fuelleFormular = (uc) => {
    const k = uc.kriterien || {};
    const g = uc.geschaeftswert || {};
    felder.titel.value = uc.titel || '';
    felder.beschreibung.value = uc.beschreibung || '';
    felder.tags.value = (uc.tags || []).join(', ');
    felder.branche.value = uc.branche || '';
    felder.problemtyp.value = uc.problemtyp || '';
    felder.risiko.value = uc.risiko || 'Mittel';
    felder.fallvolumen.value = k.fallvolumenProMonat ?? '';
    felder.datenverfuegbarkeit.value = k.datenverfuegbarkeit ?? '';
    felder.datenstruktur.value = k.datenstruktur || 'strukturiert';
    felder.regelkomplexitaet.value = k.regelkomplexitaet ?? '';
    felder.variabilitaet.value = k.variabilitaet ?? '';
    felder.fehlertoleranz.value = k.fehlertoleranz || '';
    felder.erklaerbarkeit.value = k.erklaerbarkeit ?? DEFAULTS.erklaerbarkeit;
    felder.datenschutz.value = k.datenschutz ?? DEFAULTS.datenschutz;
    felder.nutzen.value = g.nutzen ?? DEFAULTS.nutzen;
    felder.aufwand.value = g.aufwand ?? DEFAULTS.aufwand;
    felder.zeitersparnis.value = g.zeitersparnis ?? DEFAULTS.zeitersparnis;
    felder.kostenersparnis.value = g.kostenersparnis ?? DEFAULTS.kostenersparnis;
    felder.technischeUmsetzbarkeit.value = g.technischeUmsetzbarkeit ?? DEFAULTS.technischeUmsetzbarkeit;
    loesungenBox.innerHTML = '';
    (uc.loesungsansaetze || []).forEach(loesungsZeile);
    sliders.forEach((key) => syncRange(felder[key]));
  };

  const resetForm = () => {
    editingId = null;
    $('save-button').textContent = 'Speichern';
    $('form-title').textContent = 'Neuen Use Case erfassen';
    fuelleFormular({ risiko: 'Mittel', kriterien: { datenstruktur: 'strukturiert' }, loesungsansaetze: [{ typ: 'Manuell' }, { typ: 'Regelbasiert' }, { typ: 'KI' }] });
    planeVorschau();
  };

  function planeVorschau() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      try {
        $('vorschau').innerHTML = `<div class="vorschau-titel">Live-Bewertung (regelbasiert)</div>${bewertungBox(await api('/api/bewertung/vorschau', { method: 'POST', body: leseFormular() }))}`;
      } catch (err) {
        $('vorschau').innerHTML = `<div class="fehlend">${esc(err.message)}</div>`;
      }
    }, 250);
  }

  $('usecase-form').addEventListener('input', (e) => {
    if (e.target.type === 'range') syncRange(e.target);
    planeVorschau();
  });
  $('usecase-form').addEventListener('change', planeVorschau);
  $('reset-button').addEventListener('click', resetForm);

  $('usecase-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = leseFormular();
    if (!payload.titel) { alert('Bitte einen Titel eingeben.'); return; }
    try {
      await api(editingId ? `/api/usecases/${editingId}` : '/api/usecases', { method: editingId ? 'PUT' : 'POST', body: payload });
      resetForm();
      await ladeListe();
    } catch (err) {
      alert('Speichern fehlgeschlagen: ' + err.message);
    }
  });

  // ------------------------------------------------------------------ Liste
  const sichtbar = new Set(['titel', 'risiko', 'fallvolumen', 'nutzwert', 'empfehlung', 'aktionen']);
  const umschaltbar = [
    ['beschreibung', 'Beschreibung'], ['branche', 'Branche'], ['problemtyp', 'Problemtyp'],
    ['risiko', 'Risiko'], ['fallvolumen', 'Fallvolumen'], ['tags', 'Tags']
  ];

  const filterQuery = () => {
    const params = new URLSearchParams();
    [['q', 'f-q'], ['branche', 'f-branche'], ['problemtyp', 'f-problemtyp'], ['risiko', 'f-risiko'], ['empfehlung', 'f-empfehlung']]
      .forEach(([key, id]) => { if ($(id).value.trim()) params.set(key, $(id).value.trim()); });
    return params.toString();
  };

  async function ladeListe() {
    const liste = $('liste');
    let data;
    try {
      data = await api('/api/usecases?' + filterQuery());
    } catch (err) {
      liste.innerHTML = `<div class="empty">Fehler beim Laden: ${esc(err.message)}</div>`;
      return;
    }
    $('list-count').textContent = `(${data.length})`;
    if (!data.length) {
      liste.innerHTML = "<div class='empty'>Keine Use Cases gefunden — Filter anpassen oder einen neuen Use Case hinzufügen.</div>";
      return;
    }

    liste.innerHTML = `
      <div class="column-toggle-bar">
        ${umschaltbar.map(([key, label]) => `<button type="button" class="btn small column-toggle ${sichtbar.has(key) ? '' : 'is-off'}" data-column="${key}">${sichtbar.has(key) ? 'Ausblenden' : 'Einblenden'} ${label}</button>`).join('')}
        <button type="button" class="btn small secondary" id="goto-vergleich">Auswahl vergleichen (<span id="vergleich-anzahl">${vergleichIds.size}</span>)</button>
      </div>
      <div class="table-wrap">
      <table class="usecase-table">
        <thead><tr>
          <th class="col-check"></th>
          <th data-column="titel">Titel</th>
          <th data-column="beschreibung">Beschreibung</th>
          <th data-column="branche">Branche</th>
          <th data-column="problemtyp">Problemtyp</th>
          <th data-column="risiko">Risiko</th>
          <th data-column="fallvolumen">Fälle / Monat</th>
          <th data-column="tags">Tags</th>
          <th data-column="nutzwert">KI-Nutzwert</th>
          <th data-column="empfehlung">Empfehlung</th>
          <th data-column="aktionen">Aktionen</th>
        </tr></thead>
        <tbody>
          ${data.map((x) => `
            <tr>
              <td class="col-check"><input type="checkbox" class="vergleich-check" data-id="${esc(x._id)}" ${vergleichIds.has(x._id) ? 'checked' : ''} aria-label="Zum Vergleich wählen"></td>
              <td data-column="titel"><a href="#" class="titel-link" data-detail="${esc(x._id)}"><strong>${esc(x.titel)}</strong></a></td>
              <td data-column="beschreibung">${esc(x.beschreibung) || '-'}</td>
              <td data-column="branche">${esc(x.branche) || '-'}</td>
              <td data-column="problemtyp">${esc(x.problemtyp) || '-'}</td>
              <td data-column="risiko"><span class="risiko risiko--${esc((x.risiko || '').toLowerCase())}">${esc(x.risiko) || '-'}</span></td>
              <td data-column="fallvolumen">${zahl(x.kriterien?.fallvolumenProMonat)}</td>
              <td data-column="tags">${(x.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join(' ')}</td>
              <td data-column="nutzwert"><span class="score-badge">${esc(x.bewertung?.nutzwert ?? '–')}</span></td>
              <td data-column="empfehlung">${badge(x.bewertung?.empfehlung)}</td>
              <td data-column="aktionen">
                <div class="action-row compact">
                  <button type="button" class="btn small secondary" data-detail="${esc(x._id)}" aria-label="Details ${esc(x.titel)}">🔍</button>
                  <button type="button" class="btn small secondary" data-edit="${esc(x._id)}" aria-label="Bearbeiten ${esc(x.titel)}">✏️</button>
                  <button type="button" class="btn small danger" data-delete="${esc(x._id)}" data-name="${esc(x.titel)}" aria-label="Löschen ${esc(x.titel)}">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table></div>`;
    spaltenAnwenden();
  }

  function spaltenAnwenden() {
    document.querySelectorAll('#liste [data-column]').forEach((el) => {
      if (el.classList.contains('column-toggle')) return;
      el.classList.toggle('is-hidden', !sichtbar.has(el.dataset.column));
    });
  }

  let filterTimer;
  $('filter-bar').addEventListener('input', () => { clearTimeout(filterTimer); filterTimer = setTimeout(ladeListe, 250); });
  $('filter-bar').addEventListener('change', ladeListe);

  $('liste').addEventListener('click', async (e) => {
    const toggle = e.target.closest('.column-toggle');
    if (toggle) {
      const key = toggle.dataset.column;
      if (sichtbar.has(key)) sichtbar.delete(key); else sichtbar.add(key);
      toggle.classList.toggle('is-off', !sichtbar.has(key));
      toggle.textContent = `${sichtbar.has(key) ? 'Ausblenden' : 'Einblenden'} ${umschaltbar.find(([k]) => k === key)[1]}`;
      spaltenAnwenden();
      return;
    }
    const detail = e.target.closest('[data-detail]');
    if (detail) { e.preventDefault(); zeigeDetail(detail.dataset.detail); return; }
    const edit = e.target.closest('[data-edit]');
    if (edit) { bearbeiten(edit.dataset.edit); return; }
    const del = e.target.closest('[data-delete]');
    if (del) { loeschen(del.dataset.delete, del.dataset.name); return; }
    if (e.target.closest('#goto-vergleich')) navigiere('vergleich');
  });

  $('liste').addEventListener('change', (e) => {
    if (!e.target.classList.contains('vergleich-check')) return;
    const id = e.target.dataset.id;
    if (e.target.checked) {
      if (vergleichIds.size >= 4) { e.target.checked = false; alert('Maximal 4 Use Cases vergleichbar.'); return; }
      vergleichIds.add(id);
    } else {
      vergleichIds.delete(id);
    }
    const zaehler = $('vergleich-anzahl');
    if (zaehler) zaehler.textContent = vergleichIds.size;
  });

  async function bearbeiten(id) {
    try {
      const uc = await api('/api/usecases/' + id);
      fuelleFormular(uc);
      editingId = uc._id;
      $('save-button').textContent = 'Aktualisieren';
      $('form-title').textContent = 'Use Case bearbeiten';
      planeVorschau();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { alert(err.message); }
  }

  async function loeschen(id, name) {
    if (!window.confirm(`Use Case "${name}" wirklich löschen?`)) return;
    try {
      await api('/api/usecases/' + id, { method: 'DELETE' });
      vergleichIds.delete(id);
      if (editingId === id) resetForm();
      await ladeListe();
    } catch (err) { alert(err.message); }
  }

  // ------------------------------------------------------------------ Detail-Dialog
  const dialog = $('detail-dialog');

  async function zeigeDetail(id) {
    $('detail-inhalt').innerHTML = '<div class="empty">Lade …</div>';
    if (!dialog.open) dialog.showModal();
    try {
      const [uc, aehnlich] = await Promise.all([api('/api/usecases/' + id), api(`/api/usecases/${id}/aehnlich`)]);
      const k = uc.kriterien || {};
      const kosten = uc.bewertung?.kosten || [];
      const guenstigster = uc.bewertung?.guenstigsterAnsatz;
      $('detail-inhalt').innerHTML = `
        <div class="detail-kopf">
          <div><h2>${esc(uc.titel)}</h2><p class="meta">${esc(uc.branche) || 'Branche unbekannt'} · ${esc(uc.problemtyp) || 'Problemtyp unbekannt'} · Risiko: ${esc(uc.risiko)}</p></div>
          <button type="button" class="btn small secondary" data-close>Schliessen</button>
        </div>
        <p>${esc(uc.beschreibung) || '<em>Keine Beschreibung</em>'}</p>
        <div>${(uc.tags || []).map((t) => `<span class="chip">${esc(t)}</span>`).join(' ')}</div>

        <h3>Bewertung</h3>
        ${bewertungBox(uc.bewertung)}
        <div class="llm-box" id="llm-box">
          ${uc.bewertung?.llmBegruendung ? llmHtml(uc.bewertung.llmBegruendung) : ''}
          <button type="button" class="btn small secondary" data-llm="${esc(uc._id)}">Textuelle Begründung erzeugen${meta.llm ? ` (${esc(meta.llm)})` : ''}</button>
        </div>

        <h3>Problemmerkmale</h3>
        <table class="mini-table"><tbody>
          <tr><th>Fallvolumen / Monat</th><td>${zahl(k.fallvolumenProMonat)}</td><th>Datenverfügbarkeit</th><td>${esc(k.datenverfuegbarkeit ?? '–')} / 5</td></tr>
          <tr><th>Datenstruktur</th><td>${esc(k.datenstruktur)}</td><th>Regelkomplexität</th><td>${esc(k.regelkomplexitaet ?? '–')} / 5</td></tr>
          <tr><th>Variabilität</th><td>${esc(k.variabilitaet ?? '–')} / 5</td><th>Fehlertoleranz</th><td>${esc(k.fehlertoleranz ?? '–')}</td></tr>
          <tr><th>Erklärbarkeit (Anforderung)</th><td>${esc(k.erklaerbarkeit)} / 5</td><th>Datenschutz (Sensibilität)</th><td>${esc(k.datenschutz)} / 5</td></tr>
        </tbody></table>

        <h3>Lösungsansätze</h3>
        ${(uc.loesungsansaetze || []).length ? `
        <table class="mini-table"><thead><tr><th>Ansatz</th><th>Beschreibung</th><th>Einmalaufwand</th><th>Kosten / Fall</th><th>Genauigkeit</th><th>Kosten 12 Mt.</th><th>Break-even</th></tr></thead><tbody>
          ${uc.loesungsansaetze.map((a) => {
            const t = kosten.find((c) => c.typ === a.typ) || {};
            return `<tr class="${a.typ === guenstigster ? 'best' : ''}"><td><b>${esc(a.typ)}</b></td><td>${esc(a.beschreibung)}</td><td>${CHF(a.einmalaufwandCHF)}</td><td>${CHF2(a.laufendeKostenProFall)}</td><td>${a.genauigkeit != null ? esc(a.genauigkeit) + ' %' : '–'}</td><td>${CHF(t.tco12Monate)}</td><td>${t.breakEvenMonate != null ? zahl(t.breakEvenMonate, 1) + ' Mt.' : '–'}</td></tr>`;
          }).join('')}
        </tbody></table>
        ${guenstigster ? `<p class="meta">Günstigster Ansatz über 12 Monate: <b>${esc(guenstigster)}</b> (hervorgehoben). Das ist nicht automatisch die Empfehlung – Genauigkeit, Risiko und Erklärbarkeit zählen ebenfalls.</p>` : ''}`
        : '<div class="empty">Keine Lösungsansätze erfasst.</div>'}

        <h3>Ähnliche Use Cases</h3>
        ${aehnlich.length ? `<div class="aehnlich">${aehnlich.map((a) => `
          <a href="#" class="aehnlich-item" data-detail="${esc(a._id)}">
            <span class="score-badge">${esc(a.aehnlichkeit)}%</span>
            <span><b>${esc(a.titel)}</b><br><span class="meta">${esc(a.branche)} · ${esc(a.problemtyp)}${a.gemeinsameTags?.length ? ' · gemeinsame Tags: ' + a.gemeinsameTags.map(esc).join(', ') : ''}</span></span>
            ${badge(a.empfehlung)}
          </a>`).join('')}</div>` : '<div class="empty">Keine ähnlichen Use Cases gefunden.</div>'}`;
    } catch (err) {
      $('detail-inhalt').innerHTML = `<div class="empty">${esc(err.message)}</div><button type="button" class="btn small secondary" data-close>Schliessen</button>`;
    }
  }

  const llmHtml = (l) => `<div class="llm-text"><b>Begründung (${esc(l.quelle)}):</b> ${esc(l.text)}</div>`;

  dialog.addEventListener('click', async (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) { dialog.close(); return; }
    const detail = e.target.closest('[data-detail]');
    if (detail) { e.preventDefault(); zeigeDetail(detail.dataset.detail); return; }
    const llm = e.target.closest('[data-llm]');
    if (llm) {
      llm.disabled = true;
      llm.textContent = 'Erzeuge …';
      try {
        const r = await api(`/api/usecases/${llm.dataset.llm}/begruendung`, { method: 'POST' });
        $('llm-box').innerHTML = llmHtml(r);
      } catch (err) { llm.textContent = err.message; }
    }
  });

  // ------------------------------------------------------------------ Navigation
  const TITEL = {
    usecases: ['Use Cases', 'Wann bringt KI mehr Nutzen als eine klassische, regelbasierte oder manuelle Lösung?'],
    auswertungen: ['Auswertungen', 'MongoDB-Aggregationen über alle bewerteten Use Cases.'],
    vergleich: ['Vergleich', 'Use Cases nebeneinander: Kriterien, Kosten und Empfehlung.'],
    kriterien: ['Kriterien & Methodik', 'Wie die regelbasierte Bewertung zu ihrer Empfehlung kommt.']
  };

  function navigiere(view) {
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== `view-${view}`; });
    document.querySelectorAll('.nav-link').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    $('view-title').textContent = TITEL[view][0];
    $('view-subtitle').textContent = TITEL[view][1];
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    if (view === 'usecases') ladeListe();
    else window.KI.views?.[view]?.laden?.();
  }
  window.KI.navigiere = navigiere;
  $('nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) navigiere(btn.dataset.view);
  });

  sliders.forEach((key) => syncRange(felder[key]));
  resetForm();
  const startAnsicht = location.hash.slice(1);
  if (TITEL[startAnsicht] && startAnsicht !== 'usecases') navigiere(startAnsicht);
  else ladeListe();
});
