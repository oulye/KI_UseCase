document.addEventListener('DOMContentLoaded', () => {
  const titel = document.getElementById('titel');
  const beschreibung = document.getElementById('beschreibung');
  const nutzen = document.getElementById('nutzen');
  const aufwand = document.getElementById('aufwand');
  const branche = document.getElementById('branche');
  const problemtyp = document.getElementById('problemtyp');
  const risiko = document.getElementById('risiko');
  const liste = document.getElementById('liste');
  const saveButton = document.getElementById('save-button');

  let editingId = null;

  const visibleColumns = new Set(['titel','risiko','nutzen','aufwand','score','aktionen']);

  const syncRangeValue = (input) => {
    if (!input) return;
    const output = document.querySelector(`[data-for="${input.id}"]`);
    if (output) output.textContent = input.value;
  };

  const resetForm = () => {
    editingId = null;
    if (saveButton) saveButton.textContent = 'Speichern';

    [titel, beschreibung].forEach((input) => input && (input.value = ''));
    [branche, problemtyp, risiko].forEach((input) => input && (input.value = ''));

    if (risiko) risiko.value = 'Mittel';
    if (nutzen) {
      nutzen.value = 6;
      syncRangeValue(nutzen);
    }
    if (aufwand) {
      aufwand.value = 4;
      syncRangeValue(aufwand);
    }
  };

  const fillForm = (useCase) => {
    if (!useCase) return;
    if (titel) titel.value = useCase.titel || '';
    if (beschreibung) beschreibung.value = useCase.beschreibung || '';
    if (nutzen) {
      nutzen.value = useCase.nutzen ?? 6;
      syncRangeValue(nutzen);
    }
    if (aufwand) {
      aufwand.value = useCase.aufwand ?? 4;
      syncRangeValue(aufwand);
    }
    if (branche) branche.value = useCase.branche || '';
    if (problemtyp) problemtyp.value = useCase.problemtyp || '';
    if (risiko) risiko.value = useCase.risiko || 'Mittel';

    editingId = useCase._id;
    if (saveButton) saveButton.textContent = 'Aktualisieren';
  };

  [nutzen, aufwand].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => syncRangeValue(input));
    syncRangeValue(input);
  });

  async function speichern() {
    const useCase = {
      titel: titel.value.trim(),
      beschreibung: beschreibung.value.trim(),
      nutzen: Number(nutzen.value) || 0,
      aufwand: Number(aufwand.value) || 0,
      score: (Number(nutzen.value) || 0) * 2 - (Number(aufwand.value) || 0),
      branche: branche ? branche.value : '',
      problemtyp: problemtyp ? problemtyp.value : '',
      risiko: risiko ? risiko.value : 'Mittel'
    };

    if (!useCase.titel) {
      alert('Bitte einen Titel eingeben.');
      return;
    }

    const options = {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(useCase)
    };

    const url = editingId ? '/api/usecases/' + editingId : '/api/usecases';
    await fetch(url, options);

    resetForm();
    laden();
  }

  async function laden() {
    const response = await fetch('/api/usecases');
    const data = await response.json();

    data.sort((a, b) => (b.score || 0) - (a.score || 0));

    liste.innerHTML = data.length ? `
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
            <th class="col-score" data-column="score">Score</th>
            <th class="col-aktionen" data-column="aktionen">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((x) => {
            const titelText = (x.titel || '').replace(/"/g, '&quot;');
            const beschreibungText = (x.beschreibung || '').replace(/"/g, '&quot;');
            return `
              <tr>
                <td class="col-titel" data-column="titel"><strong>${titelText}</strong></td>
                <td class="col-beschreibung" data-column="beschreibung">${beschreibungText || '-'}</td>
                <td class="col-branche" data-column="branche">${x.branche || '-'}</td>
                <td class="col-problemtyp" data-column="problemtyp">${x.problemtyp || '-'}</td>
                <td class="col-risiko" data-column="risiko">${x.risiko || '-'}</td>
                <td class="col-nutzen" data-column="nutzen">${x.nutzen ?? '-'}</td>
                <td class="col-aufwand" data-column="aufwand">${x.aufwand ?? '-'}</td>
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
    ` : "<div class='empty'>Keine Use Cases vorhanden — füge einen neuen Use Case hinzu.</div>";

    updateColumnVisibility();
  }

  async function bearbeiten(id) {
    const response = await fetch('/api/usecases/' + id);
    const useCase = await response.json();
    fillForm(useCase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loeschen(id) {
    const useCase = await fetch('/api/usecases/' + id).then(res => res.json());
    const name = useCase?.titel || 'dieser Use-Case';
    const confirmed = window.confirm(`Sind Sie sich wirklich ganz sicher, tun Sie noch einmal überlegen, dass Sie den Use-Case "${name}" löschen möchten?`);

    if (!confirmed) {
      return;
    }

    await fetch('/api/usecases/' + id, { method: 'DELETE' });
    if (editingId === id) {
      resetForm();
    }
    laden();
  }

  function updateColumnVisibility() {
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
  }

  function createColumnToggleButtons() {
    const columns = [
      { key: 'beschreibung', label: 'Beschreibung' },
      { key: 'problemtyp', label: 'Problemtyp' },
      { key: 'branche', label: 'Branche' },
      { key: 'risiko', label: 'Risiko' }
    ];

    return `
      <div class="column-toggle-bar">
        ${columns.map((column) => `
          <button
            type="button"
            class="btn small column-toggle ${visibleColumns.has(column.key) ? '' : 'is-off'}"
            data-column="${column.key}"
            data-label="${column.label}"
          >${visibleColumns.has(column.key) ? 'Ausblenden' : 'Einblenden'} ${column.label}</button>
        `).join('')}
      </div>
    `;
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

  window.speichern = speichern;
  window.loeschen = loeschen;
  window.bearbeiten = bearbeiten;
  window.laden = laden;

  resetForm();
  laden();
});