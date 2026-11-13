// Owner: Member 1 — shared Express setup and middleware integration.
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import storeExportRoutes from './routes/storeExportRoutes.js';
import tenantContext from './middleware/tenantContext.js';
import { globalRateLimit, tenantRateLimit } from './middleware/tokenBucketRateLimit.js';

const app = express();
const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) {
  app.set('trust proxy', trustedProxyHops);
}

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRoutes);
// Platform store configuration/export is not part of a customer's protected commerce API.
app.use('/api/store-builder', storeExportRoutes);
app.use('/api', tenantContext, globalRateLimit, tenantRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
