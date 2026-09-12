import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  variant_label: z.string().min(1),
  variant_sku: z.string(),
  quantity: z.number().int().min(1).max(100),
  unit_price_fcfa: z.number().int().min(0),
  subtotal_fcfa: z.number().int().min(0),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numéro invalide'),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().min(2).max(100),
    address: z.string().min(5).max(500),
  }),
  items: z.array(orderItemSchema).min(1).max(50),
  total_amount: z.number().int().min(1),
  notes: z.string().max(1000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
