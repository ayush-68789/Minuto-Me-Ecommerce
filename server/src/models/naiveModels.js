import mongoose from 'mongoose';

// Deliberately naive ("vibe-coded") collections, kept separate so demo counts stay clean.
// No unique indexes on purpose.
export const NaiveOrder = mongoose.models.NaiveOrder ||
  mongoose.model('NaiveOrder', new mongoose.Schema({}, { strict: false, timestamps: true }));

export const NaivePayment = mongoose.models.NaivePayment ||
  mongoose.model('NaivePayment', new mongoose.Schema({}, { strict: false, timestamps: true }));
