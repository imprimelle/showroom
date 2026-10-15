"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Store du checkout express (slide step-by-step).
 *
 * - L'état « isOpen / step » est volatile (jamais persisté) : un refresh
 *   ne doit pas rouvrir le slide à une étape intermédiaire.
 * - Seules les coordonnées client (nom / téléphone / pays / adresse) sont
 *   persistées, pour pré-remplir le formulaire au retour du client.
 */
export interface CheckoutCustomer {
  name: string;
  phone: string;
  country: string;
  address: string;
}

interface CheckoutState {
  isOpen: boolean;
  /** 0 = récap · 1 = contact · 2 = livraison · 3 = paiement */
  step: number;
  customer: CheckoutCustomer;
  open: () => void;
  close: () => void;
  reset: () => void;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  setCustomer: (partial: Partial<CheckoutCustomer>) => void;
}

const TOTAL_STEPS = 3;

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      isOpen: false,
      step: 0,
      customer: { name: "", phone: "", country: "", address: "" },

      open: () => set({ isOpen: true, step: 0 }),
      close: () => set({ isOpen: false }),
      reset: () =>
        set({ isOpen: false, step: 0, customer: { name: "", phone: "", country: "", address: "" } }),

      setStep: (step) => set({ step: Math.max(0, Math.min(TOTAL_STEPS, step)) }),
      next: () => set((s) => ({ step: Math.min(TOTAL_STEPS, s.step + 1) })),
      prev: () => set((s) => ({ step: Math.max(0, s.step - 1) })),

      setCustomer: (partial) =>
        set((s) => ({ customer: { ...s.customer, ...partial } })),
    }),
    {
      name: "showroom-checkout-customer",
      // Ne persister QUE les coordonnées client (jamais isOpen/step).
      partialize: (s) => ({ customer: s.customer }),
      merge: (persisted, current) => {
        const p = (persisted || {}) as { customer?: Partial<CheckoutCustomer> };
        return {
          ...current,
          customer: { ...current.customer, ...(p.customer || {}) },
        };
      },
    }
  )
);
