import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  variant_label: z.string().min(1),
  variant_sku: z.string(),
  quantity: z.number().int().min(1).max(100),
  unit_price_fcfa: z.number().int().min(0),
  subtotal_fcfa: z.number().int().min(0),
  options: z
    .array(
      z.object({
        param_id: z.string(),
        option_id: z.string(),
        label: z.string(),
        price: z.number().int().min(0),
      })
    )
    .optional(),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    phone: z
      .string()
      .trim()
      .min(6, 'Numéro invalide')
      .regex(/^\+?[0-9\s\-().]{6,20}$/, 'Numéro invalide')
      .transform((v) => v.replace(/[^\d+]/g, "")),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    address: z.string().min(5).max(500),
  }),
  items: z.array(orderItemSchema).min(1).max(50),
  total_amount: z.number().int().min(1),
  notes: z.string().max(1000).optional(),
  // Paiement & livraison
  payment_method: z.enum(['orange', 'mtn', 'wave', 'card', 'cod', 'talk_first']),
  shipping_country: z.string().length(2).regex(/^[A-Z]{2}$/),
  shipping_fee_fcfa: z.number().int().min(0),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
