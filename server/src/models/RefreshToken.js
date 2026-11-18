// Stores only one-time refresh JWT identifiers, never the raw refresh token.
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';

const refreshTokenSchema = new mongoose.Schema({
  jtiHash: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { versionKey: false });

const RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
const hashJti = (jti) => createHash('sha256').update(jti).digest('hex');
const ensureDatabase = () => {
  if (mongoose.connection.readyState !== 1) throw new HttpError(503, 'database_unavailable', 'Account storage is unavailable. Try again when the database is connected.');
};

export default {
  init() { return RefreshToken.init(); },
  async issue(jti, userId, expiresAt) {
    ensureDatabase();
    await RefreshToken.create({ jtiHash: hashJti(jti), userId: String(userId), expiresAt });
  },
  async consume(jti, userId) {
    ensureDatabase();
    const result = await RefreshToken.deleteOne({ jtiHash: hashJti(jti), userId: String(userId), expiresAt: { $gt: new Date() } });
    return result.deletedCount === 1;
  },
};
