// FALLBACK ONLY. Used when Member 4's auth and Member 5's tenant middleware don't exist yet.
// It trusts x-user-id / x-tenant-id headers, which is NOT secure. Remove once real auth is wired in.
export default function devContext(req, res, next) {
  const tenantId = req.get('x-tenant-id');
  const userId = req.get('x-user-id');
  if (!tenantId || !userId) {
    return res.status(401).json({ error: { code: 'NO_CONTEXT', message: 'x-tenant-id and x-user-id headers required (dev mode)' } });
  }
  req.tenantId = tenantId;
  req.user = { _id: userId };
  next();
}
