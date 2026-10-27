const mongoose = require('mongoose');
const {
  BRANCHEN, PROBLEMTYPEN, RISIKEN, DATENSTRUKTUREN, FEHLERTOLERANZEN, LOESUNGSTYPEN, EMPFEHLUNGEN
} = require('../config/kriterien');

const skala = (min, max) => ({ type: Number, min, max });

// Lösungsansätze gehören genau zu einem Use Case und werden nie unabhängig abgefragt
// -> eingebettet (1:n, kleine, begrenzte Anzahl), kein eigenes Collection/$lookup nötig.
const loesungsansatzSchema = new mongoose.Schema({
  typ: { type: String, enum: LOESUNGSTYPEN, required: true },
  beschreibung: { type: String, trim: true, default: '' },
  einmalaufwandCHF: { type: Number, min: 0, default: 0 },
  laufendeKostenProFall: { type: Number, min: 0, default: 0 },
  genauigkeit: skala(0, 100)
}, { _id: false });

// Objektive Merkmale des Problems. Fehlende Angaben (null) sind erlaubt und führen
// bewusst zur Empfehlung "Entscheidung noch nicht möglich".
const kriterienSchema = new mongoose.Schema({
  fallvolumenProMonat: { type: Number, min: 0, default: null },
  datenverfuegbarkeit: { ...skala(1, 5), default: null },
  datenstruktur: { type: String, enum: DATENSTRUKTUREN, default: 'strukturiert' },
  regelkomplexitaet: { ...skala(1, 5), default: null },
  variabilitaet: { ...skala(1, 5), default: null },
  fehlertoleranz: { type: String, enum: FEHLERTOLERANZEN, default: null },
  erklaerbarkeit: { ...skala(1, 5), default: 3 },
  datenschutz: { ...skala(1, 5), default: 3 }
}, { _id: false });

// Subjektive Einschätzung des Teams zum Geschäftswert.
const geschaeftswertSchema = new mongoose.Schema({
  nutzen: { ...skala(1, 10), default: 6 },
  aufwand: { ...skala(1, 10), default: 4 },
  zeitersparnis: { ...skala(0, 100), default: 50 },
  kostenersparnis: { ...skala(0, 100), default: 30 },
  technischeUmsetzbarkeit: { ...skala(1, 10), default: 5 }
}, { _id: false });

// Ergebnis der regelbasierten Bewertung. Wird serverseitig berechnet und mitgespeichert
// (Computed/Denormalized Pattern), damit Aggregationen ohne Neuberechnung laufen.
const bewertungSchema = new mongoose.Schema({
  empfehlung: { type: String, enum: Object.keys(EMPFEHLUNGEN) },
  empfehlungText: String,
  geeignet: { type: Boolean, default: null },
  humanInTheLoop: { type: Boolean, default: false },
  nutzwert: skala(0, 100),
  teilscores: {
    kiBedarf: Number, daten: Number, volumen: Number, fehlertoleranz: Number,
    compliance: Number, wirtschaftlichkeit: Number, umsetzbarkeit: Number
  },
  begruendung: [String],
  fehlendeAngaben: [String],
  guenstigsterAnsatz: String,
  kosten: [{ _id: false, typ: String, tco12Monate: Number, breakEvenMonate: Number }],
  llmBegruendung: { text: String, quelle: String, erstelltAm: Date },
  version: Number,
  berechnetAm: Date
}, { _id: false });

const useCaseSchema = new mongoose.Schema({
  titel: { type: String, required: true, trim: true },
  beschreibung: { type: String, trim: true, default: '' },
  branche: { type: String, enum: [...BRANCHEN, ''], default: '' },
  problemtyp: { type: String, enum: [...PROBLEMTYPEN, ''], default: '' },
  risiko: { type: String, enum: RISIKEN, default: 'Mittel' },
  tags: [{ type: String, trim: true, lowercase: true }],
  kriterien: { type: kriterienSchema, default: () => ({}) },
  geschaeftswert: { type: geschaeftswertSchema, default: () => ({}) },
  loesungsansaetze: [loesungsansatzSchema],
  bewertung: bewertungSchema
}, { timestamps: true });

// ---- Indexierungsstrategie (Begründung: siehe README, Abschnitt "Indexierungsstrategie") ----
// Filter in der Liste/UI: Branche + Problemtyp (Equality), danach nach Nutzwert sortiert
useCaseSchema.index({ branche: 1, problemtyp: 1, 'bewertung.nutzwert': -1 });
// Risiko-/Empfehlungs-Auswertungen und Filter "Empfehlung"
useCaseSchema.index({ risiko: 1, 'bewertung.empfehlung': 1 });
// Rangliste / Top-N
useCaseSchema.index({ 'bewertung.nutzwert': -1 });
// Fallvolumen-Buckets und Korrelationsanalysen
useCaseSchema.index({ 'kriterien.fallvolumenProMonat': 1 });
// Multikey-Index für Tag-Suche und Ähnlichkeit
useCaseSchema.index({ tags: 1 });
// Volltextsuche (Gewichtung: Titel > Tags > Beschreibung)
useCaseSchema.index(
  { titel: 'text', tags: 'text', beschreibung: 'text' },
  { name: 'volltext', weights: { titel: 10, tags: 5, beschreibung: 1 }, default_language: 'german' }
);

module.exports = mongoose.model('UseCase', useCaseSchema);
