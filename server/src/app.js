// Shared platform API plus plan-controlled commerce modules.
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import storeExportRoutes from './routes/storeExportRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import inventoryNaiveRoutes from './modules/naive/naiveRoutes.js';
import paymentNaiveRoutes from './routes/naiveRoutes.js';
import tenantContext from './middleware/tenantContext.js';
import { globalRateLimit, tenantRateLimit } from './middleware/tokenBucketRateLimit.js';

const app = express();
const enabled = (name, defaultValue = true) => process.env[name] === undefined ? defaultValue : process.env[name] === 'true';
const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) app.set('trust proxy', trustedProxyHops);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Webhooks require their untouched raw body for HMAC verification, so mount them before JSON parsing.
if (enabled('CHECKOUT_ENABLED')) {
  app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '100kb' }), webhookRoutes);
}

app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRoutes);

// Platform builder/export is separate from the generated customer commerce API.
app.use('/api/store-builder', storeExportRoutes);
app.use('/api', tenantContext, globalRateLimit, tenantRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/products', productRoutes);
if (enabled('ADMIN_REPORTS_ENABLED')) app.use('/api/admin', adminRoutes);
if (enabled('INVENTORY_ENABLED')) app.use('/api/inventory', inventoryRoutes);
if (enabled('CHECKOUT_ENABLED')) app.use('/api/checkout', checkoutRoutes);

// Attack comparison routes are development-only and plan-gated in exported stores.
if (process.env.NODE_ENV !== 'production' && enabled('ATTACK_DEMO_ENABLED')) {
  app.use('/api/naive', inventoryNaiveRoutes);
  app.use('/api/naive', paymentNaiveRoutes);
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
