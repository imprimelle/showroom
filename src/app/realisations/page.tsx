import Link from "next/link";
import { getPublishedProducts } from "@/lib/products";
import { CATEGORIES, getFamilyLabel, resolveFamily } from "@/lib/categories";
import { imgProxyUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ family?: string }>;
}

export default async function RealisationsPage({ searchParams }: Props) {
  const { family } = await searchParams;
  const products = await getPublishedProducts().catch(() => []);

  const filtered = family
    ? products.filter((p) => resolveFamily(p.showcase?.family, p.showcase?.category) === family)
    : products;
  const images = filtered.filter((p) => p.main_image_url);

  const chipClass = (active: boolean) =>
    cn(
      "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
      active
        ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]"
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
        Nos réalisations
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Découvrez nos produits fabriqués et livrés à travers Abidjan
      </p>

      {/* Filtre par univers */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 -mx-4 px-4">
        <Link href="/realisations" className={chipClass(!family)}>
          Toutes
        </Link>
        {CATEGORIES.map((fam) => (
          <Link key={fam.id} href={`/realisations?family=${fam.id}`} className={chipClass(family === fam.id)}>
            {fam.icon} {fam.name}
          </Link>
        ))}
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((p) => {
            const famId = resolveFamily(p.showcase?.family, p.showcase?.category);
            const famLabel = getFamilyLabel(famId);
            return (
              <Link key={p.id} href={`/collection/${p.slug}`} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img
                  src={imgProxyUrl(p.main_image_url, 600)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  {famLabel && (
                    <span className="inline-block text-[10px] uppercase tracking-wide font-semibold text-white/70 mb-0.5">
                      {famLabel}
                    </span>
                  )}
                  <span className="block text-white text-sm font-medium truncate">{p.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] flex flex-col items-center justify-center text-[var(--color-text-tertiary)]">
              <span className="text-sm">Bientôt disponible</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
