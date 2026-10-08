import type { ProductParameter, ProductParameterOption } from "@/types";

/**
 * Catalogue par défaut des paramètres produit.
 * Source de vérité partagée front + admin : si `showcase_settings.data.product_parameters`
 * est vide, on retombe sur ces valeurs (et l'admin les pré-remplit à la première édition).
 *
 * - « Couleur » : single-select (swatches hex, sans coût).
 * - « Options » : multi-select (LED, variateur… avec coûts).
 * - « Revêtement » : multi-select (bois/marbre/verre… avec coûts, miniatures à uploader).
 */
export const DEFAULT_PRODUCT_PARAMETERS: ProductParameter[] = [
  {
    id: "couleur",
    name: "Couleur",
    type: "single",
    options: [
      { id: "bois-naturel", label: "Bois naturel", color: "#C89B6D", price: null },
      { id: "noyer", label: "Noyer", color: "#7A5230", price: null },
      { id: "noir", label: "Noir", color: "#1A1A1A", price: null },
      { id: "blanc", label: "Blanc", color: "#F5F5F5", price: null },
      { id: "gris", label: "Gris", color: "#9CA3AF", price: null },
    ],
  },
  {
    id: "options",
    name: "Options",
    type: "multi",
    options: [
      { id: "led-blanc", label: "LED blanc chaud", price: null },
      { id: "led-rgb", label: "LED RGB", price: 50000 },
      { id: "variateur", label: "Variateur", price: 25000 },
      { id: "telecommande", label: "Télécommande", price: 15000 },
    ],
  },
  {
    id: "revetement",
    name: "Revêtement",
    type: "multi",
    options: [
      { id: "bois-chene", label: "Chêne", price: 60000 },
      { id: "bois-noyer", label: "Noyer", price: 60000 },
      { id: "marbre", label: "Marbre", price: 90000 },
      { id: "verre-trempe", label: "Verre trempé", price: 75000 },
    ],
  },
];

interface ShowcaseShape {
  active_parameters?: string[] | null;
  category?: string | null;
  table_colors?: unknown[] | null;
  table_options?: unknown[] | null;
}

/**
 * Résout la liste des paramètres actifs d'un produit.
 * - Priorité : `showcase.active_parameters` (IDs du catalogue global).
 * - Repli legacy : les tables lumineuses (ou produits ayant `table_colors`/`table_options`)
 *   affichent « Couleur » + « Options ».
 */
export function resolveActiveParameters(
  showcase: ShowcaseShape | undefined | null,
  catalog: ProductParameter[] | undefined | null
): ProductParameter[] {
  const list = catalog && catalog.length ? catalog : DEFAULT_PRODUCT_PARAMETERS;
  const sc = showcase || {};

  let ids: string[] = Array.isArray(sc.active_parameters) ? sc.active_parameters : [];
  if (ids.length === 0) {
    if (sc.category === "table-lumineuse" || (sc.table_colors?.length || sc.table_options?.length)) {
      ids = ["couleur", "options"];
    }
  }

  return ids
    .map((id) => list.find((p) => p.id === id))
    .filter((p): p is ProductParameter => Boolean(p));
}

/** Retrouve une option dans un paramètre (ou undefined). */
export function findOption(
  parameter: ProductParameter | undefined,
  optionId: string
): ProductParameterOption | undefined {
  return parameter?.options.find((o) => o.id === optionId);
}

/** Coût d'une option (0 si absente ou sans prix). */
export function optionPrice(option: ProductParameterOption | undefined): number {
  return option?.price ?? 0;
}
