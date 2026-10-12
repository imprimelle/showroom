import type { ShowcaseProduct } from "./products";
import type { ProductParameter } from "@/types";
import {
  resolveGroupageConfig,
  resolveGroupageVariant,
  groupagePrice,
  groupageReductionAmount,
} from "./groupage";
import { resolveActiveParameters } from "./parameters";

/**
 * Donnée d'un produit groupable, résolue côté serveur pour le slider « groupage »
 * (accueil + pages catégories). Reprend le style de la grande carte groupage
 * (GroupageCard) mais réduit : pas de partage, pas d'options ajoutables —
 * seulement les options incluses.
 */
export interface GroupageHomeItem {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  /** Prix groupé de base (variante clonée × (1 − réduction %)). */
  groupPrice: number;
  /** Prix « normal » barré : variante clonée + valeur catalogue des options incluses. */
  originalTotal: number;
  reductionPercent: number;
  /** Économie affichée = réduction + valeur catalogue des options incluses. */
  savings: number;
  maxPlaces: number;
  /** Places déjà attribuées (base d'affichage additive). */
  basePlaces: number;
  /** Options incluses gratuitement (libellé + valeur catalogue). */
  includedOptions: { id: string; label: string; price: number | null }[];
}

/**
 * Résout les produits groupables (achat groupé activé + variante clonée avec prix).
 * Prix et options incluses calculés côté serveur ; la jauge « live » est chargée côté client.
 */
export function buildGroupageHomeItems(
  products: ShowcaseProduct[],
  productParameters?: ProductParameter[] | null
): GroupageHomeItem[] {
  return products
    .map((p) => {
      const config = resolveGroupageConfig(p.showcase);
      if (!config) return null;
      const cloned = resolveGroupageVariant(config, p.variants);
      const groupPrice = groupagePrice(config, p.variants);
      const originalPrice = cloned?.price ?? null;
      if (groupPrice == null || originalPrice == null) return null;

      const params = resolveActiveParameters(p.showcase, productParameters);
      const includedOptions = params.flatMap((param) =>
        param.options
          .filter((o) => config.included_option_ids.includes(o.id))
          .map((o) => ({ id: o.id, label: o.label, price: o.price ?? null }))
      );
      const includedTotal = includedOptions.reduce((s, o) => s + (o.price ?? 0), 0);
      const reductionFcfa = groupageReductionAmount(config, p.variants) ?? 0;

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        image: p.main_image_url,
        groupPrice,
        originalTotal: originalPrice + includedTotal,
        reductionPercent: config.reduction_percent,
        savings: reductionFcfa + includedTotal,
        maxPlaces: config.max_places,
        basePlaces: config.base_places ?? 0,
        includedOptions,
      } satisfies GroupageHomeItem;
    })
    .filter((x): x is GroupageHomeItem => !!x);
}
