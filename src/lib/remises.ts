import type { RemiseRule, ShowcaseSettings, SurplusType } from "@/types";
import { resolveFamily } from "./categories";

/**
 * Moteur de prix « remises & surplus » (onglet admin « Remises »).
 *
 * - Surplus : montant artificiel ajouté au prix de base de TOUS les produits,
 *   soit en valeur fixe (FCFA), soit en pourcentage du prix de base.
 * - Remises : règles scopées (tous / catégorie / produit), en % ou en valeur fixe.
 *   La règle la plus spécifique l'emporte : produit > catégorie > tous.
 *
 * Utilisé à la fois côté client (affichage + panier) et côté serveur (validation
 * de commande dans /api/orders), via les mêmes fonctions pures.
 */

/** Descripteur minimal d'un produit pour le calcul de remise. */
export interface RemiseProductRef {
  id: string;
  family?: string | null;
  category?: string | null;
}

/** Config résolue (défauts appliqués, règles désactivées filtrées). */
export interface RemisesResolved {
  surplus: { enabled: boolean; type: SurplusType; amountFcfa: number; percent: number };
  rules: RemiseRule[];
}

/** Répartition de prix pour un produit donné. */
export interface PriceBreakdown {
  /** Prix de base (variante). */
  base: number;
  /** Prix de référence = base + surplus (le « avant » affiché). */
  reference: number;
  /** Prix final après remise. */
  final: number;
  /** Montant de la remise (FCFA). */
  discountAmount: number;
  /** Règle appliquée (ou null). */
  rule: RemiseRule | null;
  /** Vrai si une remise a effectivement réduit le prix. */
  discounted: boolean;
}

/** Règles par défaut (aucune remise). */
export const DEFAULT_REMISES: RemisesResolved = {
  surplus: { enabled: false, type: "fixed", amountFcfa: 0, percent: 0 },
  rules: [],
};

/** Résout la config brute des remises (défauts + filtrage des règles désactivées/vides). */
export function resolveRemises(config?: ShowcaseSettings["remises"]): RemisesResolved {
  const surplus = config?.surplus;
  const type: SurplusType = surplus?.type === "percent" ? "percent" : "fixed";
  const amountFcfa = Number(surplus?.amount_fcfa) || 0;
  const percent = Math.min(100, Math.max(0, Number(surplus?.percent) || 0));
  // Valeur « active » selon le type : montant fixe OU pourcentage (détermine l'activation).
  const activeValue = type === "percent" ? percent : amountFcfa;
  const rawRules = Array.isArray(config?.rules) ? config.rules : [];
  const rules: RemiseRule[] = rawRules
    .filter((r) => r && r.enabled !== false)
    .filter((r) => {
      if (r.scope === "product") return !!r.product_id;
      if (r.scope === "category") return !!r.category_id;
      return true; // "all"
    })
    .filter((r) => Number.isFinite(Number(r.value)) && Number(r.value) > 0);
  return {
    surplus: { enabled: !!surplus?.enabled && activeValue > 0, type, amountFcfa, percent },
    rules,
  };
}

/** Une règle de portée `category` matche-t-elle ce produit (famille ou sous-catégorie) ? */
function ruleMatchesCategory(rule: RemiseRule, product: RemiseProductRef): boolean {
  if (!rule.category_id) return false;
  const family = resolveFamily(product.family, product.category);
  return rule.category_id === family || rule.category_id === product.category;
}

/**
 * Renvoie la règle applicable à un produit (la plus spécifique l'emporte).
 * `product` > `category` > `all`. À spécificité égale, la 1re règle de la liste gagne.
 */
export function matchRule(product: RemiseProductRef, rules: RemiseRule[]): RemiseRule | null {
  let byProduct: RemiseRule | null = null;
  let byCategory: RemiseRule | null = null;
  let byAll: RemiseRule | null = null;
  for (const r of rules) {
    if (r.scope === "product" && r.product_id === product.id && !byProduct) byProduct = r;
    else if (r.scope === "category" && ruleMatchesCategory(r, product) && !byCategory) byCategory = r;
    else if (r.scope === "all" && !byAll) byAll = r;
  }
  return byProduct ?? byCategory ?? byAll;
}

/** Montant de surplus à ajouter au prix de base, selon le type configuré. */
export function surplusAmount(base: number, surplus: RemisesResolved["surplus"]): number {
  if (!surplus.enabled) return 0;
  if (surplus.type === "percent") {
    return Math.round((base * surplus.percent) / 100);
  }
  return surplus.amountFcfa;
}

/** Applique le surplus puis la remise à un prix de base. */
export function computePrice(
  base: number,
  product: RemiseProductRef,
  remises: RemisesResolved
): PriceBreakdown {
  const reference = base + surplusAmount(base, remises.surplus);
  const rule = matchRule(product, remises.rules);
  let final = reference;
  let discountAmount = 0;
  if (rule) {
    if (rule.type === "percent") {
      const pct = Math.min(100, Math.max(0, Number(rule.value)));
      discountAmount = Math.round((reference * pct) / 100);
    } else {
      discountAmount = Math.min(reference, Math.max(0, Number(rule.value)));
    }
    final = Math.max(0, reference - discountAmount);
  }
  return {
    base,
    reference,
    final,
    discountAmount,
    rule,
    discounted: discountAmount > 0 && final < reference,
  };
}
