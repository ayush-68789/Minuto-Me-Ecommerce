import { createHash, randomBytes } from 'node:crypto';
import RefreshToken from '../models/RefreshToken.js';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export async function issueRefreshToken(userId) {
  const token = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

// Refresh tokens are opaque, stored only as hashes, and revoked on sign-out.
// Their expiry slides forward on successful use, with a seven-day inactivity limit.
export async function renewRefreshToken(token) {
  if (!token) return null;
  const now = new Date();
  const session = await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(token), revokedAt: null, expiresAt: { $gt: now } },
    { $set: { expiresAt: new Date(now.getTime() + REFRESH_TTL_MS) } },
    { new: true }
  );
  return session;
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await RefreshToken.updateOne(
    { tokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeUserRefreshTokens(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}
