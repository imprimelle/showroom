import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { track } from '@/lib/analytics';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        const existing = get().items.find((i) => i.key === item.key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === item.key ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
        track('add_to_cart', {
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.unit_price_fcfa,
          quantity: item.quantity,
          variant: item.variant_label,
        });
      },

      removeItem: (key: string) => {
        set({ items: get().items.filter((i) => i.key !== key) });
      },

      updateQuantity: (key: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, i) => sum + i.unit_price_fcfa * i.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'showroom-cart',
      version: 1,
      // Migration des anciens paniers (sans `key` ni `options`).
      migrate: (persisted: any) => ({
        ...persisted,
        items: (persisted?.items || []).map((i: any) => ({
          ...i,
          key: i.key || `${i.product_id}:${i.variant_sku}`,
          options: i.options || [],
        })),
      }),
    }
  )
);
