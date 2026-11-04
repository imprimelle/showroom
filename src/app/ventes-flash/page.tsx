import { getShowcaseSettings } from "@/lib/settings";
import { getPublishedProducts } from "@/lib/products";
import { DEFAULT_FLASH_SALE } from "@/lib/home";
import { ProductCard } from "@/components/product/ProductCard";
import { FlashTimerGauge } from "@/components/product/FlashTimerGauge";
import { Zap } from "lucide-react";
import type { ShowcaseProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ventes flash",
  description: "Offres limitées, renouvelées chaque jour.",
};

export default async function VentesFlashPage() {
  const [settings, allProducts] = await Promise.all([
    getShowcaseSettings(),
    getPublishedProducts().catch(() => [] as ShowcaseProduct[]),
  ]);

  const fs = settings.flash_sale;
  const title = fs?.title || DEFAULT_FLASH_SALE.title;
  const subtitle = fs?.subtitle;
  const endTime = fs?.end_time || DEFAULT_FLASH_SALE.end_time;

  // Produits de la vente flash : ceux configurés dans l'admin, sinon tout le catalogue.
  const slugs = fs?.product_slugs || [];
  const products =
    slugs.length > 0
      ? slugs
          .map((slug) => allProducts.find((p) => p.slug === slug))
          .filter((p): p is ShowcaseProduct => Boolean(p))
      : allProducts;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Bandeau rouge + minuteur */}
      <div className="rounded-lg bg-[#DC2626] px-5 py-6 md:px-8 md:py-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-white leading-tight">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-white/85 text-sm mt-0.5">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[260px] shrink-0">
            <span className="block text-white/90 text-xs font-semibold uppercase tracking-wide mb-1.5">
              Se termine dans
            </span>
            <FlashTimerGauge endTime={endTime} />
          </div>
        </div>
      </div>

      {/* Grille produits */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-tertiary)] text-center py-16">
          Aucune vente flash pour le moment.
        </p>
      )}
    </div>
  );
}
