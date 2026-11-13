// Owner: Member 1 — verifies the bearer session token and sets req.user.
import sessionModel from '../models/Session.js';
import userModel from '../models/User.js';
import { HttpError } from './errorHandler.js';

export function authenticate(req, _res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') {
    return next(new HttpError(401, 'unauthenticated', 'Sign in to continue'));
  }

  // The user is re-read on every request so role changes and deletions apply immediately.
  const userId = sessionModel.findUserId(token);
  const user = userId ? userModel.findById(userId) : null;
  if (!user) {
    return next(new HttpError(401, 'unauthenticated', 'Session is invalid or has expired'));
  }

  req.user = userModel.toPublic(user);
  req.token = token;
  return next();
}
