export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Tailwind gradient "from-..." class for the bento tiles
}

/**
 * Source unique de vérité pour les catégories produit.
 * Importée par la home, le catalogue, la page produit et l'admin.
 * Ne jamais re-déclarer ces valeurs ailleurs.
 */
export const CATEGORIES: Category[] = [
  { id: "caisson-lumineux", name: "Caisson lumineux", icon: "💡", color: "from-amber-500/80" },
  { id: "enseigne-dibond", name: "Enseigne dibond", icon: "🏢", color: "from-blue-500/80" },
  { id: "lettres-3d", name: "Lettres 3D", icon: "🔤", color: "from-emerald-500/80" },
  { id: "totem", name: "Totem", icon: "🗼", color: "from-purple-500/80" },
  { id: "panneau-led", name: "Panneau LED", icon: "🖥️", color: "from-cyan-500/80" },
  { id: "enseigne-neon", name: "Enseigne néon", icon: "✨", color: "from-pink-500/80" },
];

export function getCategory(id?: string | null): Category | undefined {
  if (!id) return undefined;
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id?: string | null): string {
  return getCategory(id)?.name || id || "Autre";
}

export function getCategoryIcon(id?: string | null): string {
  return getCategory(id)?.icon || "📦";
}
