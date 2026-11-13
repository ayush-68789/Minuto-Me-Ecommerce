// Owner: Member 5 — Order request handlers for checkout, history, and detail.
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Payment from '../models/Payment.js';

function getTenantAndSession(req) {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || req.body?.tenantId || 'default';
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.body?.sessionId || 'anonymous';
  return { tenantId, sessionId };
}

export function createOrder(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const {
      customerId,
      customer = {},
      shippingAddress = {},
      paymentMethod = 'demo_card',
      fromCart = true
    } = req.body;

    let items = req.body.items;
    let pricing = req.body.pricing;

    // If items are not directly provided or fromCart is set, pull from user's cart
    if (!items || items.length === 0 || fromCart) {
      const cart = Cart.get(tenantId, sessionId);
      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty. Add items before checking out.' });
      }
      items = cart.items;
      pricing = cart.pricing;
    }

    if (!customer.name || !customer.email) {
      return res.status(400).json({ error: 'Customer name and email are required for checkout' });
    }

    if (!shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ error: 'Shipping street and city are required' });
    }

    // Step 1: Create Order shell
    const calculatedSubtotal = Number(items.reduce((sum, i) => sum + (Number(i.price) * (Number(i.quantity) || 1)), 0).toFixed(2));
    const shipping = calculatedSubtotal >= 50 ? 0 : 5.00;
    const tax = Number((calculatedSubtotal * 0.08).toFixed(2));
    const total = Number((calculatedSubtotal + shipping + tax).toFixed(2));

    const authoritativePricing = {
      subtotal: calculatedSubtotal,
      shipping,
      tax,
      total,
      currency: 'USD'
    };

    // Step 2: Create Payment attempt
    const payment = Payment.create({
      orderId: 'pending_checkout',
      tenantId,
      amount: authoritativePricing.total,
      currency: authoritativePricing.currency,
      method: paymentMethod
    });

    // Step 3: For demo flow, simulate successful payment right away
    const processedPayment = Payment.process(payment.id, {
      success: true,
      providerDetails: {
        method: paymentMethod,
        timestamp: new Date().toISOString()
      }
    });

    // Step 4: Create final order record
    const order = Order.create({
      tenantId,
      customerId: customerId || customer.email || sessionId,
      customer,
      shippingAddress,
      items,
      pricing: authoritativePricing,
      payment: {
        paymentId: processedPayment.id,
        method: paymentMethod,
        status: processedPayment.status
      }
    });

    // Link payment with order ID
    processedPayment.orderId = order.id;

    // Step 5: Clear cart upon successful checkout
    if (fromCart) {
      Cart.clear(tenantId, sessionId);
    }

    res.status(201).json({
      message: 'Order created and payment processed successfully',
      order,
      payment: processedPayment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function getOrder(req, res) {
  try {
    const { id } = req.params;
    const order = Order.get(id);

    if (!order) {
      return res.status(404).json({ error: `Order with id ${id} not found` });
    }

    const payments = Payment.findByOrderId(id);
    res.status(200).json({ order, payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function listOrders(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const customerId = req.query.customerId || req.query.email || sessionId;
    const limit = parseInt(req.query.limit, 10) || 50;

    const orders = Order.list({
      tenantId: req.query.tenantId || tenantId,
      customerId: req.query.all === 'true' ? null : customerId,
      limit
    });

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const order = Order.updateStatus(id, status);
    res.status(200).json({ order, message: `Order status updated to ${status}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

