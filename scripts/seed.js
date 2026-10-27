// Befüllt die Datenbank mit dem Beispieldatensatz (data/usecases.js).
//   node scripts/seed.js            -> nur wenn die Collection leer ist
//   node scripts/seed.js --reset    -> löscht ALLE vorhandenen Use Cases und lädt neu
const mongoose = require('mongoose');
const UseCase = require('../models/UseCase');
const { erstellen } = require('../services/usecases');
const daten = require('../data/usecases');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ki_usecases';

async function seed({ reset = false } = {}) {
  await UseCase.syncIndexes();
  const vorhanden = await UseCase.countDocuments();
  if (vorhanden && !reset) {
    console.log(`Abbruch: ${vorhanden} Use Cases vorhanden. Mit --reset löschen und neu laden.`);
    return 0;
  }
  if (reset) await UseCase.deleteMany({});
  for (const eintrag of daten) await erstellen(eintrag);
  return daten.length;
}

module.exports = { seed };

if (require.main === module) {
  mongoose.connect(mongoUri)
    .then(() => seed({ reset: process.argv.includes('--reset') }))
    .then((n) => { if (n) console.log(`${n} Use Cases in ${mongoUri} geladen.`); })
    .catch((err) => { console.error(err); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
