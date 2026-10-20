document.addEventListener('DOMContentLoaded', () => {
  const titel = document.getElementById('titel');
  const beschreibung = document.getElementById('beschreibung');
  const nutzen = document.getElementById('nutzen');
  const aufwand = document.getElementById('aufwand');
  const zeitersparnis = document.getElementById('zeitersparnis');
  const kostenersparnis = document.getElementById('kostenersparnis');
  const technischeUmsetzbarkeit = document.getElementById('technische-umsetzbarkeit');
  const branche = document.getElementById('branche');
  const problemtyp = document.getElementById('problemtyp');
  const risiko = document.getElementById('risiko');
  const liste = document.getElementById('liste');
  const saveButton = document.getElementById('save-button');

  let editingId = null;

  const visibleColumns = new Set([
    'titel',
    'risiko',
    'nutzen',
    'aufwand',
    'zeitersparnis',
    'kostenersparnis',
    'technischeUmsetzbarkeit',
    'score',
    'aktionen'
  ]);

  const allToggleColumns = [
    { key: 'beschreibung', label: 'Beschreibung' },
    { key: 'problemtyp', label: 'Problemtyp' },
    { key: 'branche', label: 'Branche' },
    { key: 'risiko', label: 'Risiko' },
    { key: 'zeitersparnis', label: 'Zeitersparnis' },
    { key: 'kostenersparnis', label: 'Kostenersparnis' },
    { key: 'technischeUmsetzbarkeit', label: 'Techn. Umsetzbarkeit' }
  ];

  const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const syncRangeValue = (input) => {
    if (!input) return;
    const output = document.querySelector(`[data-for="${input.id}"]`);
    if (output) output.textContent = input.value;
  };

  const getRiskWeight = (risk) => {
    const normalized = String(risk || '').trim().toLowerCase();
    if (normalized === 'niedrig') return 3;
    if (normalized === 'hoch') return 1;
    return 2;
  };

  const calculateScore = ({ nutzenValue, aufwandValue, risikoValue, zeitersparnisValue, kostenersparnisValue, technischeUmsetzbarkeitValue }) => {
    const basisScore = (safeNumber(nutzenValue) * 2) - safeNumber(aufwandValue);
    const riskWeight = getRiskWeight(risikoValue);
    const zeit = safeNumber(zeitersparnisValue);
    const kosten = safeNumber(kostenersparnisValue);
    const umsetzbarkeit = safeNumber(technischeUmsetzbarkeitValue);

    return (basisScore * riskWeight) + (zeit * 0.5) + (kosten * 0.5) + (umsetzbarkeit * 3);
  };

  const readFormValues = () => {
    const formValues = {
      titel: (titel?.value || '').trim(),
      beschreibung: (beschreibung?.value || '').trim(),
      nutzen: safeNumber(nutzen?.value, 0),
      aufwand: safeNumber(aufwand?.value, 0),
      zeitersparnis: safeNumber(zeitersparnis?.value, 0),
      kostenersparnis: safeNumber(kostenersparnis?.value, 0),
      technischeUmsetzbarkeit: safeNumber(technischeUmsetzbarkeit?.value, 0),
      branche: branche?.value || '',
      problemtyp: problemtyp?.value || '',
      risiko: risiko?.value || 'Mittel'
    };

    formValues.score = calculateScore({
      nutzenValue: formValues.nutzen,
      aufwandValue: formValues.aufwand,
      risikoValue: formValues.risiko,
      zeitersparnisValue: formValues.zeitersparnis,
      kostenersparnisValue: formValues.kostenersparnis,
      technischeUmsetzbarkeitValue: formValues.technischeUmsetzbarkeit
    });

    return formValues;
  };

  const resetForm = () => {
    editingId = null;
    if (saveButton) saveButton.textContent = 'Speichern';

    [titel, beschreibung, branche, problemtyp].forEach((input) => {
      if (input) input.value = '';
    });

    if (risiko) risiko.value = 'Mittel';
    if (nutzen) nutzen.value = 6;
    if (aufwand) aufwand.value = 4;
    if (zeitersparnis) zeitersparnis.value = 50;
    if (kostenersparnis) kostenersparnis.value = 30;
    if (technischeUmsetzbarkeit) technischeUmsetzbarkeit.value = 5;

    [nutzen, aufwand, zeitersparnis, kostenersparnis, technischeUmsetzbarkeit].forEach((input) => {
      if (input) syncRangeValue(input);
    });
  };

  const fillForm = (useCase) => {
    if (!useCase) return;

    if (titel) titel.value = useCase.titel || '';
    if (beschreibung) beschreibung.value = useCase.beschreibung || '';
    if (nutzen) nutzen.value = safeNumber(useCase.nutzen, 6);
    if (aufwand) aufwand.value = safeNumber(useCase.aufwand, 4);
    if (zeitersparnis) zeitersparnis.value = safeNumber(useCase.zeitersparnis, 50);
    if (kostenersparnis) kostenersparnis.value = safeNumber(useCase.kostenersparnis, 30);
    if (technischeUmsetzbarkeit) technischeUmsetzbarkeit.value = safeNumber(useCase.technischeUmsetzbarkeit, 5);
    if (branche) branche.value = useCase.branche || '';
    if (problemtyp) problemtyp.value = useCase.problemtyp || '';
    if (risiko) risiko.value = useCase.risiko || 'Mittel';

    [nutzen, aufwand, zeitersparnis, kostenersparnis, technischeUmsetzbarkeit].forEach((input) => {
      if (input) syncRangeValue(input);
    });

    editingId = useCase._id;
    if (saveButton) saveButton.textContent = 'Aktualisieren';
  };

  const updateColumnVisibility = () => {
    document.querySelectorAll('[data-column]').forEach((element) => {
      const column = element.dataset.column;
      const isVisible = visibleColumns.has(column);

      if (element.classList.contains('column-toggle')) {
        element.classList.toggle('is-off', !isVisible);
        element.textContent = `${isVisible ? 'Ausblenden' : 'Einblenden'} ${element.dataset.label}`;
        return;
      }

      element.classList.toggle('is-hidden', !isVisible);
    });
  };

  const createColumnToggleButtons = () => `
    <div class="column-toggle-bar">
      ${allToggleColumns.map((column) => `
        <button
          type="button"
          class="btn small column-toggle ${visibleColumns.has(column.key) ? '' : 'is-off'}"
          data-column="${column.key}"
          data-label="${column.label}"
        >${visibleColumns.has(column.key) ? 'Ausblenden' : 'Einblenden'} ${column.label}</button>
      `).join('')}
    </div>
  `;

  const loadUseCases = async () => {
    const response = await fetch('/api/usecases');
    const data = await response.json();

    data.sort((a, b) => (b.score || 0) - (a.score || 0));

    if (!data.length) {
      liste.innerHTML = "<div class='empty'>Keine Use Cases vorhanden — füge einen neuen Use Case hinzu.</div>";
      return;
    }

    liste.innerHTML = `
      ${createColumnToggleButtons()}
      <table class="usecase-table">
        <thead>
          <tr>
            <th class="col-titel" data-column="titel">Titel</th>
            <th class="col-beschreibung" data-column="beschreibung">Beschreibung</th>
            <th class="col-branche" data-column="branche">Branche</th>
            <th class="col-problemtyp" data-column="problemtyp">Problemtyp</th>
            <th class="col-risiko" data-column="risiko">Risiko</th>
            <th class="col-nutzen" data-column="nutzen">Nutzen</th>
            <th class="col-aufwand" data-column="aufwand">Aufwand</th>
            <th class="col-zeitersparnis" data-column="zeitersparnis">Zeitersparnis</th>
            <th class="col-kostenersparnis" data-column="kostenersparnis">Kostenersparnis</th>
            <th class="col-technischeumsetzbarkeit" data-column="technischeUmsetzbarkeit">Techn. Umsetzbarkeit</th>
            <th class="col-score" data-column="score">Score</th>
            <th class="col-aktionen" data-column="aktionen">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((x) => {
            const titelText = (x.titel || '').replace(/"/g, '&quot;');
            return `
              <tr>
                <td class="col-titel" data-column="titel"><strong>${titelText}</strong></td>
                <td class="col-beschreibung" data-column="beschreibung">${x.beschreibung || '-'}</td>
                <td class="col-branche" data-column="branche">${x.branche || '-'}</td>
                <td class="col-problemtyp" data-column="problemtyp">${x.problemtyp || '-'}</td>
                <td class="col-risiko" data-column="risiko">${x.risiko || '-'}</td>
                <td class="col-nutzen" data-column="nutzen">${x.nutzen ?? '-'}</td>
                <td class="col-aufwand" data-column="aufwand">${x.aufwand ?? '-'}</td>
                <td class="col-zeitersparnis" data-column="zeitersparnis">${safeNumber(x.zeitersparnis, 0)}%</td>
                <td class="col-kostenersparnis" data-column="kostenersparnis">${safeNumber(x.kostenersparnis, 0)}%</td>
                <td class="col-technischeumsetzbarkeit" data-column="technischeUmsetzbarkeit">${safeNumber(x.technischeUmsetzbarkeit, 0)}</td>
                <td class="col-score" data-column="score"><span class="score-badge">${x.score ?? 0}</span></td>
                <td class="col-aktionen" data-column="aktionen">
                  <div class="action-row compact">
                    <button type="button" class="btn small secondary" onclick="bearbeiten('${x._id}')" aria-label="Bearbeiten ${titelText}">✏️</button>
                    <button type="button" class="btn small danger" onclick="loeschen('${x._id}')" aria-label="Löschen ${titelText}">🗑️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    updateColumnVisibility();
  };

  async function speichern() {
    const payload = readFormValues();

    if (!payload.titel) {
      alert('Bitte einen Titel eingeben.');
      return;
    }

    const response = await fetch(editingId ? '/api/usecases/' + editingId : '/api/usecases', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      alert('Speichern fehlgeschlagen: ' + err);
      return;
    }

    resetForm();
    await loadUseCases();
  }

  async function bearbeiten(id) {
    const response = await fetch('/api/usecases/' + id);
    const useCase = await response.json();
    fillForm(useCase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loeschen(id) {
    const response = await fetch('/api/usecases/' + id);
    const useCase = await response.json();
    const name = useCase?.titel || 'dieser Use-Case';
    const isConfirmed = window.confirm(`Sind Sie sich wirklich ganz sicher, tun Sie noch einmal überlegen, dass Sie den Use-Case "${name}" löschen möchten?`);

    if (!isConfirmed) return;

    await fetch('/api/usecases/' + id, { method: 'DELETE' });

    if (editingId === id) {
      resetForm();
    }

    await loadUseCases();
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.column-toggle');
    if (!toggle) return;

    const { column } = toggle.dataset;
    if (visibleColumns.has(column)) {
      visibleColumns.delete(column);
    } else {
      visibleColumns.add(column);
    }

    updateColumnVisibility();
  });

  [nutzen, aufwand, zeitersparnis, kostenersparnis, technischeUmsetzbarkeit].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => syncRangeValue(input));
    syncRangeValue(input);
  });

  window.speichern = speichern;
  window.loeschen = loeschen;
  window.bearbeiten = bearbeiten;
  window.laden = loadUseCases;

  resetForm();
  loadUseCases();
});