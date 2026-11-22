// Owner: M4 (Product Management & Dashboard)
import { z } from 'zod';

const imageUrl = z.string().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'Image must be an HTTP or HTTPS URL');

const productSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(1, 'Product name cannot be empty')
    .max(200, 'Product name cannot exceed 200 characters'),
  description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional().default(''),
  price: z.coerce
    .number({ required_error: 'Price is required' })
    .min(0, 'Price must be non-negative')
    .max(100000000, 'Price exceeds maximum allowed value'),
  comparePrice: z.coerce
    .number()
    .min(0, 'Compare price must be non-negative')
    .max(100000000, 'Compare price exceeds maximum allowed value')
    .optional()
    .nullable(),
  images: z.array(imageUrl).max(20, 'Maximum 20 images allowed').optional().default([]),
  category: z.string().trim().max(100, 'Category cannot exceed 100 characters').optional().default('General'),
  stock: z.coerce
    .number({ required_error: 'Stock is required' })
    .int('Stock must be an integer')
    .min(0, 'Stock must be 0 or greater')
    .max(1000000, 'Stock cannot exceed 1,000,000')
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
});

const updateProductSchema = productSchema.partial();

const stockAdjustmentSchema = z.object({
  stock: z.coerce
    .number({ required_error: 'Stock quantity is required' })
    .int('Stock must be an integer')
    .min(0, 'Stock must be 0 or greater')
    .max(1000000, 'Stock cannot exceed 1,000,000'),
});

const validateProduct = (data) => {
  return productSchema.safeParse(data);
};

const validateProductUpdate = (data) => {
  return updateProductSchema.safeParse(data);
};

const validateStockAdjustment = (data) => {
  return stockAdjustmentSchema.safeParse(data);
};

export {
  productSchema,
  updateProductSchema,
  stockAdjustmentSchema,
  validateProduct,
  validateProductUpdate,
  validateStockAdjustment,
};
