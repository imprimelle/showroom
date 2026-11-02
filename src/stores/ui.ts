"use client";

import { create } from "zustand";

/**
 * État d'interface partagé (léger).
 * - `hasStickyBar` : une barre sticky (haut ou bas) est visible — utilisé pour
 *   masquer les éléments flottants qui entreraient en conflit (ex. le rappel de panier).
 * - `menuOpen` / `searchOpen` : état du menu plein écran (TopNav) et de son volet
 *   recherche. Partagé pour que la barre de recherche de l'accueil puisse ouvrir
 *   directement le volet recherche du menu.
 */
interface UiState {
  hasStickyBar: boolean;
  setHasStickyBar: (v: boolean) => void;
  menuOpen: boolean;
  searchOpen: boolean;
  openMenu: () => void;
  openSearch: () => void;
  closeMenu: () => void;
  setSearchOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  hasStickyBar: false,
  setHasStickyBar: (v) => set({ hasStickyBar: v }),
  menuOpen: false,
  searchOpen: false,
  openMenu: () => set({ menuOpen: true, searchOpen: false }),
  openSearch: () => set({ menuOpen: true, searchOpen: true }),
  closeMenu: () => set({ menuOpen: false, searchOpen: false }),
  setSearchOpen: (v) => set({ searchOpen: v }),
}));
