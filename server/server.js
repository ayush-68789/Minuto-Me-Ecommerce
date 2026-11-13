// Owner: Member 1 — Express server bootstrap and future infrastructure startup.
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Minuto Me API listening on port ${port}`);
  });
}

start();