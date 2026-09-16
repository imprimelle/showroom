import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMetier } from "@/lib/metiers";
import { getPublishedProducts } from "@/lib/products";
import { resolveFamily } from "@/lib/categories";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { getWhatsAppUrl, DEFAULT_WHATSAPP } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const metier = getMetier(slug);
  if (!metier) return { title: "Page introuvable" };
  return {
    title: metier.metaTitle,
    description: metier.metaDescription,
  };
}

export default async function MetierPage({ params }: Props) {
  const { slug } = await params;
  const metier = getMetier(slug);
  if (!metier) notFound();

  const products = await getPublishedProducts().catch(() => []);
  const matched = products.filter(
    (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === metier.family
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--color-text-tertiary)] mb-4">
        <Link href="/" className="hover:text-[var(--color-text-primary)]">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-primary)]">{metier.label}</span>
      </nav>

      {/* Hero */}
      <div className="rounded-3xl bg-[var(--color-bg-secondary)] px-6 py-10 md:px-12 md:py-14 mb-8">
        <h1 className="font-display text-2xl md:text-4xl font-extrabold text-[var(--color-text-primary)] leading-tight max-w-3xl">
          {metier.h1}
        </h1>
        <p className="mt-4 text-sm md:text-base text-[var(--color-text-secondary)] max-w-2xl">
          {metier.intro}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href={getWhatsAppUrl(DEFAULT_WHATSAPP, metier.cta)} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg">💬 Devis gratuit sur WhatsApp</Button>
          </a>
          <Link href={`/collection?family=${metier.family}`}>
            <Button variant="secondary" size="lg">Voir le catalogue</Button>
          </Link>
        </div>
      </div>

      {/* Produits */}
      {matched.length > 0 ? (
        <>
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            {matched.length} produit{matched.length > 1 ? "s" : ""} disponible{matched.length > 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Sélectionnés pour votre projet — fabrication sur mesure
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {matched.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">🔧</span>
          <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">Produits en préparation</h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Nous fabriquons sur mesure — contactez-nous pour un devis personnalisé.
          </p>
        </div>
      )}
    </div>
  );
}
