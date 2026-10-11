/** Nombre de places par défaut d'un groupage (60 personnes). */
export const GROUPAGE_DEFAULT_MAX_PLACES = 60;

/** Configuration groupage d'un produit (présente et activée). */
export interface GroupageConfig {
  enabled: boolean;
  /** id de la variante clonée (base du prix groupé). */
  variant_id: string | null;
  /** % de réduction appliqué au prix de base (variante clonée). */
  reduction_percent: number;
  /** Nombre de places du groupage. */
  max_places: number;
  /** Nombre de places déjà attribuées (base d'affichage, 0..max_places). Les commandes réelles s'y ajoutent. null = 0. */
  base_places: number | null;
  /** Montant de départ (acompte, FCFA). null = la totalité est payée immédiatement. */
  deposit_fcfa: number | null;
  /** IDs des options de paramètres incluses gratuitement dans l'offre. */
  included_option_ids: string[];
  /** Nombre de partages affiché artificiellement (base), auquel s'ajoutent les partages réels. */
  base_shares: number;
}

/** Référence minimale d'une variante pour les calculs groupage. */
export interface GroupageVariantRef {
  id?: string;
  sku?: string;
  name?: string;
  price: number | null;
  attributes?: Record<string, string>;
  image?: string;
}

/**
 * Lit la configuration groupage d'un produit depuis `showcase.groupage`.
 * Renvoie `null` si le produit n'est pas éligible / désactivé.
 */
export function resolveGroupageConfig(showcase: any): GroupageConfig | null {
  const g = showcase?.groupage;
  if (!g || typeof g !== "object" || !g.enabled) return null;
  const pct =
    typeof g.reduction_percent === "number" && g.reduction_percent >= 0
      ? g.reduction_percent
      : 0;
  const maxPlaces =
    typeof g.max_places === "number" && g.max_places > 0
      ? Math.round(g.max_places)
      : GROUPAGE_DEFAULT_MAX_PLACES;
  const basePlaces =
    typeof g.base_places === "number" && g.base_places >= 0
      ? Math.round(g.base_places)
      : null;
  const deposit =
    typeof g.deposit_fcfa === "number" && g.deposit_fcfa >= 0
      ? Math.round(g.deposit_fcfa)
      : null;
  const included = Array.isArray(g.included_option_ids)
    ? g.included_option_ids.filter((x: any) => typeof x === "string")
    : [];
  return {
    enabled: true,
    variant_id: typeof g.variant_id === "string" && g.variant_id ? g.variant_id : null,
    reduction_percent: pct,
    max_places: maxPlaces,
    base_places: basePlaces,
    deposit_fcfa: deposit,
    included_option_ids: included,
    base_shares:
      typeof g.base_shares === "number" && g.base_shares >= 0
        ? Math.round(g.base_shares)
        : 0,
  };
}

/** Résout la variante clonée (cible du groupage), ou null. */
export function resolveGroupageVariant<T extends { id?: string; price: number | null }>(
  config: GroupageConfig,
  variants?: T[] | null
): T | null {
  if (!config.variant_id) return null;
  return variants?.find((v) => v.id === config.variant_id) ?? null;
}

/** Prix groupé de base = prix de la variante clonée × (1 − réduction %). Null si pas de prix. */
export function groupagePrice(
  config: GroupageConfig,
  variants?: { id?: string; price: number | null }[] | null
): number | null {
  const v = resolveGroupageVariant(config, variants);
  if (!v || v.price == null) return null;
  return Math.round(v.price * (1 - config.reduction_percent / 100));
}

/** Montant économisé = prix de la variante clonée × réduction %. */
export function groupageReductionAmount(
  config: GroupageConfig,
  variants?: { id?: string; price: number | null }[] | null
): number | null {
  const v = resolveGroupageVariant(config, variants);
  if (!v || v.price == null) return null;
  return Math.round((v.price * config.reduction_percent) / 100);
}

/** Répartition acompte / solde à partir d'un montant de départ fixe. */
export function computeDepositBalance(
  total: number,
  depositFcfa: number | null
): { deposit: number; balance: number } {
  if (depositFcfa == null) return { deposit: total, balance: 0 };
  const d = Math.min(depositFcfa, total);
  return { deposit: d, balance: total - d };
}

/** Nombre de places restantes (clampé ≥ 0). */
export function remainingPlaces(maxPlaces: number, placesTaken: number): number {
  return Math.max(0, maxPlaces - placesTaken);
}
