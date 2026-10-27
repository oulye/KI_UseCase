// Integrationstests gegen eine echte MongoDB (separate Test-Datenbank, wird danach gelöscht).
// Läuft nur, wenn MongoDB erreichbar ist; sonst werden die Tests übersprungen.
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const UseCase = require('../models/UseCase');
const { createApp } = require('../app');
const { seed } = require('../scripts/seed');
const { migriereLegacy } = require('../services/usecases');
const auswertungen = require('../services/auswertungen');

const uri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/ki_usecases_test';

test.describe('API (MongoDB)', async () => {
  let server;
  let base;
  let verfuegbar = true;

  test.before(async () => {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    } catch {
      verfuegbar = false;
      return;
    }
    await mongoose.connection.dropDatabase();
    await seed({ reset: true });
    server = createApp().listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
  });

  test.after(async () => {
    if (server) server.close();
    if (verfuegbar) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  const api = async (pfad, opts = {}) => {
    const res = await fetch(base + pfad, {
      ...opts,
      headers: { 'content-type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    return { status: res.status, body: await res.json() };
  };

  const neuerFall = (extra = {}) => ({
    titel: 'Testfall API', branche: 'Finanzen', problemtyp: 'Klassifizierung', risiko: 'Niedrig', tags: 'Test, API',
    kriterien: { fallvolumenProMonat: 20000, datenverfuegbarkeit: 5, datenstruktur: 'unstrukturiert', regelkomplexitaet: 5, variabilitaet: 5, fehlertoleranz: 'hoch', erklaerbarkeit: 1, datenschutz: 1 },
    geschaeftswert: { nutzen: 9, aufwand: 3, zeitersparnis: 80, kostenersparnis: 50, technischeUmsetzbarkeit: 9 },
    loesungsansaetze: [{ typ: 'Manuell', laufendeKostenProFall: 2 }, { typ: 'KI', einmalaufwandCHF: 10000, laufendeKostenProFall: 0.1, genauigkeit: 95 }],
    ...extra
  });

  test('Beispieldatensatz ist geladen', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const { body } = await api('/api/usecases');
    assert.ok(body.length >= 30 && body.length <= 50);
    assert.ok(body.every((u) => u.bewertung && u.bewertung.empfehlung));
  });

  test('CRUD: erstellen berechnet die Bewertung serverseitig, bearbeiten bewertet neu', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const erstellt = await api('/api/usecases', { method: 'POST', body: neuerFall() });
    assert.equal(erstellt.status, 201);
    assert.equal(erstellt.body.bewertung.empfehlung, 'KI_SINNVOLL');
    assert.deepEqual(erstellt.body.tags, ['test', 'api']);
    const id = erstellt.body._id;

    const geaendert = await api(`/api/usecases/${id}`, {
      method: 'PUT',
      body: neuerFall({ kriterien: { fallvolumenProMonat: 5, datenverfuegbarkeit: 5, regelkomplexitaet: 5, variabilitaet: 5, fehlertoleranz: 'hoch' } })
    });
    assert.equal(geaendert.body.bewertung.empfehlung, 'MANUELL');

    const geloescht = await api(`/api/usecases/${id}`, { method: 'DELETE' });
    assert.equal(geloescht.body.success, true);
    assert.equal((await api(`/api/usecases/${id}`)).status, 404);
  });

  test('Client kann die Bewertung nicht fälschen (kein Mass Assignment)', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const { body } = await api('/api/usecases', {
      method: 'POST',
      body: neuerFall({ titel: 'Fälschung', kriterien: { fallvolumenProMonat: 5, datenverfuegbarkeit: 5, regelkomplexitaet: 5, variabilitaet: 5, fehlertoleranz: 'hoch' }, bewertung: { empfehlung: 'KI_SINNVOLL', nutzwert: 100 } })
    });
    assert.equal(body.bewertung.empfehlung, 'MANUELL');
    assert.notEqual(body.bewertung.nutzwert, 100);
  });

  test('Validierung und ungültige IDs liefern 400 statt 500', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    assert.equal((await api('/api/usecases', { method: 'POST', body: { titel: '' } })).status, 400);
    assert.equal((await api('/api/usecases', { method: 'POST', body: neuerFall({ risiko: 'Extrem' }) })).status, 400);
    assert.equal((await api('/api/usecases/abc')).status, 400);
    assert.equal((await api('/api/gibtsnicht')).status, 404);
  });

  test('Filter nach Empfehlung, Branche und Freitext', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const klassisch = await api('/api/usecases?empfehlung=KLASSISCH');
    assert.ok(klassisch.body.length > 0 && klassisch.body.every((u) => u.bewertung.empfehlung === 'KLASSISCH'));
    const fin = await api('/api/usecases?branche=Finanzen&risiko=Hoch');
    assert.ok(fin.body.every((u) => u.branche === 'Finanzen' && u.risiko === 'Hoch'));
    const q = await api('/api/usecases?q=chatbot');
    assert.ok(q.body.length >= 1);
    // Regex-Sonderzeichen dürfen keinen Fehler auslösen
    assert.equal((await api('/api/usecases?q=(')).status, 200);
  });

  test('Vorschau bewertet ohne zu speichern', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const vorher = await UseCase.countDocuments();
    const { body } = await api('/api/bewertung/vorschau', { method: 'POST', body: neuerFall() });
    assert.equal(body.empfehlung, 'KI_SINNVOLL');
    assert.equal(await UseCase.countDocuments(), vorher);
  });

  test('Ähnliche Use Cases: sortiert, ohne den Fall selbst', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const chatbot = (await api('/api/usecases?q=chatbot')).body[0];
    const { body } = await api(`/api/usecases/${chatbot._id}/aehnlich`);
    assert.ok(body.length > 0 && body.length <= 5);
    assert.ok(body.every((u) => u._id !== chatbot._id));
    for (let i = 1; i < body.length; i++) assert.ok(body[i - 1].aehnlichkeit >= body[i].aehnlichkeit);
  });

  test('Volltextsuche mit Relevanz-Ranking', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const { body } = await api('/api/suche?q=Rechnung');
    assert.ok(body.length >= 2);
    assert.ok(body.every((u) => /rechnung/i.test(u.titel + u.beschreibung + u.tags.join(' '))));
    for (let i = 1; i < body.length; i++) assert.ok(body[i - 1].score >= body[i].score);
  });

  test('mindestens fünf Aggregation Pipelines liefern Daten', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const katalog = (await api('/api/auswertungen')).body;
    assert.ok(katalog.length >= 5);
    for (const { id } of katalog) {
      const { status, body } = await api(`/api/auswertungen/${id}`);
      assert.equal(status, 200, id);
      assert.ok(body.daten.length > 0, `${id} liefert keine Daten`);
      assert.ok(Array.isArray(body.pipeline) && body.pipeline.length > 0);
    }
    assert.equal((await api('/api/auswertungen/gibtsnicht')).status, 404);
  });

  test('Auswertung Risiko: Hochrisiko-Fälle werden nie vollautomatisch empfohlen', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const { body } = await api('/api/auswertungen/risiko');
    const hoch = body.daten.find((r) => r._id === 'Hoch');
    assert.equal(hoch.kiSinnvoll, 0);
    assert.ok(hoch.kiAssistenz > 0);
  });

  test('Auswertung Korrelation liefert r zwischen -1 und 1', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const { body } = await api('/api/auswertungen/korrelation');
    assert.ok(body.daten[0].r >= -1 && body.daten[0].r <= 1);
  });

  test('Indexierung: Filterabfragen nutzen Indizes statt Collection Scan', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    await UseCase.syncIndexes();
    const namen = (await api('/api/indizes')).body.map((i) => i.name);
    assert.ok(namen.includes('volltext'));
    assert.ok(namen.length >= 6);
    const plaene = (await api('/api/explain')).body;
    assert.ok(plaene.length >= 4);
    plaene.forEach((p) => assert.equal(p.indexVerwendet, true, p.abfrage));
  });

  test('Migration: Dokumente im alten flachen Format werden ins neue Modell überführt', async (t) => {
    if (!verfuegbar) return t.skip('MongoDB nicht erreichbar');
    const { insertedId } = await UseCase.collection.insertOne({
      titel: 'Altbestand', branche: 'Bildung', problemtyp: 'Klassifizierung', risiko: 'Hoch',
      nutzen: 9, aufwand: 3, zeitersparnis: 70, kostenersparnis: 20, technischeUmsetzbarkeit: 8, score: 123, kategorie: 'x'
    });
    assert.equal(await migriereLegacy(), 1);
    const doc = await UseCase.collection.findOne({ _id: insertedId });
    assert.equal(doc.geschaeftswert.nutzen, 9);
    assert.equal(doc.bewertung.empfehlung, 'UNKLAR'); // Pflichtangaben fehlen im Altbestand
    assert.equal(doc.score, undefined);
    assert.equal(doc.kategorie, undefined);
    assert.equal(await migriereLegacy(), 0); // idempotent
  });

  test('Pipelines sind eindeutig benannt', () => {
    const ids = auswertungen.AUSWERTUNGEN.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
