// Anwendungslogik rund um Use Cases: Eingabe normalisieren, bewerten, migrieren.

const UseCase = require('../models/UseCase');
const { bewerte, wirtschaftlichkeit } = require('./bewertung');

const zuZahl = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const zuTags = (v) => {
  const liste = Array.isArray(v) ? v : String(v || '').split(',');
  return [...new Set(liste.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
};

const KRITERIEN_ZAHLEN = ['fallvolumenProMonat', 'datenverfuegbarkeit', 'regelkomplexitaet', 'variabilitaet', 'erklaerbarkeit', 'datenschutz'];
const GESCHAEFTSWERT = ['nutzen', 'aufwand', 'zeitersparnis', 'kostenersparnis', 'technischeUmsetzbarkeit'];

// Wandelt einen Request-Body in ein sauberes Dokument um. Ergebnis enthält nur bekannte Felder
// (verhindert Mass Assignment, z. B. ein vom Client gesetztes "bewertung").
// Akzeptiert zusätzlich das alte flache Format (nutzen, aufwand, ...) für Abwärtskompatibilität.
function normalisiere(body = {}) {
  const k = body.kriterien || {};
  const g = body.geschaeftswert || {};
  const doc = {
    titel: String(body.titel || '').trim(),
    beschreibung: String(body.beschreibung || '').trim(),
    branche: body.branche || '',
    problemtyp: body.problemtyp || '',
    risiko: body.risiko || 'Mittel',
    tags: zuTags(body.tags),
    kriterien: {
      datenstruktur: k.datenstruktur || 'strukturiert',
      fehlertoleranz: k.fehlertoleranz || null
    },
    geschaeftswert: {},
    loesungsansaetze: (Array.isArray(body.loesungsansaetze) ? body.loesungsansaetze : [])
      .filter((a) => a && a.typ)
      .map((a) => ({
        typ: a.typ,
        beschreibung: String(a.beschreibung || '').trim(),
        einmalaufwandCHF: zuZahl(a.einmalaufwandCHF) ?? 0,
        laufendeKostenProFall: zuZahl(a.laufendeKostenProFall) ?? 0,
        ...(zuZahl(a.genauigkeit) !== null ? { genauigkeit: zuZahl(a.genauigkeit) } : {})
      }))
  };
  KRITERIEN_ZAHLEN.forEach((key) => { doc.kriterien[key] = zuZahl(k[key]); });
  GESCHAEFTSWERT.forEach((key) => {
    const wert = zuZahl(g[key] ?? body[key]);
    if (wert !== null) doc.geschaeftswert[key] = wert;
  });
  return doc;
}

// Berechnet die Bewertung (inkl. Kostenvergleich) und schreibt sie ins Dokument.
function bewertungAnwenden(doc) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const bewertung = bewerte(plain);
  const wirt = wirtschaftlichkeit(plain);
  if (wirt) {
    bewertung.kosten = wirt.ansaetze;
    bewertung.guenstigsterAnsatz = wirt.guenstigsterAnsatz;
  }
  const bisher = plain.bewertung?.llmBegruendung;
  if (bisher) bewertung.llmBegruendung = bisher;
  doc.bewertung = bewertung;
  return doc;
}

async function erstellen(body) {
  const doc = new UseCase(normalisiere(body));
  bewertungAnwenden(doc);
  return doc.save();
}

async function aktualisieren(id, body) {
  const doc = await UseCase.findById(id);
  if (!doc) return null;
  doc.set(normalisiere(body));
  doc.markModified('kriterien');
  doc.markModified('geschaeftswert');
  bewertungAnwenden(doc);
  return doc.save();
}

// Vorschau ohne Speichern (Live-Bewertung im Formular)
function vorschau(body) {
  const doc = new UseCase(normalisiere(body));
  bewertungAnwenden(doc);
  return doc.bewertung;
}

// Beim Start: Dokumente im alten flachen Format (nutzen, aufwand, score, ...) ins neue Modell überführen.
async function migriereLegacy() {
  const alt = await UseCase.collection.find({ bewertung: { $exists: false } }).toArray();
  for (const d of alt) {
    const doc = new UseCase({
      _id: d._id,
      ...normalisiere({
        titel: d.titel, beschreibung: d.beschreibung, branche: d.branche, problemtyp: d.problemtyp, risiko: d.risiko,
        nutzen: d.nutzen, aufwand: d.aufwand, zeitersparnis: d.zeitersparnis,
        kostenersparnis: d.kostenersparnis, technischeUmsetzbarkeit: d.technischeUmsetzbarkeit
      })
    });
    bewertungAnwenden(doc);
    const neu = doc.toObject();
    delete neu._id;
    await UseCase.collection.updateOne(
      { _id: d._id },
      { $set: { ...neu, createdAt: d.createdAt || new Date(), updatedAt: new Date() }, $unset: { score: '', nutzen: '', aufwand: '', zeitersparnis: '', kostenersparnis: '', technischeUmsetzbarkeit: '', kategorie: '' } }
    );
  }
  return alt.length;
}

async function alleNeuBewerten() {
  const docs = await UseCase.find();
  for (const doc of docs) {
    bewertungAnwenden(doc);
    await doc.save();
  }
  return docs.length;
}

module.exports = { normalisiere, bewertungAnwenden, erstellen, aktualisieren, vorschau, migriereLegacy, alleNeuBewerten };
