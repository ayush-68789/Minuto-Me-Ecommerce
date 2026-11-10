// Owner: Member 1 — consistent JSON error responses for every API route.
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Express 4 does not forward rejected promises, so async controllers are wrapped.
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req, _res, next) {
  next(new HttpError(404, 'not_found', 'Resource not found'));
}

function sendError(res, status, code, message, details) {
  if (status === 401) res.set('WWW-Authenticate', 'Bearer');
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their four arguments.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'invalid_json', 'Request body is not valid JSON');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'payload_too_large', 'Request body is too large');
  }
  console.error(err);
  return sendError(res, 500, 'internal_error', 'Something went wrong');
}
