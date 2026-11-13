// Owner: Shared — protected demo backend and Store Studio API.
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
import naiveRoutes from './modules/naive/naiveRoutes.js';
import tenantContext from './middleware/tenantContext.js';
import { globalRateLimit, tenantRateLimit } from './middleware/tokenBucketRateLimit.js';

const app = express();
const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) app.set('trust proxy', trustedProxyHops);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRoutes);

// Platform builder/export is separate from customer commerce rate limiting.
app.use('/api/store-builder', storeExportRoutes);
app.use('/api', tenantContext, globalRateLimit, tenantRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/products', productRoutes);
if (process.env.ADMIN_REPORTS_ENABLED !== 'false') app.use('/api/admin', adminRoutes);
if (process.env.INVENTORY_ENABLED !== 'false') app.use('/api/inventory', inventoryRoutes);

// Deliberately vulnerable comparison routes are development-only.
if (process.env.NODE_ENV !== 'production' && process.env.ATTACK_DEMO_ENABLED !== 'false') app.use('/api/naive', naiveRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
