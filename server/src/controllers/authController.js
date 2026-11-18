// Owner: Member 1 — MVC controller for register, login, logout and current-user actions.
import { HttpError } from '../middleware/errorHandler.js';
import refreshTokenModel from '../models/RefreshToken.js';
import userModel from '../models/User.js';
import { ACCESS_TTL_SECONDS, createAccessToken, createRefreshToken, verifyJwt } from '../services/jwtTokens.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFRESH_COOKIE = 'minuto_refresh';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
}

function readRefreshCookie(req) {
  const cookieHeader = req.get('cookie') || '';
  const item = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  return item ? decodeURIComponent(item.slice(REFRESH_COOKIE.length + 1)) : '';
}

async function createAuthResponse(user, res, status) {
  const accessToken = createAccessToken(user.id);
  const refresh = createRefreshToken(user.id);
  await refreshTokenModel.issue(refresh.claims.jti, user.id, new Date(refresh.claims.exp * 1000));
  setRefreshCookie(res, refresh.token);
  res.status(status).json({ user: userModel.toPublic(user), accessToken, token: accessToken, expiresIn: ACCESS_TTL_SECONDS });
}

export function checkRegistration({ name, email, password }) {
  const problems = [];
  if (typeof name !== 'string' || !name.trim() || name.length > 80) {
    problems.push('name is required and must be at most 80 characters');
  }
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
    problems.push('email must be a valid email address');
  }
  // The upper bound keeps password hashing cost predictable.
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    problems.push('password must be between 8 and 128 characters');
  }
  return problems;
}

export function checkLogin({ email, password }) {
  const problems = [];
  if (typeof email !== 'string' || !email.trim()) problems.push('email is required');
  if (typeof password !== 'string' || !password || password.length > 128) problems.push('password is required and must be at most 128 characters');
  return problems;
}

export async function register(req, res) {
  // Only these fields are read; a `role` in the body is ignored, so every sign-up is a customer.
  const { name, email, password } = req.body;
  const user = await userModel.create({ name, email, password });
  if (!user) {
    throw new HttpError(409, 'email_taken', 'An account with this email already exists');
  }
  await createAuthResponse(user, res, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel.verifyCredentials(email, password);
  if (!user) {
    throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');
  }
  await createAuthResponse(user, res, 200);
}

export async function logout(req, res) {
  const refreshToken = readRefreshCookie(req);
  if (refreshToken) {
    try {
      const claims = verifyJwt(refreshToken, 'refresh');
      await refreshTokenModel.consume(claims.jti, claims.sub);
    } catch { /* Expired or invalid refresh tokens are simply cleared. */ }
  }
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined });
  res.status(204).end();
}

export async function refresh(req, res) {
  const token = readRefreshCookie(req);
  if (!token) throw new HttpError(401, 'unauthenticated', 'Sign in to continue');
  const claims = verifyJwt(token, 'refresh');
  const consumed = await refreshTokenModel.consume(claims.jti, claims.sub);
  if (!consumed) throw new HttpError(401, 'unauthenticated', 'Refresh token has already been used or revoked');
  const user = await userModel.findById(claims.sub);
  if (!user) throw new HttpError(401, 'unauthenticated', 'Account no longer exists');
  await createAuthResponse(user, res, 200);
}

export function getCurrentUser(req, res) {
  res.status(200).json({ user: req.user });
}
