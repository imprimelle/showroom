"use client";

import { create } from "zustand";

export interface FlyFlight {
  id: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  endX: number;
  endY: number;
  endW: number;
  endH: number;
}

interface FlyToCartStore {
  flights: FlyFlight[];
  launch: (f: Omit<FlyFlight, "id">) => void;
  remove: (id: string) => void;
}

let counter = 0;

export const useFlyToCartStore = create<FlyToCartStore>((set) => ({
  flights: [],
  launch: (f) =>
    set((s) => ({
      flights: [...s.flights, { ...f, id: `fly-${Date.now()}-${counter++}` }],
    })),
  remove: (id) => set((s) => ({ flights: s.flights.filter((f) => f.id !== id) })),
}));

/**
 * Déclenche l'animation « cadeau 3D qui vole vers le panier », en 2 temps :
 *   1. le cadeau apparaît sur le bouton d'ajout avec une rotation 3D ;
 *   2. il s'envole vers l'icône panier de la navbar.
 * `sourceEl` = l'élément cliqué (bouton d'ajout). La cible est l'icône panier
 * de la navbar (`#cart-nav-icon`), avec repli vers le coin haut-droit.
 */
export function flyToCart(sourceEl: Element) {
  const start = sourceEl.getBoundingClientRect();
  const target = document.getElementById("cart-nav-icon");
  const end = target
    ? target.getBoundingClientRect()
    : { left: window.innerWidth - 60, top: 16, width: 20, height: 20 };

  useFlyToCartStore.getState().launch({
    startX: start.left,
    startY: start.top,
    startW: start.width,
    startH: start.height,
    endX: end.left,
    endY: end.top,
    endW: end.width,
    endH: end.height,
  });
}
