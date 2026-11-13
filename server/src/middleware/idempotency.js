import crypto from 'crypto';
import IdempotencyKey from '../models/idempotencyModel.js';

const err = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

export default async function idempotency(req, res, next) {
  const key = req.get('Idempotency-Key');
  if (!key || key.length > 128) {
    return err(res, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header (max 128 chars)');
  }

  const tenantId = String(req.tenant?._id || req.tenantId || req.get('x-tenant-id'));
  const userId = String(req.user?._id || req.user?.id);
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');

  let record;
  try {
    // Atomic claim: if 10 requests arrive together, exactly one insert succeeds.
    record = await IdempotencyKey.create({ tenantId, userId, key, requestHash });
  } catch (e) {
    if (e.code !== 11000) return next(e);

    const existing = await IdempotencyKey.findOne({ tenantId, userId, key });
    if (!existing) return err(res, 409, 'RETRY', 'Please retry');
    if (existing.requestHash !== requestHash) {
      return err(res, 422, 'IDEMPOTENCY_KEY_REUSED', 'Key was used with a different request body');
    }
    if (existing.status === 'completed') {
      res.set('Idempotent-Replayed', 'true');
      return res.status(existing.responseStatus).json(existing.responseBody);
    }
    res.set('Retry-After', '1');
    return err(res, 409, 'REQUEST_IN_PROGRESS', 'The original request is still processing');
  }

  // Capture the response so duplicates get the identical reply.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.json = originalJson;
    const status = res.statusCode;
    const save = status >= 500
      ? IdempotencyKey.deleteOne({ _id: record._id }) // server failure: allow a clean retry
      : IdempotencyKey.updateOne(
          { _id: record._id },
          { $set: { status: 'completed', responseStatus: status, responseBody: body } }
        );
    save.catch(() => {}).finally(() => originalJson(body));
    return res;
  };
  next();
}
