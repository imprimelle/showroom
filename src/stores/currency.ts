"use client";
import { useCallback } from "react";
import { create } from "zustand";
import {
  currencyForCountry,
  formatMoney,
  DEFAULT_RATES,
  type CurrencyCode,
} from "@/lib/currency";

const CACHE_KEY = "showroom_currency";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

interface CachedCurrency {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  country: string | null;
  ts: number;
}

interface CurrencyState {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  /** Code pays ISO alpha-2 détecté (réutilisé pour pré-remplir la livraison). */
  country: string | null;
  ready: boolean;
  init: () => Promise<void>;
}

function readCache(): CachedCurrency | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.currency !== "string" || typeof data.rates !== "object") return null;
    return data as CachedCurrency;
  } catch {
    return null;
  }
}

function writeCache(data: CachedCurrency) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* stockage indisponible (mode privé…) — on ignore */
  }
}

/** Détecte le pays via géolocalisation IP (sans clé), avec repli. */
async function detectCountry(): Promise<string | null> {
  const endpoints = ["https://ipwho.is/", "https://ipapi.co/json/"];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data = await res.json();
      const code = data?.country_code;
      if (typeof code === "string" && code) return code;
    } catch {
      /* on tente l'endpoint suivant */
    }
  }
  return null;
}

/** Récupère les taux live (base XOF), avec repli sur les taux codés en dur. */
async function fetchRates(): Promise<Record<CurrencyCode, number> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/XOF", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.rates;
    if (!r || typeof r !== "object") return null;
    return {
      XOF: 1,
      EUR: typeof r.EUR === "number" ? r.EUR : DEFAULT_RATES.EUR,
      USD: typeof r.USD === "number" ? r.USD : DEFAULT_RATES.USD,
      GBP: typeof r.GBP === "number" ? r.GBP : DEFAULT_RATES.GBP,
    };
  } catch {
    return null;
  }
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: "XOF",
  rates: DEFAULT_RATES,
  country: null,
  ready: false,
  init: async () => {
    if (get().ready) return;

    // 1. Cache frais → réutiliser sans appel réseau.
    const cached = readCache();
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      set({
        currency: cached.currency,
        rates: cached.rates,
        country: cached.country ?? null,
        ready: true,
      });
      return;
    }

    // 2. Détection du pays (repli sur le cache puis FCFA).
    let country: string | null = cached?.country ?? null;
    let currency: CurrencyCode = cached?.currency ?? "XOF";
    try {
      const detected = await detectCountry();
      if (detected) {
        country = detected;
        currency = currencyForCountry(detected);
      }
    } catch {
      /* conserve le repli */
    }

    // 3. Taux live (repli sur le cache puis les taux codés en dur).
    let rates: Record<CurrencyCode, number> = cached?.rates ?? DEFAULT_RATES;
    try {
      const live = await fetchRates();
      if (live) rates = live;
    } catch {
      /* conserve le repli */
    }

    set({ currency, rates, country, ready: true });
    writeCache({ currency, rates, country, ts: Date.now() });
  },
}));

/**
 * Hook : renvoie une fonction `formatPrice(fcfa)` qui convertit/formatte
 * le montant dans la devise active. Re-render automatique quand la devise
 * ou les taux changent.
 */
export function useFormatPrice() {
  const currency = useCurrencyStore((s) => s.currency);
  const rates = useCurrencyStore((s) => s.rates);
  return useCallback(
    (fcfa: number) => formatMoney(fcfa, currency, rates),
    [currency, rates]
  );
}
