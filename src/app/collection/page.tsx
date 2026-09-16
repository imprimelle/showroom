import { Suspense } from "react";
import { getPublishedProducts } from "@/lib/products";
import { resolveFamily } from "@/lib/categories";
import { getMinPrice } from "@/lib/utils";
import { getUsage } from "@/lib/usages";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { CollectionToolbar } from "./CollectionToolbar";
import type { ShowcaseProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ family?: string; category?: string; usage?: string; sort?: string; q?: string }>;
}

function CatalogueGrid({ products }: { products: ShowcaseProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">
          Aucun produit trouvé
        </h2>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
          Essayez une autre catégorie ou un autre mot-clé
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default async function CollectionPage({ searchParams }: Props) {
  const params = await searchParams;
  let products = await getPublishedProducts().catch(() => [] as ShowcaseProduct[]);

  // Filter by family (niveau 1)
  if (params.family) {
    products = products.filter(
      (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === params.family
    );
  }

  // Filter by sub-category (niveau 2)
  if (params.category) {
    products = products.filter((p) => p.showcase?.category === params.category);
  }

  // Filter by emplacement (usage intérieur/extérieur/les deux)
  if (params.usage) {
    const usage = getUsage(params.usage);
    if (usage) {
      products = products.filter((p) => p.showcase?.usage === usage.value);
    }
  }

  // Filter by search query (name + short description)
  if (params.q) {
    const q = params.q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.showcase?.short_description || "").toLowerCase().includes(q)
    );
  }

  // Sort
  if (params.sort === "price-asc") {
    products.sort((a, b) => (getMinPrice(a.variants) ?? Infinity) - (getMinPrice(b.variants) ?? Infinity));
  } else if (params.sort === "price-desc") {
    products.sort((a, b) => (getMinPrice(b.variants) ?? -Infinity) - (getMinPrice(a.variants) ?? -Infinity));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 text-center md:text-left">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
          Tous nos produits
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {products.length} produit{products.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters toolbar */}
      <CollectionToolbar
        currentFamily={params.family}
        currentCategory={params.category}
        currentUsage={params.usage}
        currentQuery={params.q}
        currentSort={params.sort}
      />

      {/* Grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <CatalogueGrid products={products} />
      </Suspense>
    </div>
  );
}
