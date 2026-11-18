import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { HttpError } from '../middleware/errorHandler.js';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const secretFor = (kind) => {
  const secret = process.env[kind === 'access' ? 'ACCESS_TOKEN_SECRET' : 'REFRESH_TOKEN_SECRET'];
  if (!secret || secret.length < 32) throw new HttpError(503, 'auth_configuration_error', `Set a strong ${kind.toUpperCase()}_TOKEN_SECRET in the server environment.`);
  return secret;
};

function sign(payload, kind, ttlSeconds) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = encode({ ...payload, typ: kind, iat: issuedAt, exp: issuedAt + ttlSeconds, jti: randomUUID() });
  const input = `${header}.${body}`;
  const signature = createHmac('sha256', secretFor(kind)).update(input).digest('base64url');
  return { token: `${input}.${signature}`, claims: JSON.parse(Buffer.from(body, 'base64url').toString()) };
}

export function createAccessToken(userId) {
  return sign({ sub: String(userId) }, 'access', ACCESS_TTL_SECONDS).token;
}

export function createRefreshToken(userId) {
  return sign({ sub: String(userId) }, 'refresh', REFRESH_TTL_SECONDS);
}

export function verifyJwt(token, expectedKind) {
  try {
    const [headerPart, bodyPart, signaturePart, extra] = String(token || '').split('.');
    if (!headerPart || !bodyPart || !signaturePart || extra) throw new Error('Malformed JWT');
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString());
    const claims = JSON.parse(Buffer.from(bodyPart, 'base64url').toString());
    if (header.alg !== 'HS256' || header.typ !== 'JWT' || claims.typ !== expectedKind || !claims.sub || !claims.jti || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error('Invalid JWT claims');
    const expected = createHmac('sha256', secretFor(expectedKind)).update(`${headerPart}.${bodyPart}`).digest();
    const received = Buffer.from(signaturePart, 'base64url');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error('Invalid JWT signature');
    return claims;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'unauthenticated', 'Session is invalid or has expired');
  }
}
