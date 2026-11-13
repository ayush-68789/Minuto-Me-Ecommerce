// Owner: Member 1 — MVC model for users, password hashes and roles.
// In-memory until shared persistence is chosen; data resets when the server restarts.
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export const ROLES = Object.freeze({ CUSTOMER: 'customer', ADMIN: 'admin' });

const usersById = new Map();
const idsByEmail = new Map();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

async function matchesHash(password, passwordHash) {
  const [salt, key] = passwordHash.split(':').map((part) => Buffer.from(part, 'hex'));
  return timingSafeEqual(key, await scryptAsync(password, salt, KEY_LENGTH));
}

// Compared against when the email is unknown, so login timing does not reveal which emails exist.
const placeholderHash = await hashPassword(randomBytes(16).toString('hex'));

const userModel = {
  // Resolves to null when the email is already registered.
  async create({ name, email, password, role = ROLES.CUSTOMER }) {
    const passwordHash = await hashPassword(password);
    const normalizedEmail = normalizeEmail(email);
    if (idsByEmail.has(normalizedEmail)) return null;

    const user = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };
    usersById.set(user.id, user);
    idsByEmail.set(user.email, user.id);
    return user;
  },

  async verifyCredentials(email, password) {
    const user = usersById.get(idsByEmail.get(normalizeEmail(email)));
    const matches = await matchesHash(password, user ? user.passwordHash : placeholderHash);
    return user && matches ? user : null;
  },

  findById(id) {
    return usersById.get(id) || null;
  },

  list() {
    return [...usersById.values()];
  },

  // Never serialize a user without this; it strips the password hash.
  toPublic({ id, name, email, role, createdAt }) {
    return { id, name, email, role, createdAt };
  },
};

export default userModel;
