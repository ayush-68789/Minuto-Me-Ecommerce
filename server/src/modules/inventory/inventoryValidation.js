// Input checks shared by the real inventory service and the naive demo endpoint.
import mongoose from 'mongoose';
import { InventoryError } from './inventoryErrors.js';

// A valid id looks like "64b7f0c2a1d3e5f607182930" (24 hex characters).
export function validateObjectId(value, label) {
  const isText = typeof value === 'string';
  if (!isText || !/^[0-9a-fA-F]{24}$/.test(value) || !mongoose.isValidObjectId(value)) {
    throw new InventoryError(400, 'INVALID_ID', `${label} is not a valid id.`);
  }
  return value;
}

// Quantity must be a real whole number >= 1.
// Rejected: missing, "2" (string), 0, -1, 1.5, NaN, Infinity, huge numbers.
export function validateQuantity(value) {
  if (value === undefined || value === null) {
    throw new InventoryError(400, 'INVALID_QUANTITY', 'quantity is required.');
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new InventoryError(400, 'INVALID_QUANTITY', 'quantity must be a whole number of at least 1.');
  }
  return value;
}
