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

/**
 * Builds a sanitized MongoDB query filter for product listing, search, and stock status.
 */
export function buildProductFilter({ storeId, search, category, status, stockStatus } = {}) {
  const query = {};
  if (storeId) {
    query.store = storeId;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { category: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (category && typeof category === 'string' && category !== 'All' && category.trim()) {
    query.category = category.trim().slice(0, 100);
  }

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (stockStatus === 'out_of_stock') {
    query.stock = 0;
  } else if (stockStatus === 'low_stock') {
    query.stock = { $gt: 0, $lte: 5 };
  } else if (stockStatus === 'in_stock') {
    query.stock = { $gt: 0 };
  }

  return query;
}

/**
 * Safely resolves sort criteria against a whitelist.
 */
export function parseSort(sortKey, whitelist = {}, defaultSort = { createdAt: -1 }) {
  if (sortKey && whitelist[sortKey]) {
    return whitelist[sortKey];
  }
  return defaultSort;
}
