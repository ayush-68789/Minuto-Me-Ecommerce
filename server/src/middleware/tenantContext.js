// Owner: M1/M2 — derive a validated tenant selector; never trust body/query tenant IDs.
import { HttpError } from './errorHandler.js';

const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;

export default function tenantContext(req, _res, next) {
  const tenantId = req.get('x-tenant-id') || 'default';
  if (!TENANT_ID_PATTERN.test(tenantId)) {
    return next(new HttpError(400, 'invalid_tenant', 'Tenant identifier is invalid'));
  }
  req.tenantId = tenantId;
  return next();
}
