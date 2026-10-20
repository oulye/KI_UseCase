const mongoose = require('mongoose');

const useCaseSchema = new mongoose.Schema({
  titel: String,
  beschreibung: String,
  nutzen: Number,
  aufwand: Number,
  zeitersparnis: Number,
  kostenersparnis: Number,
  technischeUmsetzbarkeit: Number,
  score: Number,
  branche: String,
  problemtyp: String,
  risiko: { type: String, enum: ['Niedrig', 'Mittel', 'Hoch'], default: 'Mittel' }
}, { timestamps: true });

module.exports = mongoose.model('UseCase', useCaseSchema);