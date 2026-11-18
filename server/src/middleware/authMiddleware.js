// Owner: Member 1 — verifies the bearer session token and sets req.user.
import userModel from '../models/User.js';
import { HttpError } from './errorHandler.js';
import { verifyJwt } from '../services/jwtTokens.js';

export function authenticate(req, _res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return next(new HttpError(401, 'unauthenticated', 'Sign in to continue'));
  }

  Promise.resolve()
    .then(async () => {
      const claims = verifyJwt(token, 'access');
      const user = await userModel.findById(claims.sub);
      if (!user) throw new HttpError(401, 'unauthenticated', 'Account no longer exists');
      req.user = userModel.toPublic(user);
    })
    .then(() => next())
    .catch(next);
}
