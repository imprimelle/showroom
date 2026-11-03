"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Produit mis en wishlist — instantané léger (suffisant pour afficher la carte
 * et ré-ajouter au panier sans re-fetch produit).
 */
export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  family?: string | null;
  category?: string | null;
  /** Variante « rapide » (1ère variante) pour le bouton ajout-au-panier. */
  variant_label?: string | null;
  variant_sku?: string | null;
  variant_price?: number | null;
  online_enabled?: boolean;
  cash_on_delivery?: boolean;
  added_at: string;
}

interface WishlistStore {
  items: WishlistItem[];
  /** Ajoute si absent, retire si présent (par `id`). */
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        set({
          items: exists
            ? get().items.filter((i) => i.id !== item.id)
            : [item, ...get().items],
        });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: "showroom-wishlist", version: 1 }
  )
);
