// Owner: M2 - Products & Dashboard

export const validateCreateStore = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    errors.push('Store name is required');
  } else if (name.length > 100) {
    errors.push('Store name must be 100 characters or fewer');
  }

  if (body.slug) {
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push('Store slug may only contain lowercase letters, numbers, and hyphens');
    }
  }

  if (body.settings?.contactEmail) {
    const email = body.settings.contactEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Enter a valid contact email address');
    }
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

export const validateUpdateStore = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      errors.push('Store name cannot be empty');
    } else if (name.length > 100) {
      errors.push('Store name must be 100 characters or fewer');
    }
  }

  if (body.slug !== undefined) {
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push('Store slug may only contain lowercase letters, numbers, and hyphens');
    }
  }

  if (body.settings?.contactEmail) {
    const email = body.settings.contactEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Enter a valid contact email address');
    }
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
  validateCreateStore,
  validateUpdateStore,
};
