export interface SubCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Tailwind gradient "from-..." class for the bento tiles
  image?: string; // Image de la famille (SVG local ou URL storage)
  children: SubCategory[];
}

/**
 * Source unique de vérité pour la catégorisation (hiérarchie 2 niveaux) :
 * 3 familles (niveau 1) + sous-catégories (niveau 2).
 * Importée par la home, le catalogue, la page produit et l'admin.
 * Ne jamais re-déclarer ces valeurs ailleurs.
 */
export const CATEGORIES: Category[] = [
  {
    id: "enseignes-lumineuses",
    name: "Enseignes lumineuses",
    icon: "💡",
    color: "from-amber-500/80",
    image: "/images/categories/enseignes-lumineuses.svg",
    children: [
      { id: "caisson-lumineux", name: "Caisson lumineux", icon: "💡" },
      { id: "enseigne-dibond", name: "Enseigne dibond", icon: "🏢" },
      { id: "lettres-3d", name: "Lettres 3D", icon: "🔤" },
      { id: "totem", name: "Totem", icon: "🗼" },
      { id: "panneau-led", name: "Panneau LED", icon: "🖥️" },
      { id: "enseigne-neon", name: "Enseigne néon", icon: "✨" },
    ],
  },
  {
    id: "tableau-decoratif",
    name: "Tableau décoratif",
    icon: "🖼️",
    color: "from-purple-500/80",
    image: "/images/categories/tableau-decoratif.svg",
    children: [],
  },
  {
    id: "table-mobilier-lumineux",
    name: "Table & mobilier lumineux",
    icon: "🛋️",
    color: "from-emerald-500/80",
    image: "/images/categories/table-mobilier-lumineux.svg",
    children: [
      { id: "table-lumineuse", name: "Table lumineuse", icon: "🪑" },
    ],
  },
];

export const ALL_SUBCATEGORIES: SubCategory[] = CATEGORIES.flatMap((c) => c.children);

/** Famille (niveau 1) par slug. */
export function getCategory(id?: string | null): Category | undefined {
  if (!id) return undefined;
  return CATEGORIES.find((c) => c.id === id);
}

/** Sous-catégorie (niveau 2) par slug. */
export function getSubCategory(id?: string | null): SubCategory | undefined {
  if (!id) return undefined;
  return ALL_SUBCATEGORIES.find((s) => s.id === id);
}

/** Famille qui contient une sous-catégorie donnée. */
export function getFamilyOfSubCategory(subId?: string | null): Category | undefined {
  if (!subId) return undefined;
  return CATEGORIES.find((c) => c.children.some((s) => s.id === subId));
}

/** Label du sous-type si l'id est un sous-type, sinon de la famille. */
export function getCategoryLabel(id?: string | null): string {
  return getSubCategory(id)?.name || getCategory(id)?.name || id || "Autre";
}

export function getCategoryIcon(id?: string | null): string {
  return getSubCategory(id)?.icon || getCategory(id)?.icon || "📦";
}

export function getFamilyLabel(id?: string | null): string {
  return getCategory(id)?.name || "";
}

/** Résout le slug de famille d'un produit : `family` explicite, sinon dérivé de la sous-catégorie. */
export function resolveFamily(family?: string | null, category?: string | null): string | undefined {
  if (family) return family;
  return getFamilyOfSubCategory(category)?.id;
}
