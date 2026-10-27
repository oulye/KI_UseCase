// Ähnliche Use Cases: Kombination aus kategorialer Übereinstimmung, Tag-Überlappung
// und Nähe der Problemmerkmale. Berechnung vollständig in der Aggregation (ein Roundtrip).

const UseCase = require('../models/UseCase');

const naehe = (feld, ref) => ({
  $cond: [
    { $and: [{ $isNumber: `$kriterien.${feld}` }, { $isNumber: ref }] },
    { $subtract: [1, { $divide: [{ $abs: { $subtract: [`$kriterien.${feld}`, ref] } }, 4] }] },
    0
  ]
});

async function aehnlicheUseCases(referenz, limit = 5) {
  const k = referenz.kriterien || {};
  const tags = referenz.tags || [];

  const pipeline = [
    { $match: { _id: { $ne: referenz._id } } },
    {
      $addFields: {
        gemeinsameTags: { $setIntersection: [{ $ifNull: ['$tags', []] }, tags] },
        punkteBranche: { $cond: [{ $and: [{ $ne: [referenz.branche, ''] }, { $eq: ['$branche', referenz.branche] }] }, 10, 0] },
        punkteProblemtyp: { $cond: [{ $and: [{ $ne: [referenz.problemtyp, ''] }, { $eq: ['$problemtyp', referenz.problemtyp] }] }, 15, 0] }
      }
    },
    {
      $addFields: {
        punkteTags: { $min: [{ $multiply: [{ $size: '$gemeinsameTags' }, 10] }, 30] },
        punkteMerkmale: {
          $multiply: [
            45,
            { $divide: [{ $add: [naehe('regelkomplexitaet', k.regelkomplexitaet ?? null), naehe('variabilitaet', k.variabilitaet ?? null), naehe('datenverfuegbarkeit', k.datenverfuegbarkeit ?? null)] }, 3] }
          ]
        }
      }
    },
    { $addFields: { aehnlichkeit: { $round: [{ $add: ['$punkteBranche', '$punkteProblemtyp', '$punkteTags', '$punkteMerkmale'] }, 0] } } },
    { $match: { aehnlichkeit: { $gt: 0 } } },
    { $sort: { aehnlichkeit: -1, 'bewertung.nutzwert': -1 } },
    { $limit: limit },
    {
      $project: {
        titel: 1, branche: 1, problemtyp: 1, tags: 1, aehnlichkeit: 1, gemeinsameTags: 1,
        empfehlung: '$bewertung.empfehlung', nutzwert: '$bewertung.nutzwert'
      }
    }
  ];
  return UseCase.aggregate(pipeline);
}

// Volltextsuche (Text-Index, Stemming "german", Relevanz-Ranking nach textScore)
async function suche(q, limit = 20) {
  return UseCase.find(
    { $text: { $search: q } },
    { score: { $meta: 'textScore' }, titel: 1, beschreibung: 1, branche: 1, problemtyp: 1, tags: 1, bewertung: 1 }
  ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean();
}

module.exports = { aehnlicheUseCases, suche };
