// MongoDB Aggregation Pipelines für die Auswertungen.
// Jede Pipeline ist eine Datenstruktur (nicht nur Code), damit sie in der UI angezeigt
// und in der Präsentation erklärt werden kann.

const UseCase = require('../models/UseCase');

const KI_EMPFEHLUNGEN = ['KI_SINNVOLL', 'KI_ASSISTENZ'];
const ZAEHLE = (key) => ({ $sum: { $cond: [{ $eq: ['$bewertung.empfehlung', key] }, 1, 0] } });
const ZAEHLE_KI = { $sum: { $cond: [{ $in: ['$bewertung.empfehlung', KI_EMPFEHLUNGEN] }, 1, 0] } };

// Verteilung der Empfehlungen nach einem beliebigen Gruppierungsfeld
const verteilungNach = (feld, extra = []) => [
  { $match: { 'bewertung.empfehlung': { $exists: true } } },
  {
    $group: {
      _id: feld,
      anzahl: { $sum: 1 },
      kiSinnvoll: ZAEHLE('KI_SINNVOLL'),
      kiAssistenz: ZAEHLE('KI_ASSISTENZ'),
      klassisch: ZAEHLE('KLASSISCH'),
      manuell: ZAEHLE('MANUELL'),
      unklar: ZAEHLE('UNKLAR'),
      kiGesamt: ZAEHLE_KI,
      avgNutzwert: { $avg: '$bewertung.nutzwert' }
    }
  },
  {
    $addFields: {
      kiQuote: { $round: [{ $multiply: [{ $divide: ['$kiGesamt', '$anzahl'] }, 100] }, 0] },
      assistenzAnteilBeiKi: {
        $cond: [{ $gt: ['$kiGesamt', 0] }, { $round: [{ $multiply: [{ $divide: ['$kiAssistenz', '$kiGesamt'] }, 100] }, 0] }, null]
      },
      avgNutzwert: { $round: ['$avgNutzwert', 1] }
    }
  },
  ...extra
];

// 12-Monats-Gesamtkosten pro Lösungsansatz (wird in zwei Pipelines wiederverwendet)
const TCO_FELD = {
  $map: {
    input: '$loesungsansaetze',
    as: 'l',
    in: {
      typ: '$$l.typ',
      genauigkeit: '$$l.genauigkeit',
      tco: {
        $add: [
          '$$l.einmalaufwandCHF',
          { $multiply: [12, '$kriterien.fallvolumenProMonat', '$$l.laufendeKostenProFall'] }
        ]
      }
    }
  }
};
const MIN_TCO = (typen) => ({
  $min: {
    $map: {
      input: { $filter: { input: '$tco', as: 't', cond: { $in: ['$$t.typ', typen] } } },
      as: 't',
      in: '$$t.tco'
    }
  }
});

const AUSWERTUNGEN = [
  {
    id: 'uebersicht',
    titel: 'Gesamtübersicht',
    frage: 'Wie verteilen sich alle Use Cases auf die fünf Empfehlungen?',
    typ: 'kpi',
    pipeline: [
      {
        $facet: {
          gesamt: [{ $group: { _id: null, anzahl: { $sum: 1 }, avgNutzwert: { $avg: '$bewertung.nutzwert' } } }],
          nachEmpfehlung: [
            { $group: { _id: '$bewertung.empfehlung', anzahl: { $sum: 1 }, avgNutzwert: { $avg: '$bewertung.nutzwert' } } },
            { $sort: { anzahl: -1 } }
          ],
          top5: [
            { $match: { 'bewertung.geeignet': true } },
            { $sort: { 'bewertung.nutzwert': -1 } },
            { $limit: 5 },
            { $project: { titel: 1, branche: 1, nutzwert: '$bewertung.nutzwert', empfehlung: '$bewertung.empfehlung' } }
          ]
        }
      }
    ]
  },
  {
    id: 'branchen',
    titel: 'Empfehlungen nach Branche',
    frage: 'In welchen Branchen wird KI am häufigsten empfohlen?',
    typ: 'verteilung',
    pipeline: verteilungNach('$branche', [{ $sort: { kiQuote: -1, anzahl: -1 } }])
  },
  {
    id: 'problemtypen',
    titel: 'Nutzwert nach Problemtyp',
    frage: 'Welche Problemtypen erzielen den höchsten Nutzwert?',
    typ: 'verteilung',
    pipeline: verteilungNach('$problemtyp', [{ $sort: { avgNutzwert: -1 } }])
  },
  {
    id: 'risiko',
    titel: 'Empfehlung nach Risikostufe',
    frage: 'Bei welchen Risiken wird KI nur als Assistenz empfohlen?',
    typ: 'verteilung',
    pipeline: verteilungNach('$risiko', [
      { $addFields: { reihenfolge: { $indexOfArray: [['Niedrig', 'Mittel', 'Hoch'], '$_id'] } } },
      { $sort: { reihenfolge: 1 } },
      { $project: { reihenfolge: 0 } }
    ])
  },
  {
    id: 'fehlertoleranz',
    titel: 'Empfehlung nach Fehlertoleranz',
    frage: 'Wie verändert die Fehlertoleranz die Entscheidung?',
    typ: 'verteilung',
    pipeline: verteilungNach('$kriterien.fehlertoleranz', [
      { $addFields: { reihenfolge: { $indexOfArray: [['niedrig', 'mittel', 'hoch'], '$_id'] } } },
      { $sort: { reihenfolge: 1 } },
      { $project: { reihenfolge: 0 } }
    ])
  },
  {
    id: 'datenstruktur',
    titel: 'Rolle der Datenstruktur',
    frage: 'Welche Rolle spielt die Struktur der Daten?',
    typ: 'verteilung',
    pipeline: verteilungNach('$kriterien.datenstruktur', [{ $sort: { avgNutzwert: -1 } }])
  },
  {
    id: 'volumen',
    titel: 'Fallvolumen vs. Nutzwert',
    frage: 'Ist KI besonders bei grossen Datenmengen nützlich? Ab welchem Volumen lohnt sich Automatisierung?',
    typ: 'buckets',
    pipeline: [
      {
        $bucket: {
          groupBy: '$kriterien.fallvolumenProMonat',
          boundaries: [0, 50, 500, 5000, 50000, 5000000, Number.MAX_SAFE_INTEGER],
          default: 'unbekannt',
          output: {
            anzahl: { $sum: 1 },
            avgNutzwert: { $avg: '$bewertung.nutzwert' },
            kiGesamt: ZAEHLE_KI,
            manuell: ZAEHLE('MANUELL'),
            klassisch: ZAEHLE('KLASSISCH'),
            beispiele: { $push: '$titel' }
          }
        }
      },
      {
        $addFields: {
          avgNutzwert: { $round: ['$avgNutzwert', 1] },
          kiQuote: { $round: [{ $multiply: [{ $divide: ['$kiGesamt', '$anzahl'] }, 100] }, 0] },
          beispiele: { $slice: ['$beispiele', 3] }
        }
      }
    ]
  },
  {
    id: 'korrelation',
    titel: 'Korrelation Datenmenge ↔ Nutzwert',
    frage: 'Wie stark hängen Datenmenge und Nutzenbewertung zusammen?',
    typ: 'korrelation',
    pipeline: [
      { $match: { 'kriterien.fallvolumenProMonat': { $gt: 0 }, 'bewertung.nutzwert': { $exists: true } } },
      { $project: { x: { $log10: '$kriterien.fallvolumenProMonat' }, y: '$bewertung.nutzwert' } },
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          sx: { $sum: '$x' }, sy: { $sum: '$y' },
          sxy: { $sum: { $multiply: ['$x', '$y'] } },
          sxx: { $sum: { $multiply: ['$x', '$x'] } },
          syy: { $sum: { $multiply: ['$y', '$y'] } }
        }
      },
      {
        $project: {
          _id: 0,
          n: 1,
          r: {
            $round: [{
              $divide: [
                { $subtract: [{ $multiply: ['$n', '$sxy'] }, { $multiply: ['$sx', '$sy'] }] },
                {
                  $sqrt: {
                    $multiply: [
                      { $subtract: [{ $multiply: ['$n', '$sxx'] }, { $multiply: ['$sx', '$sx'] }] },
                      { $subtract: [{ $multiply: ['$n', '$syy'] }, { $multiply: ['$sy', '$sy'] }] }
                    ]
                  }
                }
              ]
            }, 2]
          }
        }
      }
    ]
  },
  {
    id: 'hochNutzenHochRisiko',
    titel: 'Hoher Nutzen, aber hohes Risiko',
    frage: 'Welche Use Cases haben einen hohen Nutzen, aber auch ein hohes Risiko?',
    typ: 'liste',
    pipeline: [
      {
        $match: {
          'bewertung.nutzwert': { $gte: 55 },
          $or: [{ risiko: 'Hoch' }, { 'kriterien.fehlertoleranz': 'niedrig' }]
        }
      },
      { $sort: { 'bewertung.nutzwert': -1 } },
      {
        $project: {
          titel: 1, branche: 1, risiko: 1,
          fehlertoleranz: '$kriterien.fehlertoleranz',
          nutzwert: '$bewertung.nutzwert',
          empfehlung: '$bewertung.empfehlung'
        }
      },
      { $limit: 10 }
    ]
  },
  {
    id: 'loesungsansaetze',
    titel: 'Lösungsansätze im Vergleich',
    frage: 'Wie unterscheiden sich Manuell, Regelbasiert, KI und Hybrid bei Aufwand, Kosten und Genauigkeit?',
    typ: 'verteilung',
    pipeline: [
      { $unwind: '$loesungsansaetze' },
      {
        $group: {
          _id: '$loesungsansaetze.typ',
          anzahl: { $sum: 1 },
          avgEinmalaufwand: { $avg: '$loesungsansaetze.einmalaufwandCHF' },
          avgKostenProFall: { $avg: '$loesungsansaetze.laufendeKostenProFall' },
          avgGenauigkeit: { $avg: '$loesungsansaetze.genauigkeit' }
        }
      },
      {
        $project: {
          anzahl: 1,
          avgEinmalaufwand: { $round: ['$avgEinmalaufwand', 0] },
          avgKostenProFall: { $round: ['$avgKostenProFall', 2] },
          avgGenauigkeit: { $round: ['$avgGenauigkeit', 1] }
        }
      },
      { $sort: { avgEinmalaufwand: 1 } }
    ]
  },
  {
    id: 'regelmaschine',
    titel: 'Wo wäre eine einfache Regelmaschine wirtschaftlicher?',
    frage: 'Bei welchen Use Cases ist die Regel-Lösung über 12 Monate günstiger als KI/Hybrid – bei ähnlicher Genauigkeit?',
    typ: 'liste',
    pipeline: [
      { $match: { 'kriterien.fallvolumenProMonat': { $gt: 0 }, 'loesungsansaetze.1': { $exists: true } } },
      { $addFields: { tco: TCO_FELD } },
      {
        $addFields: {
          tcoRegel: MIN_TCO(['Regelbasiert']),
          tcoKi: MIN_TCO(['KI', 'Hybrid']),
          genRegel: { $max: { $map: { input: { $filter: { input: '$tco', as: 't', cond: { $eq: ['$$t.typ', 'Regelbasiert'] } } }, as: 't', in: '$$t.genauigkeit' } } },
          genKi: { $max: { $map: { input: { $filter: { input: '$tco', as: 't', cond: { $in: ['$$t.typ', ['KI', 'Hybrid']] } } }, as: 't', in: '$$t.genauigkeit' } } }
        }
      },
      {
        $match: {
          tcoRegel: { $ne: null }, tcoKi: { $ne: null },
          $expr: { $and: [{ $lt: ['$tcoRegel', '$tcoKi'] }, { $gte: ['$genRegel', { $subtract: ['$genKi', 5] }] }] }
        }
      },
      {
        $project: {
          titel: 1, branche: 1,
          empfehlung: '$bewertung.empfehlung',
          tcoRegel: { $round: ['$tcoRegel', 0] },
          tcoKi: { $round: ['$tcoKi', 0] },
          ersparnisCHF: { $round: [{ $subtract: ['$tcoKi', '$tcoRegel'] }, 0] },
          genauigkeitRegel: '$genRegel', genauigkeitKi: '$genKi'
        }
      },
      { $sort: { ersparnisCHF: -1 } },
      { $limit: 15 }
    ]
  },
  {
    id: 'amortisation',
    titel: 'Amortisation nach Fallvolumen',
    frage: 'Ab welchem Fallvolumen lohnt sich die Automatisierung (Break-even gegenüber manueller Bearbeitung)?',
    typ: 'buckets',
    pipeline: [
      { $match: { 'kriterien.fallvolumenProMonat': { $gt: 0 } } },
      { $addFields: { manuell: { $first: { $filter: { input: '$loesungsansaetze', as: 'l', cond: { $eq: ['$$l.typ', 'Manuell'] } } } } } },
      { $match: { manuell: { $ne: null } } },
      { $unwind: '$loesungsansaetze' },
      { $match: { 'loesungsansaetze.typ': { $in: ['Regelbasiert', 'KI', 'Hybrid'] } } },
      { $match: { $expr: { $gt: ['$manuell.laufendeKostenProFall', '$loesungsansaetze.laufendeKostenProFall'] } } },
      {
        $project: {
          fallvolumen: '$kriterien.fallvolumenProMonat',
          typ: '$loesungsansaetze.typ',
          breakEvenMonate: {
            $divide: [
              '$loesungsansaetze.einmalaufwandCHF',
              { $multiply: ['$kriterien.fallvolumenProMonat', { $subtract: ['$manuell.laufendeKostenProFall', '$loesungsansaetze.laufendeKostenProFall'] }] }
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$fallvolumen',
          boundaries: [0, 50, 500, 5000, 50000, 5000000, Number.MAX_SAFE_INTEGER],
          default: 'unbekannt',
          output: {
            anzahl: { $sum: 1 },
            avgBreakEvenMonate: { $avg: '$breakEvenMonate' },
            minBreakEvenMonate: { $min: '$breakEvenMonate' }
          }
        }
      },
      { $addFields: { avgBreakEvenMonate: { $round: ['$avgBreakEvenMonate', 1] }, minBreakEvenMonate: { $round: ['$minBreakEvenMonate', 1] } } }
    ]
  },
  {
    id: 'tags',
    titel: 'Häufigste Tags',
    frage: 'Welche Themen treten bei den Use Cases am häufigsten auf?',
    typ: 'verteilung',
    pipeline: [
      { $unwind: '$tags' },
      { $group: { _id: '$tags', anzahl: { $sum: 1 }, avgNutzwert: { $avg: '$bewertung.nutzwert' } } },
      { $addFields: { avgNutzwert: { $round: ['$avgNutzwert', 1] } } },
      { $sort: { anzahl: -1, _id: 1 } },
      { $limit: 10 }
    ]
  }
];

const finde = (id) => AUSWERTUNGEN.find((a) => a.id === id);

async function fuehreAus(id) {
  const def = finde(id);
  if (!def) return null;
  const daten = await UseCase.aggregate(def.pipeline);
  return {
    id: def.id, titel: def.titel, frage: def.frage, typ: def.typ,
    pipeline: def.pipeline, daten
  };
}

const katalog = () => AUSWERTUNGEN.map(({ id, titel, frage, typ }) => ({ id, titel, frage, typ }));

module.exports = { AUSWERTUNGEN, finde, fuehreAus, katalog };
