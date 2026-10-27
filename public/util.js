// Gemeinsame Hilfsfunktionen für alle Ansichten (globaler Namespace KI).
window.KI = (() => {
  const state = { meta: null };

  // Alle Werte aus der Datenbank werden vor dem Einfügen in HTML escaped (XSS-Schutz).
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data.details ? ': ' + data.details.join(', ') : '';
      throw new Error((data.error || 'Fehler ' + response.status) + detail);
    }
    return data;
  };

  const CHF = (n) => (n === null || n === undefined ? '–' : 'CHF ' + Math.round(n).toLocaleString('de-CH'));
  const CHF2 = (n) => (n === null || n === undefined ? '–' : 'CHF ' + Number(n).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: Math.abs(n) < 0.1 ? 4 : 2 }));
  const zahl = (n, digits = 0) => (n === null || n === undefined ? '–' : Number(n).toLocaleString('de-CH', { maximumFractionDigits: digits }));

  const EMPFEHLUNG_KLASSE = {
    KI_SINNVOLL: 'ki', KI_ASSISTENZ: 'assist', KLASSISCH: 'klassisch', MANUELL: 'manuell', UNKLAR: 'unklar'
  };

  const empfehlungText = (key) => state.meta?.empfehlungen?.[key] || key || '–';

  const badge = (key) => (key
    ? `<span class="badge badge--${EMPFEHLUNG_KLASSE[key] || 'unklar'}">${esc(empfehlungText(key))}</span>`
    : '<span class="badge badge--unklar">nicht bewertet</span>');

  const bar = (value, max = 100, klasse = '') => {
    const pct = Math.max(0, Math.min(100, ((value || 0) / max) * 100));
    return `<span class="bar ${klasse}"><span class="bar-fill" style="width:${pct}%"></span></span>`;
  };

  const TEILSCORE_LABEL = {
    kiBedarf: 'KI-Bedarf', daten: 'Datenreife', volumen: 'Fallvolumen', fehlertoleranz: 'Fehlertoleranz',
    compliance: 'Erklärbarkeit & Datenschutz', wirtschaftlichkeit: 'Wirtschaftlichkeit', umsetzbarkeit: 'Umsetzbarkeit'
  };

  const teilscores = (scores = {}) => `
    <div class="teilscores">
      ${Object.entries(TEILSCORE_LABEL).map(([key, label]) => `
        <div class="teilscore"><span>${esc(label)}</span>${bar(scores[key])}<b>${esc(scores[key] ?? '–')}</b></div>
      `).join('')}
    </div>`;

  const bewertungBox = (b) => {
    if (!b) return '<div class="empty">Noch nicht bewertet.</div>';
    return `
      <div class="bewertung-kopf">
        ${badge(b.empfehlung)}
        <span class="nutzwert">KI-Nutzwert <b>${esc(b.nutzwert)}</b>/100</span>
        ${b.humanInTheLoop ? '<span class="chip">Human in the Loop</span>' : ''}
      </div>
      <ul class="begruendung">${(b.begruendung || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      ${b.fehlendeAngaben?.length ? `<div class="fehlend">Fehlende Angaben: ${b.fehlendeAngaben.map(esc).join(', ')}</div>` : ''}
      ${teilscores(b.teilscores)}`;
  };

  const optionen = (liste, platzhalter, selected = '') => [
    `<option value="">${esc(platzhalter)}</option>`,
    ...liste.map((v) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(v)}</option>`)
  ].join('');

  return { state, esc, api, CHF, CHF2, zahl, badge, bar, teilscores, bewertungBox, optionen, empfehlungText, EMPFEHLUNG_KLASSE, TEILSCORE_LABEL };
})();
