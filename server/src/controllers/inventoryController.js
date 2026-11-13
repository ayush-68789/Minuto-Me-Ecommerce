// HTTP layer: read the request, call the service, send JSON.
// No stock logic lives here.
import { InventoryError } from '../modules/inventory/inventoryErrors.js';
import { getStock, reserveStock, confirmReservation } from '../modules/inventory/inventoryService.js';

// TEMPORARY INTEGRATION POINT (one place to change when auth/tenant middleware lands).
// Expected from teammates' middleware:  req.user.id (or _id)  and  req.tenantId
// Until that middleware exists:
//   - outside production we accept x-customer-id / x-tenant-id headers so we can test
//   - in production we refuse requests that have no req.user (safe default)
function getRequestContext(req) {
  const isProduction = process.env.NODE_ENV === 'production';
  const userId = req.user?.id ?? req.user?._id;

  if (isProduction && !userId) {
    throw new InventoryError(401, 'AUTH_REQUIRED', 'Authentication is required.');
  }

  const customerId = userId ? String(userId) : isProduction ? undefined : req.get('x-customer-id') || undefined;
  const tenantId = req.tenantId ? String(req.tenantId) : req.get('x-tenant-id') || undefined;

  return { customerId, tenantId };
}

// Turns any error into a safe JSON response. Database details never reach the client.
function sendError(res, error) {
  if (error instanceof InventoryError) {
    return res.status(error.statusCode).json({ success: false, code: error.code, message: error.message });
  }

  // MongoDB code 20 = transactions are not available (standalone server, no replica set).
  const transactionsUnavailable = error?.code === 20 || /Transaction numbers are only allowed/i.test(error?.message || '');
  if (transactionsUnavailable) {
    console.error('[inventory] MongoDB transactions unavailable - a replica set is required.', error);
    return res.status(503).json({
      success: false,
      code: 'TRANSACTIONS_UNAVAILABLE',
      message: 'Inventory service is not available right now.',
    });
  }

  console.error('[inventory] unexpected error:', error); // full detail goes to OUR logs only
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
}

// GET /api/inventory/:productId
export async function getProductStock(req, res) {
  try {
    const { tenantId } = getRequestContext(req);
    const stock = await getStock({ productId: req.params.productId, tenantId });
    return res.status(200).json({ success: true, data: stock });
  } catch (error) {
    return sendError(res, error);
  }
}

// POST /api/inventory/:productId/reserve    body: { "quantity": 1 }
export async function reserve(req, res) {
  try {
    const { customerId, tenantId } = getRequestContext(req);
    const { reservation, remainingStock } = await reserveStock({
      productId: req.params.productId,
      quantity: req.body?.quantity,
      customerId,
      tenantId,
    });
    return res.status(201).json({
      success: true,
      data: {
        reservationId: String(reservation._id),
        productId: String(reservation.productId),
        quantity: reservation.quantity,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
        remainingStock,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// POST /api/inventory/reservations/:id/confirm
export async function confirm(req, res) {
  try {
    const { customerId, tenantId } = getRequestContext(req);
    const reservation = await confirmReservation({ reservationId: req.params.id, customerId, tenantId });
    return res.status(200).json({
      success: true,
      data: {
        reservationId: String(reservation._id),
        status: reservation.status,
        confirmedAt: reservation.confirmedAt,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}
