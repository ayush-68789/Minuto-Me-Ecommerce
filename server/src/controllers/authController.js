// Owner: Member 1 — MVC controller for register, login, logout and current-user actions.
import { HttpError } from '../middleware/errorHandler.js';
import sessionModel from '../models/Session.js';
import userModel from '../models/User.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (typeof password !== 'string' || !password) problems.push('password is required');
  return problems;
}

export async function register(req, res) {
  // Only these fields are read; a `role` in the body is ignored, so every sign-up is a customer.
  const { name, email, password } = req.body;
  const user = await userModel.create({ name, email, password });
  if (!user) {
    throw new HttpError(409, 'email_taken', 'An account with this email already exists');
  }
  res.status(201).json({ user: userModel.toPublic(user), token: sessionModel.create(user.id) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel.verifyCredentials(email, password);
  if (!user) {
    throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');
  }
  res.status(200).json({ user: userModel.toPublic(user), token: sessionModel.create(user.id) });
}

export function logout(req, res) {
  sessionModel.revoke(req.token);
  res.status(204).end();
}

export function getCurrentUser(req, res) {
  res.status(200).json({ user: req.user });
}
