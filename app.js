const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UseCase = require('./models/UseCase');
const kriterien = require('./config/kriterien');
const usecases = require('./services/usecases');
const auswertungen = require('./services/auswertungen');
const { aehnlicheUseCases, suche } = require('./services/aehnlichkeit');
const { generiereBegruendung } = require('./services/llm');
const { wirtschaftlichkeit } = require('./services/bewertung');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const pruefeId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Ungültige ID' });
  next();
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '200kb' }));
  app.use(express.static('public'));

  // Katalog, Enums, Gewichte -> Frontend baut Dropdowns und Kriterienseite daraus
  app.get('/api/meta', (req, res) => res.json({
    branchen: kriterien.BRANCHEN,
    problemtypen: kriterien.PROBLEMTYPEN,
    risiken: kriterien.RISIKEN,
    datenstrukturen: kriterien.DATENSTRUKTUREN,
    fehlertoleranzen: kriterien.FEHLERTOLERANZEN,
    loesungstypen: kriterien.LOESUNGSTYPEN,
    empfehlungen: kriterien.EMPFEHLUNGEN,
    gewichte: kriterien.GEWICHTE,
    schwellen: kriterien.SCHWELLEN,
    kriterienkatalog: kriterien.KRITERIENKATALOG,
    entscheidungsregeln: kriterien.ENTSCHEIDUNGSREGELN,
    llm: process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OLLAMA_MODEL ? 'ollama' : null
  }));

  // ---- CRUD + Filter ----
  app.get('/api/usecases', wrap(async (req, res) => {
    const { branche, problemtyp, risiko, empfehlung, q, sort } = req.query;
    const filter = {};
    if (branche) filter.branche = String(branche);
    if (problemtyp) filter.problemtyp = String(problemtyp);
    if (risiko) filter.risiko = String(risiko);
    if (empfehlung) filter['bewertung.empfehlung'] = String(empfehlung);
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ titel: re }, { beschreibung: re }, { tags: re }];
    }
    const sortierung = sort === 'titel' ? { titel: 1 } : sort === 'neu' ? { createdAt: -1 } : { 'bewertung.nutzwert': -1, titel: 1 };
    res.json(await UseCase.find(filter).sort(sortierung).lean());
  }));

  app.get('/api/usecases/:id', pruefeId, wrap(async (req, res) => {
    const doc = await UseCase.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'UseCase nicht gefunden' });
    res.json(doc);
  }));

  app.post('/api/usecases', wrap(async (req, res) => {
    res.status(201).json(await usecases.erstellen(req.body));
  }));

  app.put('/api/usecases/:id', pruefeId, wrap(async (req, res) => {
    const doc = await usecases.aktualisieren(req.params.id, req.body);
    if (!doc) return res.status(404).json({ error: 'UseCase nicht gefunden' });
    res.json(doc);
  }));

  app.delete('/api/usecases/:id', pruefeId, wrap(async (req, res) => {
    await UseCase.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  }));

  // ---- Bewertung ----
  app.post('/api/bewertung/vorschau', wrap(async (req, res) => {
    res.json(usecases.vorschau(req.body));
  }));

  app.post('/api/bewertung/neu', wrap(async (req, res) => {
    res.json({ neuBewertet: await usecases.alleNeuBewerten() });
  }));

  app.post('/api/usecases/:id/begruendung', pruefeId, wrap(async (req, res) => {
    const doc = await UseCase.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'UseCase nicht gefunden' });
    const { text, quelle } = await generiereBegruendung(doc.toObject());
    doc.bewertung.llmBegruendung = { text, quelle, erstelltAm: new Date() };
    await doc.save();
    res.json(doc.bewertung.llmBegruendung);
  }));

  app.get('/api/usecases/:id/aehnlich', pruefeId, wrap(async (req, res) => {
    const doc = await UseCase.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'UseCase nicht gefunden' });
    res.json(await aehnlicheUseCases(doc, Math.min(Number(req.query.limit) || 5, 20)));
  }));

  app.get('/api/vergleich', wrap(async (req, res) => {
    const ids = String(req.query.ids || '').split(',').filter((id) => mongoose.isValidObjectId(id)).slice(0, 4);
    const docs = await UseCase.find({ _id: { $in: ids } }).lean();
    res.json(docs.map((d) => ({ ...d, wirtschaftlichkeit: wirtschaftlichkeit(d) })));
  }));

  app.get('/api/suche', wrap(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);
    res.json(await suche(q));
  }));

  // ---- Auswertungen (Aggregation Pipelines) ----
  app.get('/api/auswertungen', (req, res) => res.json(auswertungen.katalog()));

  app.get('/api/auswertungen/:id', wrap(async (req, res) => {
    const ergebnis = await auswertungen.fuehreAus(req.params.id);
    if (!ergebnis) return res.status(404).json({ error: 'Auswertung nicht gefunden' });
    res.json(ergebnis);
  }));

  // ---- Indizes & Query-Pläne (Nachweis der Indexierungsstrategie) ----
  app.get('/api/indizes', wrap(async (req, res) => {
    res.json(await UseCase.collection.indexes());
  }));

  app.get('/api/explain', wrap(async (req, res) => {
    const abfragen = {
      'Filter Branche + Problemtyp': { branche: 'Finanzen', problemtyp: 'Klassifizierung' },
      'Filter Risiko + Empfehlung': { risiko: 'Hoch', 'bewertung.empfehlung': 'KI_ASSISTENZ' },
      'Tag-Suche (Multikey)': { tags: 'chatbot' },
      'Volltextsuche': { $text: { $search: 'Support' } },
      'Fallvolumen-Bereich': { 'kriterien.fallvolumenProMonat': { $gte: 10000 } }
    };
    const ergebnis = [];
    for (const [name, filter] of Object.entries(abfragen)) {
      const plan = await UseCase.find(filter).explain('executionStats');
      const stats = plan.executionStats;
      const stage = JSON.stringify(plan.queryPlanner.winningPlan);
      ergebnis.push({
        abfrage: name,
        filter,
        indexVerwendet: stage.includes('IXSCAN') || stage.includes('TEXT_MATCH'),
        gescanntDokumente: stats.totalDocsExamined,
        gescannteIndexEintraege: stats.totalKeysExamined,
        geliefert: stats.nReturned
      });
    }
    res.json(ergebnis);
  }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpunkt nicht gefunden' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validierung fehlgeschlagen', details: Object.values(err.errors).map((e) => e.message) });
    }
    if (err.name === 'CastError') return res.status(400).json({ error: 'Ungültiger Wert: ' + err.path });
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}

module.exports = { createApp };
