/**
 * Frais de port — zones de livraison configurables dans l'admin (Réglages → Livraison).
 * Monnaie de référence : FCFA (XOF). `fee_fcfa = 0` = livraison gratuite.
 */

export interface ShippingZone {
  id: string;
  label: string;
  /** Codes pays ISO 3166-1 alpha-2 (liste vide = « reste du monde », fallback). */
  countries: string[];
  fee_fcfa: number;
}

export interface ShippingConfig {
  zones?: ShippingZone[];
}

/** Valeurs par défaut utilisées tant que l'admin n'a pas configuré de zones. */
export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  { id: "ci", label: "Côte d'Ivoire", countries: ["CI"], fee_fcfa: 0 },
  {
    id: "uemoa",
    label: "Afrique de l'Ouest (UEMOA)",
    countries: ["SN", "BF", "ML", "NE", "TG", "BJ", "GW"],
    fee_fcfa: 5000,
  },
  { id: "international", label: "International", countries: [], fee_fcfa: 20000 },
];

export function resolveShippingZones(config?: ShippingConfig | null): ShippingZone[] {
  const zones = config?.zones;
  if (Array.isArray(zones) && zones.length > 0) {
    // Assainit : ne garde que les zones valides (id + fee numérique).
    return zones
      .filter((z) => z && typeof z.id === "string" && typeof z.fee_fcfa === "number")
      .map((z) => ({
        id: z.id,
        label: typeof z.label === "string" ? z.label : z.id,
        countries: Array.isArray(z.countries)
          ? z.countries.map((c) => String(c).toUpperCase())
          : [],
        fee_fcfa: z.fee_fcfa,
      }));
  }
  return DEFAULT_SHIPPING_ZONES;
}

/** Frais de port pour un pays (ISO alpha-2). Retourne la zone correspondante, sinon le fallback « reste du monde ». */
export function shippingFeeForCountry(
  country: string | null | undefined,
  config?: ShippingConfig | null
): number {
  const zones = resolveShippingZones(config);
  const c = (country || "").toUpperCase().trim();
  const match = zones.find((z) => (z.countries || []).includes(c));
  if (match) return match.fee_fcfa ?? 0;
  const fallback = zones.find((z) => !z.countries || z.countries.length === 0);
  return fallback?.fee_fcfa ?? 0;
}
