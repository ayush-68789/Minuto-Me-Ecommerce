// Owner: M1 (everyone adds ONE line for their routes)
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import productRoutes from './routes/productRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import storefrontRoutes from './routes/storefrontRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '3mb' })); // logos/banners uploaded from the store studio arrive as compressed data URLs
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true });
});

// Routes
app.use('/api/auth', authRoutes);           // M1
app.use('/api/stores', storeRoutes);        // M1
app.use('/api/products', productRoutes);    // M4
app.use('/api/dashboard', dashboardRoutes); // M4
app.use('/api/orders', orderRoutes);        // M5
app.use('/api/payments', paymentRoutes);    // M5
app.use('/api/storefront', storefrontRoutes); // M3

app.use(errorHandler);
export default app;
