// Owner: Member 5 — MVC controller for orders.
// Minimal version added by Member 1 to carry the ownership checks; M5 replaces order
// creation with real checkout and must keep the access rules below.
import { HttpError } from '../middleware/errorHandler.js';
import { canAccessOwned } from '../middleware/roleMiddleware.js';
import orderModel from '../models/Order.js';

export function checkNewOrder({ items }) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return ['items must be a list of 1 to 50 order lines'];
  }
  const valid = items.every(
    (item) =>
      item &&
      typeof item.productId === 'string' &&
      item.productId.trim() &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= 100,
  );
  return valid ? [] : ['each item needs a productId and a quantity between 1 and 100'];
}

export function createOrder(req, res) {
  // The customer is always the signed-in user; a customerId in the body is ignored.
  const order = orderModel.create({ customerId: req.user.id, items: req.body.items });
  res.status(201).json({ order });
}

export function listMyOrders(req, res) {
  res.status(200).json({ orders: orderModel.listByCustomer(req.user.id) });
}

export function getOrder(req, res) {
  const order = orderModel.findById(req.params.orderId);
  // Same 404 for a missing order and someone else's order, so IDs cannot be probed.
  if (!order || !canAccessOwned(req.user, order.customerId)) {
    throw new HttpError(404, 'order_not_found', 'Order not found');
  }
  res.status(200).json({ order });
}
