// Owner: M4
import { z } from 'zod';

const productSchema = z.object({
  name: z.string({ required_error: 'Product name is required' }).trim().min(1, 'Product name cannot be empty'),
  description: z.string().optional().default(''),
  price: z.coerce.number({ required_error: 'Price is required' }).min(0, 'Price must be non-negative'),
  comparePrice: z.coerce.number().min(0, 'Compare price must be non-negative').optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  category: z.string().trim().optional().default('General'),
  stock: z.coerce.number().int().min(0, 'Stock must be 0 or greater').optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updateProductSchema = productSchema.partial();

const validateProduct = (data) => {
  return productSchema.safeParse(data);
};

const validateProductUpdate = (data) => {
  return updateProductSchema.safeParse(data);
};

export {
  productSchema,
  updateProductSchema,
  validateProduct,
  validateProductUpdate,
};
