import 'dotenv/config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import Product from '../src/models/Product.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cfg = JSON.parse(await readFile(new URL('../config/store-config.json', import.meta.url), 'utf8'));
  for (const p of cfg.products) {
    await Product.updateOne(
      { _id: p.id, tenantId: 'default' },
      { $set: { name: p.name, price: p.price, description: p.description, category: p.category, imageUrl: p.imageUrl, stock: p.stock, tenantId: 'default' } },
      { upsert: true }
    );
  }
  const count = await Product.countDocuments();
  console.log('SEEDED_PRODUCTS_COUNT:', count);
  const items = await Product.find().lean();
  console.log('PRODUCTS:', items.map(i => ({ id: i._id, name: i.name, stock: i.stock, price: i.price })));
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

