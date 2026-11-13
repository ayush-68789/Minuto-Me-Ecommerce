// One-line integration for Member 3's work.
//
// In app.js add these two lines (the import at the top, the call BEFORE app.use(express.json(...))):
//
//     import { mount as mountMember3 } from './member3.js';
//     mountMember3(app);
//
// The webhook route needs the raw request bytes to verify the signature,
// and a global JSON parser placed earlier would destroy them.
import express from 'express';
import IdempotencyKey from './models/idempotencyModel.js';
import WebhookEvent from './models/webhookEventModel.js';
import Payment from './models/paymentModel.js';
import webhookRoutes from './routes/webhookRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import naiveRoutes from './routes/naiveRoutes.js';

export function mount(app) {
  // Webhook: raw body (for HMAC) + small size limit
  app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '100kb' }), webhookRoutes);

  // Checkout + naive demo endpoints: own JSON parser, so order vs. global parser doesn't matter
  app.use('/api/checkout', express.json({ limit: '100kb' }), checkoutRoutes);
  app.use('/api/naive', express.json({ limit: '100kb' }), naiveRoutes);

  // Make sure unique indexes exist (they are what stops duplicates)
  Promise.all([IdempotencyKey.init(), WebhookEvent.init(), Payment.init()])
    .catch((e) => console.error('[member3] index init failed:', e.message));
}

export default mount;
