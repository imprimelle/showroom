"use client";

import { create } from "zustand";
import { resolveRemises, type RemisesResolved } from "@/lib/remises";
import type { ShowcaseSettings } from "@/types";

/**
 * Store client des remises & surplus : hydrate la config résolue côté serveur
 * (comme le catalogue de catégories), disponible partout sans appel réseau.
 */
interface RemisesState {
  config: RemisesResolved;
  setConfig: (raw: ShowcaseSettings["remises"]) => void;
}

export const useRemisesStore = create<RemisesState>((set) => ({
  config: resolveRemises(undefined),
  setConfig: (raw) => set({ config: resolveRemises(raw) }),
}));
