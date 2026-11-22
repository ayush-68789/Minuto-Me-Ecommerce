import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import InventoryReservation from '../models/InventoryReservation.js';
import Idempotency from '../models/Idempotency.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

// Remove all store-owned records before removing its public slug.
export default async function deleteStoreData(storeId) {
  const filter = { store: storeId };
  await Promise.all([
    Review.deleteMany(filter),
    Order.deleteMany(filter),
    InventoryReservation.deleteMany(filter),
    Idempotency.deleteMany(filter),
    AuditLog.deleteMany(filter),
    Product.deleteMany(filter),
    User.deleteMany({ role: 'customer', customerStore: storeId }),
  ]);
  await Store.deleteOne({ _id: storeId });
}
