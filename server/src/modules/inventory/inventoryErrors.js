// One small error class for "expected" problems (bad input, out of stock, ...).
// Controllers turn it into a clean JSON response. Anything that is NOT an
// InventoryError is treated as an unexpected bug and is hidden from the client.
export class InventoryError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'InventoryError';
    this.statusCode = statusCode; // HTTP status, e.g. 400, 404, 409
    this.code = code; // short machine-readable text, e.g. 'INSUFFICIENT_STOCK'
  }
}
