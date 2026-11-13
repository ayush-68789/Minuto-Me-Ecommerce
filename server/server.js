// Owner: Member 1 — Express server bootstrap and future infrastructure startup.
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';
import Product from './src/models/Product.js';
import Reservation from './src/models/Reservation.js';
import { startReservationSweeper } from './src/modules/inventory/reservationSweeper.js';

const port = Number(process.env.PORT || 5000);

// Connects to MongoDB. Inventory needs TRANSACTIONS, which only work on a replica set (or Atlas).
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in.');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');

  // Create collections/indexes now, so the first transactions never race with index creation.
  await Product.init();
  await Reservation.init();

  // "setName" exists on replica sets, "isdbgrid" means a sharded cluster. Neither -> standalone.
  const info = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!info.setName && info.msg !== 'isdbgrid') {
    console.warn(
      'WARNING: MongoDB is running as a standalone server. Inventory reservations need a replica set ' +
        '(transactions). See server/src/modules/inventory/README.md.'
    );
  }
}

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Could not start: database connection failed.', error);
    process.exit(1);
  }

  if (process.env.SWEEPER_ENABLED !== 'false') {
    startReservationSweeper();
  }

  app.listen(port, () => {
    console.log(`Minuto Me API listening on port ${port}`);
  });
}

start();
