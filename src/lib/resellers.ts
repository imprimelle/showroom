import { unstable_cache } from "next/cache";
import { createServerClient } from "./supabase/server";
import type { Reseller, PublicStore, AffiliateStats } from "@/types";

/**
 * Logique du réseau de revente & affiliation.
 *
 * - `resolveAffiliateByRef` / `resolveAffiliateByPromo` : résolution serveur d'un
 *   code d'affiliation / code promo (anti-falsification — jamais confiance au client).
 * - `resolvePublicStores` : points de vente publiés, exposés sur la carte publique
 *   (champs non sensibles uniquement).
 * - `commissionRateFor` : taux de commission effectif d'un affilié (niveau).
 */

export const DEFAULT_COMMISSION_RATES = {
  standard: 8,
  performance: 10,
  vip: 15,
} as const;

export const DEFAULT_PROMO_PERCENT = 5;

/** Durée d'attribution par défaut (jours) du cookie ref. */
export const DEFAULT_COOKIE_DAYS = 30;

/** Seuil minimum de versement par défaut (FCFA). */
export const DEFAULT_PAYOUT_MIN_FCFA = 25000;

/** Normalise un code d'affiliation / promo (majuscules, sans espaces). */
export function normalizeCode(value?: string | null): string {
  return (value || "").trim().toUpperCase().replace(/\s+/g, "");
}

/** Taux de commission effectif selon le niveau de l'affilié. */
export function commissionRateFor(
  level: Reseller["level"],
  configured?: { standard?: number; performance?: number; vip?: number }
): number {
  const rates = {
    standard: configured?.standard ?? DEFAULT_COMMISSION_RATES.standard,
    performance: configured?.performance ?? DEFAULT_COMMISSION_RATES.performance,
    vip: configured?.vip ?? DEFAULT_COMMISSION_RATES.vip,
  };
  if (level === "performance") return rates.performance;
  if (level === "vip") return rates.vip;
  return rates.standard;
}

const getPublicStoresCached = unstable_cache(
  async (): Promise<PublicStore[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("showcase_resellers")
      .select("id, name, city, country, address, lat, lng, store_model, website")
      .eq("type", "store")
      .eq("is_published", true)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error || !Array.isArray(data)) return [];
    return (data as PublicStore[]).filter((s) => s.lat != null && s.lng != null);
  },
  ["resellers-public-stores"],
  { revalidate: 120, tags: ["resellers"] }
);

/** Points de vente publiés (géolocalisés) pour la carte publique. */
export async function getPublicStores(): Promise<PublicStore[]> {
  try {
    return await getPublicStoresCached();
  } catch {
    return [];
  }
}

/**
 * Résout un affilié ACTIF depuis son `ref_code` (lien `?ref=CODE`).
 * Renvoie `null` si introuvable, non-actif, ou de type non-affilié.
 * À utiliser côté serveur uniquement (service-role).
 */
export async function resolveAffiliateByRef(
  supabase: ReturnType<typeof createServerClient>,
  refCode: string
): Promise<Reseller | null> {
  const code = normalizeCode(refCode);
  if (!code) return null;

  const { data, error } = await supabase
    .from("showcase_resellers")
    .select("*")
    .eq("type", "affiliate")
    .eq("status", "active")
    .eq("ref_code", code)
    .maybeSingle();

  if (error || !data) return null;
  return data as Reseller;
}

/**
 * Résout un affilié ACTIF depuis son `promo_code`.
 * Renvoie `null` si introuvable, non-actif, ou sans code promo défini.
 */
export async function resolveAffiliateByPromo(
  supabase: ReturnType<typeof createServerClient>,
  promoCode: string
): Promise<Reseller | null> {
  const code = normalizeCode(promoCode);
  if (!code) return null;

  const { data, error } = await supabase
    .from("showcase_resellers")
    .select("*")
    .eq("type", "affiliate")
    .eq("status", "active")
    .eq("promo_code", code)
    .maybeSingle();

  if (error || !data) return null;
  return data as Reseller;
}

/** Calcule une commission (arrondie à l'entier inférieur) sur une assiette HT hors livraison. */
export function computeCommission(amountHtFcfa: number, ratePercent: number): number {
  if (amountHtFcfa <= 0 || ratePercent <= 0) return 0;
  return Math.floor((amountHtFcfa * ratePercent) / 100);
}

/** Calcule la remise d'un code promo (FCFA, arrondie inférieur). */
export function computePromoDiscount(amountHtFcfa: number, percent: number): number {
  if (amountHtFcfa <= 0 || percent <= 0) return 0;
  return Math.floor((amountHtFcfa * percent) / 100);
}

/** Statistiques d'un affilié (agrégats sur ses commandes attribuées). */
export async function getAffiliateStats(
  supabase: ReturnType<typeof createServerClient>,
  refCode: string
): Promise<AffiliateStats | null> {
  const affiliate = await resolveAffiliateByRef(supabase, refCode);
  if (!affiliate) return null;

  const { data: orders } = await supabase
    .from("showcase_orders")
    .select("total_amount, commission_fcfa, commission_status")
    .eq("reseller_id", affiliate.id);

  const list = (orders as any[]) || [];
  const order_count = list.length;
  const revenue_fcfa = list.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  let pending_fcfa = 0;
  let earned_fcfa = 0;
  let paid_fcfa = 0;

  for (const o of list) {
    const amount = Number(o.commission_fcfa) || 0;
    if (o.commission_status === "paid") paid_fcfa += amount;
    else if (o.commission_status === "earned") earned_fcfa += amount;
    else if (o.commission_status === "pending" || !o.commission_status) pending_fcfa += amount;
  }

  return {
    ref_code: affiliate.ref_code!,
    name: affiliate.name,
    promo_code: affiliate.promo_code ?? null,
    promo_discount_percent: affiliate.promo_discount_percent ?? null,
    commission_rate: Number(affiliate.commission_rate) || DEFAULT_COMMISSION_RATES.standard,
    order_count,
    revenue_fcfa,
    pending_fcfa,
    earned_fcfa,
    paid_fcfa,
  };
}
