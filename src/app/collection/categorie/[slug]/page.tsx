import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProducts } from "@/lib/products";
import { getCategory } from "@/lib/categories";
import { ProductCard } from "@/components/product/ProductCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: `${cat.name} — Enseignes sur mesure`,
    description: `Découvrez nos ${cat.name.toLowerCase()} fabriqués en Côte d'Ivoire. Livraison et installation à Abidjan.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const products = (await getPublishedProducts().catch(() => []))
    .filter((p) => p.showcase?.category === cat.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--color-text-tertiary)] mb-4">
        <Link href="/" className="hover:text-[var(--color-text-primary)]">Accueil</Link>
        <span className="mx-2">/</span>
        <Link href="/collection" className="hover:text-[var(--color-text-primary)]">Catalogue</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-primary)]">{cat.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>{cat.icon}</span> {cat.name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {products.length} produit{products.length > 1 ? "s" : ""}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">Aucun produit dans cette catégorie</h2>
          <Link href="/collection" className="text-sm text-[var(--color-accent-blue)] hover:underline mt-2">
            Voir tout le catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
