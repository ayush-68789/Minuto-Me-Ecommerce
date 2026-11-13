import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './src/app.js';
import userModel, { ROLES } from './src/models/User.js';
import Product from './src/models/Product.js';
import Reservation from './src/models/Reservation.js';
import { startReservationSweeper } from './src/modules/inventory/reservationSweeper.js';
import Order from './src/models/orderModel.js';
import Payment from './src/models/paymentModel.js';
import IdempotencyKey from './src/models/idempotencyModel.js';
import WebhookEvent from './src/models/webhookEventModel.js';

const port = Number(process.env.PORT || 5000);
const isEnabled = (name, defaultValue = true) => process.env[name] === undefined ? defaultValue : process.env[name] === 'true';
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));

async function seedConfiguredProducts() {
  let store;
  try {
    store = JSON.parse(await readFile(path.join(serverDirectory, 'config', 'store-config.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (!store?.slug || !Array.isArray(store.products)) return;
  await Promise.all(store.products.map((product) => Product.updateOne(
    { _id: product.id, tenantId: store.slug },
    { $setOnInsert: { name: product.name, price: product.price, description: product.description, category: product.category || store.category, imageUrl: product.imageUrl || '', stock: product.stock, tenantId: store.slug } },
    { upsert: true },
  )));
}

async function initializeDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set; product, inventory and checkout persistence APIs will return 503.');
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await Promise.all([Product.init(), ...(isEnabled('INVENTORY_ENABLED') ? [Reservation.init()] : [])]);
    await seedConfiguredProducts();
    if (isEnabled('CHECKOUT_ENABLED', false)) {
      await Promise.all([Order.init(), Payment.init(), IdempotencyKey.init(), WebhookEvent.init()]);
    }
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid') {
      console.warn('MongoDB is standalone. Inventory transactions require a replica set; product CRUD can still run.');
    } else {
      console.log('MongoDB replica set connected.');
    }
    if (isEnabled('INVENTORY_ENABLED') && isEnabled('RESERVATION_LIFECYCLE_ENABLED')) startReservationSweeper();
    return true;
  } catch (error) {
    console.error('MongoDB is unavailable; Store Studio will remain available:', error.message);
    return false;
  }
}

async function start() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await userModel.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: ROLES.ADMIN });
    console.log(`Admin account ready: ${ADMIN_EMAIL}`);
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; admin routes have no seeded admin.');
  }
  await initializeDatabase();
  app.listen(port, () => console.log(`Minuto Me API listening on port ${port}`));
}

start();
