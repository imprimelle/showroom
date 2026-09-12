export interface CartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  variant_label: string;
  variant_sku: string;
  quantity: number;
  unit_price_fcfa: number;
  image_url: string | null;
}

export interface OrderPayload {
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
  };
  items: {
    product_id: string;
    product_name: string;
    variant_label: string;
    variant_sku: string;
    quantity: number;
    unit_price_fcfa: number;
    subtotal_fcfa: number;
  }[];
  total_amount: number;
  notes?: string;
}

export type OrderStatus = 'new' | 'contacted' | 'confirmed' | 'in_progress' | 'delivered' | 'cancelled';

export interface ShowcaseOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  customer_email: string | null;
  items: CartItem[];
  total_amount: number;
  notes: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface ShowcaseSettings {
  contact?: { whatsapp?: string; email?: string; address?: string };
  meta?: { site_name?: string; domain?: string; default_title?: string; default_description?: string };
  social?: { facebook?: string; instagram?: string; tiktok?: string };
  analytics?: { fb_pixel_id?: string; umami_website_id?: string; umami_script_url?: string };
  hero?: { video_url?: string; title?: string; subtitle?: string; cta_text?: string };
}
