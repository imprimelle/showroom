/**
 * Gestion de la monnaie — conversion transparente selon le pays du visiteur.
 * Monnaie de référence (stockage) : FCFA (XOF). Les prix en base sont en FCFA.
 * L'utilisateur ne choisit PAS sa devise : elle est déduite du pays détecté.
 */

export type CurrencyCode = "XOF" | "EUR" | "USD" | "GBP";

/** Parité fixe FCFA ↔ EUR (le FCFA est arrimé à l'euro). */
export const XOF_PER_EUR = 655.957;

export interface CurrencyMeta {
  symbol: string;
  locale: string;
  /** Taux de repli XOF → devise (utilisé si les taux live échouent). */
  fallbackRate: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  XOF: { symbol: "FCFA", locale: "fr-FR", fallbackRate: 1 },
  EUR: { symbol: "€", locale: "fr-FR", fallbackRate: 1 / XOF_PER_EUR },
  USD: { symbol: "$", locale: "en-US", fallbackRate: 1.08 / XOF_PER_EUR },
  GBP: { symbol: "£", locale: "en-GB", fallbackRate: 0.85 / XOF_PER_EUR },
};

/** Taux de repli (XOF → devise) — écrasés par les taux live quand disponibles. */
export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  XOF: 1,
  EUR: 1 / XOF_PER_EUR,
  USD: 1.08 / XOF_PER_EUR,
  GBP: 0.85 / XOF_PER_EUR,
};

// Zone FCFA (XOF) — UEMOA + CEMAC.
const XOF_COUNTRIES = new Set([
  "CI", "SN", "BF", "ML", "NE", "TG", "BJ", "GW", "CM", "CF", "TD", "CG", "GA", "GQ",
]);

// Zone euro.
const EUR_COUNTRIES = new Set([
  "FR", "MC", "AD", "DE", "AT", "BE", "ES", "PT", "IT", "SM", "VA", "NL", "LU", "IE",
  "FI", "EE", "LV", "LT", "GR", "CY", "MT", "SK", "SI", "HR", "ME", "XK",
]);

const USD_COUNTRIES = new Set(["US", "UM", "PR", "GU", "VI", "EC", "SV", "PA", "TL", "FM", "MH", "PW"]);

const GBP_COUNTRIES = new Set(["GB", "IM", "JE", "GG"]);

/** Déduit la devise d'un code pays ISO 3166-1 alpha-2. Défaut : FCFA (marché principal CI). */
export function currencyForCountry(country?: string | null): CurrencyCode {
  const c = (country || "").toUpperCase().trim();
  if (XOF_COUNTRIES.has(c)) return "XOF";
  if (EUR_COUNTRIES.has(c)) return "EUR";
  if (USD_COUNTRIES.has(c)) return "USD";
  if (GBP_COUNTRIES.has(c)) return "GBP";
  return "XOF";
}

/** Formate un montant FCFA dans la devise cible. */
export function formatMoney(
  fcfa: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): string {
  if (!Number.isFinite(fcfa)) fcfa = 0;
  if (currency === "XOF") {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(fcfa) + " FCFA";
  }
  const rate = rates?.[currency] ?? CURRENCIES[currency].fallbackRate;
  const converted = fcfa * rate;
  const meta = CURRENCIES[currency];
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}
