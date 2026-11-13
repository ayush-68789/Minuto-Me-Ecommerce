// Concurrency attack: 100 buyers fight for 1 unit of stock.
//
//   1. HARDENED endpoint  POST /api/inventory/:productId/reserve  -> must sell exactly 1
//   2. NAIVE endpoint     POST /api/naive/purchase/:productId     -> usually sells MANY (the bug)
//
// How to run (server must already be running, see README.md):
//   cd server && npm run attack
//
// The script checks the REAL database afterwards. It does not trust HTTP responses alone.
// It creates its own throw-away products and deletes them at the end.
import 'dotenv/config';
import axios from 'axios';
import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Reservation from '../../models/Reservation.js';

const BASE_URL = process.env.ATTACK_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const BUYERS = 100;

async function createProductWithStockOne(label) {
  return Product.create({ name: `${label} (attack test)`, price: 1, stock: 1 });
}

// Sends BUYERS requests at the same moment and sorts the outcomes.
async function fireRequests(url) {
  const requests = Array.from({ length: BUYERS }, () =>
    axios.post(
      url,
      { quantity: 1 },
      // each request pretends to be a different customer (dev-only header, see inventoryController.js)
      { headers: { 'x-customer-id': String(new mongoose.Types.ObjectId()) } }
    )
  );
  const results = await Promise.allSettled(requests);

  const summary = { successful: 0, rejectedOutOfStock: 0, otherFailures: 0 };
  for (const result of results) {
    if (result.status === 'fulfilled') {
      summary.successful += 1;
    } else if (result.reason?.response?.status === 409) {
      summary.rejectedOutOfStock += 1; // the expected, polite "no stock left"
    } else {
      summary.otherFailures += 1; // network error, 500, ... should be 0
    }
  }
  summary.failed = summary.rejectedOutOfStock + summary.otherFailures;
  return summary;
}

async function attackHardenedEndpoint() {
  console.log('\n=== 1. HARDENED endpoint: 100 buyers, stock = 1 ===');
  const product = await createProductWithStockOne('hardened');
  const summary = await fireRequests(`${BASE_URL}/api/inventory/${product._id}/reserve`);

  // Read the final truth straight from MongoDB.
  const finalStock = (await Product.findById(product._id).lean()).stock;
  const reservations = await Reservation.countDocuments({ productId: product._id, status: 'reserved' });

  console.log(`Successful purchases: ${summary.successful}`);
  console.log(`Failed purchases:     ${summary.failed} (out of stock: ${summary.rejectedOutOfStock}, other errors: ${summary.otherFailures})`);
  console.log(`Final stock (from MongoDB): ${finalStock}`);
  console.log(`Reservations in MongoDB:    ${reservations}`);

  const passed =
    summary.successful === 1 &&
    summary.failed === BUYERS - 1 &&
    summary.otherFailures === 0 &&
    finalStock === 0 &&
    reservations === 1;
  console.log(passed ? 'RESULT: PASS - no overselling.' : 'RESULT: FAIL - overselling or unexpected errors!');
  return { passed, productId: product._id };
}

async function attackNaiveEndpoint() {
  console.log('\n=== 2. NAIVE endpoint (intentionally vulnerable): 100 buyers, stock = 1 ===');
  const product = await createProductWithStockOne('naive');
  const summary = await fireRequests(`${BASE_URL}/api/naive/purchase/${product._id}`);
  const finalStock = (await Product.findById(product._id).lean()).stock;

  console.log(`Successful purchases: ${summary.successful}`);
  console.log(`Failed purchases:     ${summary.failed}`);
  console.log(`Final stock (from MongoDB): ${finalStock}`);
  if (summary.successful > 1) {
    console.log(`RESULT: OVERSOLD - 1 unit was sold ${summary.successful} times. This is the bug the real endpoint prevents.`);
  } else {
    console.log('RESULT: no overselling happened THIS time. The race is timing-dependent; try again or set NAIVE_DELAY_MS=20 on the server.');
  }
  return { oversold: summary.successful > 1, productId: product._id };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set (put it in server/.env).');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([Product.init(), Reservation.init()]);
  console.log(`Attacking ${BASE_URL} ...`);

  const hardened = await attackHardenedEndpoint();
  const naive = await attackNaiveEndpoint();

  // clean up the throw-away data
  const ids = [hardened.productId, naive.productId];
  await Reservation.deleteMany({ productId: { $in: ids } });
  await Product.deleteMany({ _id: { $in: ids } });
  await mongoose.disconnect();

  process.exitCode = hardened.passed ? 0 : 1; // only the hardened endpoint decides pass/fail
}

main().catch(async (error) => {
  console.error('Attack script could not run. Is the server running and is MongoDB reachable?');
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
