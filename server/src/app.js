// Owner: M1 (everyone adds ONE line for their routes)
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import errorHandler from './middleware/errorHandler.js';
import { isDbReady } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import productRoutes from './routes/productRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import storefrontRoutes from './routes/storefrontRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const clientOrigins = new Set(
  String(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean)
);
app.use(cors({
  origin(origin, callback) {
    if (!origin || clientOrigins.has(origin)) return callback(null, true);
    return callback(new Error('This client origin is not allowed'));
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '3mb' })); // logos/banners uploaded from the store studio arrive as compressed data URLs
app.use(cookieParser());

// Database-aware Health Check
app.get('/api/health', (req, res) => {
  const dbOk = isDbReady();
  const statusCode = dbOk ? 200 : 503;
  res.status(statusCode).json({
    status: dbOk ? 'healthy' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);           // M1
app.use('/api/stores', storeRoutes);        // M1
app.use('/api/products', productRoutes);    // M4
app.use('/api/dashboard', dashboardRoutes); // M4
app.use('/api/orders', orderRoutes);        // M5
app.use('/api/storefront', storefrontRoutes); // M3
app.use('/api/catalog', catalogRoutes);      // M3 catalog & search
app.use('/api/upload', uploadRoutes);        // M2 upload
app.use('/api/reviews', reviewRoutes);

app.use(errorHandler);
export default app;
