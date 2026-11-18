// Owner: Member 1 — MongoDB model for users, password hashes and roles.
import mongoose from 'mongoose';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from '../middleware/errorHandler.js';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
export const ROLES = Object.freeze({ CUSTOMER: 'customer', ADMIN: 'admin' });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ensureDatabase = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new HttpError(503, 'database_unavailable', 'Account storage is unavailable. Check the database connection and try again.');
  }
};

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

async function matchesHash(password, passwordHash) {
  const [salt, key] = passwordHash.split(':').map((part) => Buffer.from(part, 'hex'));
  return timingSafeEqual(key, await scryptAsync(password, salt, KEY_LENGTH));
}

const placeholderHash = await hashPassword(randomBytes(16).toString('hex'));

const userModel = {
  init() { return User.init(); },

  async create({ name, email, password, role = ROLES.CUSTOMER }) {
    ensureDatabase();
    const passwordHash = await hashPassword(password);
    try {
      return await User.create({ name: name.trim(), email: normalizeEmail(email), passwordHash, role });
    } catch (error) {
      if (error?.code === 11000) return null;
      throw error;
    }
  },

  async verifyCredentials(email, password) {
    ensureDatabase();
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');
    const matches = await matchesHash(password, user?.passwordHash || placeholderHash);
    return user && matches ? user : null;
  },

  async findById(id) {
    ensureDatabase();
    return User.findById(id).select('+passwordHash');
  },

  async list() {
    ensureDatabase();
    return User.find().select('+passwordHash').sort({ createdAt: -1 }).lean();
  },

  // Never serialize a user without this; it strips the password hash.
  toPublic({ _id, id, name, email, role, createdAt }) {
    return { id: String(id || _id), name, email, role, createdAt };
  },
};

export default userModel;
