// Owner: Member 1 — MVC model for login sessions (opaque bearer tokens).
// In-memory like User; only a hash of each token is kept, so stored sessions cannot be replayed.
import { createHash, randomBytes } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const sessionsByTokenHash = new Map();

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function removeExpired(now) {
  for (const [tokenHash, session] of sessionsByTokenHash) {
    if (session.expiresAt <= now) sessionsByTokenHash.delete(tokenHash);
  }
}

const sessionModel = {
  create(userId) {
    const now = Date.now();
    removeExpired(now);
    const token = randomBytes(32).toString('base64url');
    sessionsByTokenHash.set(hashToken(token), { userId, expiresAt: now + SESSION_TTL_MS });
    return token;
  },

  findUserId(token) {
    const session = sessionsByTokenHash.get(hashToken(token));
    if (!session || session.expiresAt <= Date.now()) return null;
    return session.userId;
  },

  revoke(token) {
    sessionsByTokenHash.delete(hashToken(token));
  },
};

export default sessionModel;
