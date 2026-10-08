import { NextRequest, NextResponse } from "next/server";
import { getPublishedProducts } from "@/lib/products";
import { resolveFamily, getCategoryLabel, getFamilyLabel } from "@/lib/categories";
import { getMinPrice, normalizeForSearch } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/search/suggest?q=caisson&family=enseignes-signaletique
 * Renvoie des suggestions de produits (image, catégorie, prix) pour
 * l'autocomplétion de recherche (drawer burger + page catégorie).
 * Sans `q`, renvoie les produits les plus populaires.
 * `family` (optionnel) restreint les suggestions à un univers.
 */
export async function GET(request: NextRequest) {
  const q = normalizeForSearch(request.nextUrl.searchParams.get("q") || "").trim();
  const family = request.nextUrl.searchParams.get("family") || undefined;

  const all = await getPublishedProducts().catch(() => []);

  let pool = all;
  if (family) {
    pool = all.filter(
      (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === family
    );
  }

  const matches = q
    ? pool.filter((p) => {
        const name = normalizeForSearch(p.name);
        const desc = normalizeForSearch(p.showcase?.short_description || "");
        const catLabel = normalizeForSearch(getCategoryLabel(p.showcase?.category));
        const famLabel = normalizeForSearch(
          getFamilyLabel(resolveFamily(p.showcase?.family, p.showcase?.category))
        );
        return (
          name.includes(q) ||
          desc.includes(q) ||
          catLabel.includes(q) ||
          famLabel.includes(q)
        );
      })
    : [...pool].sort(
        (a, b) => (b.showcase?.popularity || 0) - (a.showcase?.popularity || 0)
      );

  const items = matches.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.main_image_url,
    category: getCategoryLabel(p.showcase?.category),
    family: resolveFamily(p.showcase?.family, p.showcase?.category),
    price: getMinPrice(p.variants),
  }));

  return NextResponse.json({ query: q, items });
}
