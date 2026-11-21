// Owner: M2 - Products & Dashboard

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^\S+@\S+\.\S+$/.test(email.trim());
};

export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const validateProduct = (values = {}) => {
  const errors = {};

  const name = String(values.name || '').trim();
  if (!name) {
    errors.name = 'Product name is required';
  } else if (name.length > 120) {
    errors.name = 'Product name cannot exceed 120 characters';
  }

  if (values.price === '' || values.price === undefined || values.price === null) {
    errors.price = 'Price is required';
  } else {
    const priceNum = Number(values.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Price must be a valid non-negative number';
    }
  }

  if (values.compareAtPrice !== '' && values.compareAtPrice !== undefined && values.compareAtPrice !== null) {
    const compareNum = Number(values.compareAtPrice);
    if (isNaN(compareNum) || compareNum < 0) {
      errors.compareAtPrice = 'Compare price must be a non-negative number';
    }
  }

  if (values.stock !== '' && values.stock !== undefined && values.stock !== null) {
    const stockNum = Number(values.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      errors.stock = 'Stock must be a non-negative whole number';
    }
  }

  if (values.description && values.description.length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters';
  }

  if (values.imageUrl && !isValidUrl(values.imageUrl) && !values.imageUrl.startsWith('/uploads/')) {
    errors.imageUrl = 'Please enter a valid HTTP/HTTPS image URL';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStore = (values = {}) => {
  const errors = {};

  const name = String(values.name || '').trim();
  if (!name) {
    errors.name = 'Store name is required';
  } else if (name.length > 100) {
    errors.name = 'Store name cannot exceed 100 characters';
  }

  if (values.slug) {
    const slug = String(values.slug).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
  }

  if (values.contactEmail && !isValidEmail(values.contactEmail)) {
    errors.contactEmail = 'Enter a valid contact email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateProfile = (values = {}) => {
  const errors = {};

  const name = String(values.name || '').trim();
  if (!name) {
    errors.name = 'Full name is required';
  } else if (name.length > 80) {
    errors.name = 'Name cannot exceed 80 characters';
  }

  if (!values.email || !isValidEmail(values.email)) {
    errors.email = 'A valid email address is required';
  }

  if (values.newPassword && values.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  isValidEmail,
  isValidUrl,
  formatCurrency,
  formatDate,
  validateProduct,
  validateStore,
  validateProfile,
};
