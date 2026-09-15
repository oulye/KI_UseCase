document.addEventListener('DOMContentLoaded', () => {
  const titel = document.getElementById('titel');
  const beschreibung = document.getElementById('beschreibung');
  const kategorie = document.getElementById('kategorie');
  const nutzen = document.getElementById('nutzen');
  const aufwand = document.getElementById('aufwand');
  const liste = document.getElementById('liste');

  if (!titel || !beschreibung || !kategorie || !nutzen || !aufwand || !liste) {
    return;
  }

  async function speichern() {
    const useCase = {
      titel: titel.value.trim(),
      beschreibung: beschreibung.value.trim(),
      kategorie: kategorie.value.trim(),
      nutzen: Number(nutzen.value) || 0,
      aufwand: Number(aufwand.value) || 0,
      score: (Number(nutzen.value) || 0) * 2 - (Number(aufwand.value) || 0),
    };

    if (!useCase.titel) {
      alert('Bitte einen Titel eingeben.');
      return;
    }

    await fetch('/api/usecases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(useCase),
    });

    [titel, kategorie, beschreibung, nutzen, aufwand].forEach((input) => {
      input.value = '';
    });

    laden();
  }

  async function laden() {
    const response = await fetch('/api/usecases');
    const data = await response.json();

    data.sort((a, b) => (b.score || 0) - (a.score || 0));

    liste.innerHTML = data.length ?
      data.map((x) => `
        <div class='card'>
          <b>${x.titel}</b><br>
          ${x.beschreibung || ''}<br>
          Kategorie: ${x.kategorie || '-'}<br>
          Nutzen: ${x.nutzen} | Aufwand: ${x.aufwand} | Score: ${x.score}<br>
          <button type="button" class="btn small danger" onclick="loeschen('${x._id}')" aria-label="Löschen ${x.titel}">🗑️ Löschen</button>
        </div>
      `).join('')
      : "<div class='empty'>Keine Use Cases vorhanden — füge einen neuen Use Case hinzu.</div>";
  }

  async function loeschen(id) {
    await fetch('/api/usecases/' + id, { method: 'DELETE' });
    laden();
  }

  window.speichern = speichern;
  window.loeschen = loeschen;
  window.laden = laden;

  laden();
});