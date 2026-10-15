"use client";

import { create } from "zustand";

/**
 * État d'interface partagé (léger).
 * `hasStickyBar` signale qu'une barre sticky (haut ou bas) est actuellement
 * visible — utilisé pour masquer les éléments flottants qui entreraient en
 * conflit (ex. le rappel de panier).
 */
interface UiState {
  hasStickyBar: boolean;
  setHasStickyBar: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  hasStickyBar: false,
  setHasStickyBar: (v) => set({ hasStickyBar: v }),
}));
