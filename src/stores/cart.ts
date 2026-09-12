import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantSku: string) => void;
  updateQuantity: (productId: string, variantSku: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        const existing = get().items.find(
          (i) => i.product_id === item.product_id && i.variant_sku === item.variant_sku
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product_id === item.product_id && i.variant_sku === item.variant_sku
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },

      removeItem: (productId: string, variantSku: string) => {
        set({
          items: get().items.filter(
            (i) => !(i.product_id === productId && i.variant_sku === variantSku)
          ),
        });
      },

      updateQuantity: (productId: string, variantSku: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantSku);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product_id === productId && i.variant_sku === variantSku
              ? { ...i, quantity }
              : i
          ),
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
    }
  )
);
