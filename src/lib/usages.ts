export interface Usage {
  id: string; // slug URL
  label: string; // libellé affiché
  value: string; // valeur exacte de `products.showcase.usage`
}

/**
 * Source unique de vérité pour le filtre « emplacement » (usage).
 * Les valeurs correspondent à la colonne JSONB `products.showcase.usage`
 * (constatées en base : intérieur / extérieur / les deux).
 * Ne jamais re-déclarer ces valeurs ailleurs.
 */
export const USAGES: Usage[] = [
  { id: "exterieur", label: "Extérieur", value: "extérieur" },
  { id: "interieur", label: "Intérieur", value: "intérieur" },
  { id: "les-deux", label: "Intérieur & extérieur", value: "les deux" },
];

/** Usage par slug URL. */
export function getUsage(id?: string | null): Usage | undefined {
  if (!id) return undefined;
  return USAGES.find((u) => u.id === id);
}
