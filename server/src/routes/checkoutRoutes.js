import { Router } from 'express';
import { checkout } from '../controllers/checkoutController.js';
import idempotency from '../middleware/idempotency.js';
import devContext from '../middleware/m3DevContext.js';

const router = Router();

// Use the team's real auth + tenant middleware if they exist, else the dev fallback.
// Edit the file names below if Members 4 and 5 named theirs differently.
async function tryLoad(paths) {
  for (const p of paths) {
    try {
      const m = await import(p);
      const fn = m.default || m.authenticate || m.resolveTenant;
      if (typeof fn === 'function') return fn;
    } catch (e) {
      if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
    }
  }
  return null;
}

const authenticate = await tryLoad(['../middleware/auth.js', '../middleware/authMiddleware.js']);
const resolveTenant = await tryLoad(['../middleware/tenant.js', '../middleware/tenantMiddleware.js']);

const context = (authenticate && resolveTenant) ? [authenticate, resolveTenant] : [devContext];
console.log(`[member3] checkout using ${context.length === 2 ? 'team auth + tenant middleware' : 'DEV context (insecure, headers only)'}`);

// Final order after integration: rateLimit -> authenticate -> resolveTenant -> idempotency -> checkout
router.post('/', ...context, idempotency, checkout);

export default router;
