// Owner: Member 1 — MongoDB-backed opaque bearer sessions. Only token hashes are stored.
import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { versionKey: false });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const ensureDatabase = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new HttpError(503, 'database_unavailable', 'Account storage is unavailable. Start the local MongoDB server and try again.');
  }
};

const sessionModel = {
  init() { return Session.init(); },

  async create(userId) {
    ensureDatabase();
    const token = randomBytes(32).toString('base64url');
    await Session.create({ tokenHash: hashToken(token), userId: String(userId), expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
    return token;
  },

  async findUserId(token) {
    ensureDatabase();
    const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).select('userId').lean();
    return session?.userId || null;
  },

  async revoke(token) {
    ensureDatabase();
    await Session.deleteOne({ tokenHash: hashToken(token) });
  },
};

export default sessionModel;
