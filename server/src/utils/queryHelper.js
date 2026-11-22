/**
 * Safely escapes characters that have special meaning in regular expressions.
 * Prevents ReDoS attacks and regex syntax errors from user input.
 */
export function escapeRegex(input) {
  if (typeof input !== 'string') return '';
  return input.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses and bounds pagination parameters.
 * Handles missing, non-numeric (NaN), negative, zero, and excessively large values.
 */
export function parsePagination(query = {}, defaultLimit = 20, maxLimit = 100) {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
