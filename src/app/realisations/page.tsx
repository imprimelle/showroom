import Link from "next/link";
import { getPublishedProducts } from "@/lib/products";
import { imgProxyUrl } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function RealisationsPage() {
  const products = await getPublishedProducts().catch(() => []);
  const images = products.filter((p) => p.main_image_url);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">Nos réalisations</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">Découvrez nos enseignes fabriquées et livrées à travers Abidjan</p>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((p) => (
            <Link key={p.id} href={`/collection/${p.slug}`} className="relative aspect-square rounded-2xl overflow-hidden group">
              <img
                src={imgProxyUrl(p.main_image_url, 600)}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium truncate">{p.name}</span>
            </Link>
          ))}
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
