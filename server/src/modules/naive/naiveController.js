// ############################################################################
// #  INTENTIONALLY VULNERABLE - FOR LOCAL CLASSROOM DEMOS ONLY               #
// #  DO NOT USE FOR REAL PURCHASES. DO NOT ENABLE IN PRODUCTION.             #
// #  It is NOT connected to inventoryService.js on purpose.                  #
// ############################################################################
//
// WHY THIS IS BROKEN (read-then-write race):
//   1. READ   the product              -> every buyer sees stock = 1
//   2. CHECK  "stock >= quantity?"     -> every buyer thinks "yes!"
//   3. WRITE  stock = 1 - 1 = 0        -> every buyer writes the same value
// Because all 100 requests do step 1 before anyone finishes step 3, all 100
// "succeed" - we sold one item 100 times. The real endpoint avoids this with
// one atomic conditional update (see inventoryService.js).
import Product from '../../models/Product.js';
import { InventoryError } from '../inventory/inventoryErrors.js';
import { validateObjectId, validateQuantity } from '../inventory/inventoryValidation.js';

// Optional pause (milliseconds) between the read and the write. It only makes the
// race easier to see. Set NAIVE_DELAY_MS=20 in server/.env if your machine is too fast.
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function naivePurchase(req, res) {
  res.set('X-Intentionally-Vulnerable', 'true');

  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Naive demo endpoint is disabled in production.' });
  }

  try {
    validateObjectId(req.params.productId, 'productId');
    const quantity = validateQuantity(req.body?.quantity);

    const product = await Product.findById(req.params.productId); // 1. READ
    if (!product) {
      throw new InventoryError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
    }
    if (product.stock < quantity) {
      // 2. CHECK
      throw new InventoryError(409, 'INSUFFICIENT_STOCK', 'Not enough stock available.');
    }

    await wait(Number(process.env.NAIVE_DELAY_MS) || 0);

    product.stock = product.stock - quantity; // compute the new value in JavaScript...
    await product.save(); // 3. WRITE it back (overwrites whatever is there now)

    return res.status(200).json({
      success: true,
      warning: 'NAIVE endpoint - intentionally unsafe, demo only.',
      data: { productId: String(product._id), quantity, stockAfterThisRequest: product.stock },
    });
  } catch (error) {
    if (error instanceof InventoryError) {
      return res.status(error.statusCode).json({ success: false, code: error.code, message: error.message });
    }
    console.error('[naive] unexpected error:', error);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
  }
}
