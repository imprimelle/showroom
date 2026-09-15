import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProducts } from "@/lib/products";
import { getCategory, resolveFamily } from "@/lib/categories";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
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

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const all = await getPublishedProducts().catch(() => []);
  let products = all.filter(
    (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === cat.id
  );
  if (sub) products = products.filter((p) => p.showcase?.category === sub);

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
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>{cat.icon}</span> {cat.name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {products.length} produit{products.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Sous-catégories chips */}
      {cat.children.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 -mx-4 px-4">
          <Link
            href={`/collection/categorie/${cat.id}`}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              !sub
                ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]"
            )}
          >
            Tous
          </Link>
          {cat.children.map((s) => (
            <Link
              key={s.id}
              href={`/collection/categorie/${cat.id}?sub=${s.id}`}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                sub === s.id
                  ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]"
              )}
            >
              {s.icon} {s.name}
            </Link>
          ))}
        </div>
      )}

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">{cat.icon}</span>
          <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">
            {cat.children.length === 0 ? "Bientôt disponible" : "Aucun produit dans cette catégorie"}
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            {cat.children.length === 0
              ? "Cette collection arrive prochainement."
              : "Essayez une autre sous-catégorie."}
          </p>
          <Link href="/collection" className="text-sm text-[var(--color-accent-blue)] hover:underline mt-2">
            Voir tout le catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
