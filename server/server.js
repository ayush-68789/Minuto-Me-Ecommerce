import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';
import userModel, { ROLES } from './src/models/User.js';
import Product from './src/models/Product.js';
import Reservation from './src/models/Reservation.js';
import { startReservationSweeper } from './src/modules/inventory/reservationSweeper.js';

const port = Number(process.env.PORT || 5000);

// The Store Studio/export route can run without MongoDB. Inventory APIs remain
// disabled until a replica set is available because reservations use transactions.
async function connectInventoryDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set; inventory endpoints are unavailable.');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await Promise.all([Product.init(), Reservation.init()]);
    const info = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!info.setName && info.msg !== 'isdbgrid') {
      console.warn('Inventory reservations require MongoDB replica-set transactions.');
      return false;
    }
    console.log('MongoDB replica set connected for inventory.');
    if (process.env.SWEEPER_ENABLED !== 'false') startReservationSweeper();
    return true;
  } catch (error) {
    console.error('Inventory database unavailable; Store Studio will remain available:', error.message);
    return false;
  }
}

async function start() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await userModel.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: ROLES.ADMIN });
    console.log(`Admin account ready: ${ADMIN_EMAIL}`);
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; admin routes will have no seeded admin.');
  }

  await connectInventoryDatabase();
  app.listen(port, () => console.log(`Minuto Me API listening on port ${port}`));
}

start();
