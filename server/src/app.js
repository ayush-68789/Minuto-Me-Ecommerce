// Shared API wiring for the builder and demo commerce modules.
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import productRoutes from './routes/productRoutes.js';
import storeExportRoutes from './routes/storeExportRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import rateLimitMetricsRoutes from './routes/rateLimitMetricsRoutes.js';
import inventoryNaiveRoutes from './modules/naive/naiveRoutes.js';
import paymentNaiveRoutes from './routes/naiveRoutes.js';
import tenantContext from './middleware/tenantContext.js';
import { globalRateLimit, tenantRateLimit, webhookIpRateLimit } from './middleware/tokenBucketRateLimit.js';
import { configureTrustedProxy } from './config/trustedProxy.js';

const app = express();
const enabled = (name, defaultValue = true) => process.env[name] === undefined ? defaultValue : process.env[name] === 'true';
const rateLimitingEnabled = enabled('RATE_LIMITING_ENABLED', false) && String(process.env.RATE_LIMIT_PLAN || '').toLowerCase() === 'pro';
configureTrustedProxy(app);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['X-Store-Plan', 'X-Store-Layout', 'X-Store-Features'],
}));
app.use('/api/health', healthRoutes);

app.use('/api', tenantContext);
// The Store Studio platform runs without request throttling. Exported store
// backends opt in with RATE_LIMITING_ENABLED=true and their selected plan.
if (rateLimitingEnabled) app.use('/api', globalRateLimit, tenantRateLimit);

// Webhooks need raw bytes for HMAC checks, and receive a separate IP bucket too.
if (enabled('CHECKOUT_ENABLED')) app.use('/api/webhooks', ...(rateLimitingEnabled ? [webhookIpRateLimit] : []), express.raw({ type: 'application/json', limit: '100kb' }), webhookRoutes);

app.use(express.json({
  limit: process.env.JSON_BODY_LIMIT || '256kb',
  verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); },
}));
app.use(express.urlencoded({ extended: false, limit: process.env.URLENCODED_BODY_LIMIT || '32kb' }));
app.use('/api/store-builder', storeExportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/products', productRoutes);
if (rateLimitingEnabled) app.use('/api/admin/rate-limit-metrics', rateLimitMetricsRoutes);
if (enabled('ADMIN_REPORTS_ENABLED')) app.use('/api/admin', adminRoutes);
if (enabled('INVENTORY_ENABLED')) app.use('/api/inventory', inventoryRoutes);
if (enabled('CHECKOUT_ENABLED')) app.use('/api/checkout', checkoutRoutes);
if (process.env.NODE_ENV !== 'production' && enabled('ATTACK_DEMO_ENABLED')) {
  app.use('/api/naive', inventoryNaiveRoutes);
  app.use('/api/naive', paymentNaiveRoutes);
}
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
