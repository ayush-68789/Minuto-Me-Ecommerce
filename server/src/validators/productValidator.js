// Owner: M2 - Products & Dashboard

export const validateCreateProduct = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    errors.push('Product name is required');
  } else if (name.length > 120) {
    errors.push('Product name must be 120 characters or fewer');
  }

  const price = Number(body.price);
  if (body.price === undefined || body.price === null || isNaN(price)) {
    errors.push('Price is required and must be a valid number');
  } else if (price < 0) {
    errors.push('Price cannot be negative');
  }

  if (body.compareAtPrice !== undefined && body.compareAtPrice !== null && body.compareAtPrice !== '') {
    const comparePrice = Number(body.compareAtPrice);
    if (isNaN(comparePrice) || comparePrice < 0) {
      errors.push('Compare at price must be a non-negative number');
    }
  }

  if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push('Stock must be a non-negative whole number');
    }
  }

  if (body.description && typeof body.description === 'string' && body.description.length > 2000) {
    errors.push('Description cannot exceed 2000 characters');
  }

  if (body.status && !['active', 'draft', 'archived'].includes(body.status)) {
    errors.push('Status must be active, draft, or archived');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors[0],
      errors,
      success: false,
    });
  }

  return next();
};

export const validateUpdateProduct = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      errors.push('Product name cannot be empty');
    } else if (name.length > 120) {
      errors.push('Product name must be 120 characters or fewer');
    }
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      errors.push('Price must be a non-negative number');
    }
  }

  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push('Stock must be a non-negative whole number');
    }
  }

  if (body.status !== undefined && !['active', 'draft', 'archived'].includes(body.status)) {
    errors.push('Status must be active, draft, or archived');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors[0],
      errors,
      success: false,
    });
  }

  return next();
};

export default {
  validateCreateProduct,
  validateUpdateProduct,
};
