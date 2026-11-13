// Owner: Member 1 — admin/owner authorization. Use after `authenticate`.
import { ROLES } from '../models/User.js';
import { HttpError } from './errorHandler.js';

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'unauthenticated', 'Sign in to continue'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'forbidden', 'You do not have access to this resource'));
    }
    return next();
  };
}

export const requireAdmin = requireRole(ROLES.ADMIN);

// Ownership check for a loaded record. Controllers should answer 404 (not 403) when this
// fails so that another user's record IDs cannot be confirmed by probing.
export function canAccessOwned(user, ownerId) {
  return user.role === ROLES.ADMIN || user.id === ownerId;
}
