// Owner: Member 4 — MVC controller for admin endpoints.
// Minimal version added by Member 1 to exercise admin-only access; M4 adds dashboard summaries.
import orderModel from '../models/Order.js';
import userModel from '../models/User.js';

export function listUsers(_req, res) {
  res.status(200).json({ users: userModel.list().map(userModel.toPublic) });
}

export function listAllOrders(req, res) {
  res.status(200).json({ orders: orderModel.list({ tenantId: req.tenantId || 'default' }) });
}
