// Owner: Member 1 — shared Express setup and middleware integration.
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import naiveRoutes from './modules/naive/naiveRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRoutes);
app.use('/api/inventory', inventoryRoutes);

// INTENTIONALLY VULNERABLE demo endpoint - never mounted in production.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/naive', naiveRoutes);
}

export default app;
