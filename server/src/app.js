// Owner: Member 1 — shared Express setup and middleware integration.
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import naiveRoutes from './routes/naiveRoutes.js';
import IdempotencyKey from './models/idempotencyModel.js';
import WebhookEvent from './models/webhookEventModel.js';
import Payment from './models/paymentModel.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '100kb' }), webhookRoutes);
app.use('/api/checkout', express.json({ limit: '100kb' }), checkoutRoutes);
app.use('/api/naive', express.json({ limit: '100kb' }), naiveRoutes);
Promise.all([IdempotencyKey.init(), WebhookEvent.init(), Payment.init()])
     .catch((e) => console.error('[member3] index init failed:', e.message));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRoutes);

export default app;
