import type { Category, SubCategory } from "./categories";
import type { HomeSearchQuickLink } from "@/types";
import type { ShowcaseProduct } from "./products";

export const DEFAULT_HOME_SEARCH_QUESTION = "Que cherchez-vous ?";

/** Lien rapide résolu, prêt à rendre côté front. */
export interface ResolvedQuickLink {
  key: string;
  name: string;
  href: string;
  icon?: string;
  image?: string | null;
  familyName?: string;
}

/**
 * Réordonne les sous-catégories « en alternance » : deux sous-catégories d'une
 * même famille ne se suivent jamais (dans la mesure du possible). Greedy
 * « réarrangement de chaîne » : à chaque étape on pioche dans la famille qui a
 * le plus d'éléments restants, différente de la précédente. Déterministe et
 * robuste aux futurs ajouts de catégories/sous-catégories.
 */
export function interleaveSubcategories(categories: Category[]): SubCategory[] {
  const queues = categories
    .filter((c) => c.children.length > 0)
    .map((c) => ({ id: c.id, subs: [...c.children] }));

  const result: SubCategory[] = [];
  let lastId: string | null = null;

  while (true) {
    let best: { id: string; subs: SubCategory[] } | null = null;
    for (const q of queues) {
      if (q.subs.length === 0 || q.id === lastId) continue;
      if (!best || q.subs.length > best.subs.length) best = q;
    }
    if (!best) {
      // Il ne reste qu'une seule famille — on la vide telle quelle.
      const anyLeft = queues.find((q) => q.subs.length > 0);
      if (!anyLeft) break;
      best = anyLeft;
    }
    result.push(best.subs.shift()!);
    lastId = best.id;
  }

  return result;
}

/** Résout la liste des liens rapides (config admin ou repli « toutes les sous-catégories »). */
export function resolveQuickLinks(
  config: HomeSearchQuickLink[] | undefined,
  categories: Category[],
  products: ShowcaseProduct[]
): ResolvedQuickLink[] {
  // Première image de produit par sous-catégorie (miniature).
  const firstImageBySub = new Map<string, string>();
  for (const p of products) {
    const subId = p.showcase?.category;
    if (subId && p.main_image_url && !firstImageBySub.has(subId)) {
      firstImageBySub.set(subId, p.main_image_url);
    }
  }

  const familyBySub = new Map<string, Category>();
  const subById = new Map<string, SubCategory>();
  for (const fam of categories) {
    for (const sub of fam.children) {
      subById.set(sub.id, sub);
      familyBySub.set(sub.id, fam);
    }
  }

  const toLink = (sub: SubCategory): ResolvedQuickLink => {
    const fam = familyBySub.get(sub.id);
    return {
      key: `sub:${sub.id}`,
      name: sub.name,
      href: fam ? `/collection?family=${fam.id}&category=${sub.id}` : `/collection?category=${sub.id}`,
      icon: sub.icon,
      image: firstImageBySub.get(sub.id) ?? null,
      familyName: fam?.name,
    };
  };

  // Repli : toutes les sous-catégories, en alternance.
  if (!config || config.length === 0) {
    return interleaveSubcategories(categories).map(toLink);
  }

  // Config explicite (ordre et sélection de l'admin).
  const links: ResolvedQuickLink[] = [];
  config.forEach((item, i) => {
    if (item.type === "subcategory") {
      const sub = subById.get(item.id);
      if (sub) links.push(toLink(sub));
    } else {
      const name = item.name?.trim();
      if (!name) return;
      links.push({
        key: `page:${i}:${name}`,
        name,
        href: item.href?.trim() || "#",
        icon: item.icon,
        image: item.image || null,
      });
    }
  });
  return links;
}
