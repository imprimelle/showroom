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
 * Catégories par défaut (hiérarchie 2 niveaux). Servent de repli quand
 * `showcase_settings.data.catalog` est vide (état initial).
 */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "mobilier-decorations",
    name: "Mobilier & Décorations",
    icon: "🛋️",
    color: "from-emerald-500/80",
    image: "/images/categories/mobilier-decorations.svg",
    children: [
      { id: "table-lumineuse", name: "Table lumineuse", icon: "🪑" },
    ],
  },
  {
    id: "tableaux-decoratifs",
    name: "Tableaux décoratifs",
    icon: "🖼️",
    color: "from-fuchsia-500/80",
    children: [
      { id: "tableau-decoratif", name: "Tableau décoratif", icon: "🖼️" },
      { id: "portrait-lumineux", name: "Portrait lumineux", icon: "🧑‍🎨" },
      { id: "tableau-infini", name: "Tableaux Infinie", icon: "🪞" },
      { id: "logo-football-neon", name: "Logo Football néon", icon: "⚽" },
    ],
  },
  {
    id: "enseignes-signaletique",
    name: "Enseignes & Signalétique",
    icon: "💡",
    color: "from-amber-500/80",
    image: "/images/categories/enseignes-signaletique.svg",
    children: [
      { id: "caisson-lumineux", name: "Caisson lumineux", icon: "💡" },
      { id: "enseigne-dibond", name: "Enseigne dibond", icon: "🏢" },
      { id: "lettres-3d", name: "Lettres 3D", icon: "🔤" },
      { id: "totem", name: "Totem", icon: "🗼" },
      { id: "panneau-led", name: "Panneau LED", icon: "🖥️" },
      { id: "enseigne-neon", name: "Enseigne néon", icon: "✨" },
    ],
  },
];

function deepCopy(list: Category[]): Category[] {
  return list.map((c) => ({ ...c, children: [...c.children] }));
}

/**
 * Source unique de vérité pour la catégorisation, mutable : hydratée depuis
 * `showcase_settings.data.catalog` (sinon repli sur les valeurs par défaut).
 * Mutée en place (jamais réassignée) pour que tous les importeurs voient
 * les changements sans dépendre des live-bindings ES.
 */
export const CATEGORIES: Category[] = deepCopy(DEFAULT_CATEGORIES);
export const ALL_SUBCATEGORIES: SubCategory[] = CATEGORIES.flatMap((c) => c.children);

/** Remplace le catalogue courant (côté serveur et client via hydration). */
export function setCategories(list: Category[] | null | undefined): void {
  const resolved = resolveCategories(list);
  const copy = deepCopy(resolved);
  CATEGORIES.length = 0;
  CATEGORIES.push(...copy);
  ALL_SUBCATEGORIES.length = 0;
  ALL_SUBCATEGORIES.push(...copy.flatMap((c) => c.children));
}

/** Renvoie le catalogue effectif : `catalog` si non vide, sinon les valeurs par défaut. */
export function resolveCategories(custom?: Category[] | null): Category[] {
  return custom && custom.length > 0 ? custom : DEFAULT_CATEGORIES;
}

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
