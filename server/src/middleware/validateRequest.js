// Owner: Member 1 — shared request validation adapter.
import { HttpError } from './errorHandler.js';

// `check` receives the JSON body and returns a list of problems; an empty list passes.
export default function validateRequest(check) {
  return (req, _res, next) => {
    const isObject = req.body && typeof req.body === 'object' && !Array.isArray(req.body);
    if (!isObject) req.body = {};
    const details = check(req.body);
    if (details.length > 0) {
      return next(new HttpError(400, 'validation_error', 'Request validation failed', details));
    }
    return next();
  };
}
