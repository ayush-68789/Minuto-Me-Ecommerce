// Owner: M5
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const cartItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1).max(99),
});

// storeSlug identifies the tenant; the client never sends prices.
const cartSchema = z.object({
  storeSlug: z.string().trim().min(1).max(80),
  items: z.array(cartItemSchema).min(1, 'Cart is empty').max(50),
});

const createOrderSchema = cartSchema.extend({
  customerInfo: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().regex(/^\+?[\d\s-]{7,15}$/, 'Invalid phone number'),
  }),
  shippingAddress: z.object({
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().regex(/^[A-Za-z\d\s-]{3,10}$/, 'Invalid postal code'),
    country: z.string().trim().min(2).max(60).optional().default('India'),
  }),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

// Returns parsed data, or throws a 400 error with the first issue's message.
function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const err = new Error(`${issue.path.join('.') || 'body'}: ${issue.message}`);
    err.status = 400;
    throw err;
  }
  return result.data;
}

export { cartSchema, createOrderSchema, updateStatusSchema, parse };
