import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProducts } from "@/lib/products";
import { getShowcaseSettings } from "@/lib/settings";
import { getCategory, resolveFamily } from "@/lib/categories";
import { ProductCard } from "@/components/product/ProductCard";
import { Comparator } from "@/components/decision/Comparator";
import { CategorySearch } from "@/components/search/CategorySearch";
import { Button } from "@/components/ui/Button";
import { imgProxyUrl } from "@/lib/images";
import { cn, getWhatsAppUrl, DEFAULT_WHATSAPP, normalizeForSearch } from "@/lib/utils";
import { quoteMessage } from "@/lib/whatsapp";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string; q?: string }>;
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
  const { sub, q } = await searchParams;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const all = await getPublishedProducts().catch(() => []);
  const settings = await getShowcaseSettings();
  const catTitle = settings.categories?.[cat.id]?.title || cat.name;
  const familyProducts = all.filter(
    (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === cat.id
  );
  let products = sub
    ? familyProducts.filter((p) => p.showcase?.category === sub)
    : familyProducts;

  // Filtre par recherche (name + description courte, insensible aux accents)
  if (q) {
    const query = normalizeForSearch(q);
    products = products.filter(
      (p) =>
        normalizeForSearch(p.name).includes(query) ||
        normalizeForSearch(p.showcase?.short_description || "").includes(query)
    );
  }

  const firstImage = familyProducts.find((p) => p.main_image_url)?.main_image_url;
  const bannerImage = firstImage ? imgProxyUrl(firstImage, 1200, 675) : cat.image;

  return (
    <div>
      {/* Bannière plein écran (sous la navbar transparente) */}
      <div className="relative w-full h-[40vh] min-h-[260px] md:h-[46vh] md:min-h-[320px]">
        {bannerImage ? (
          <img src={bannerImage} alt={cat.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cat.color}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-12 md:pb-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
              <span>{cat.icon}</span> {catTitle}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {products.length} produit{products.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-[var(--color-text-tertiary)] mb-4">
          <Link href="/" className="hover:text-[var(--color-text-primary)]">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/collection" className="hover:text-[var(--color-text-primary)]">Catalogue</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-text-primary)]">{catTitle}</span>
        </nav>

        {/* Recherche dans l'univers (suggestions + filtre) */}
        <CategorySearch family={cat.id} familyName={catTitle} initialQuery={q} />

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

      {/* Comparateur (uniquement pour les enseignes) */}
      {cat.id === "enseignes-signaletique" && <Comparator />}

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

      {/* CTA devis contextualisé */}
      <div className="mt-12 rounded-3xl bg-[var(--color-bg-secondary)] px-6 py-10 text-center">
        <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
          Un projet {catTitle} sur mesure ?
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Envoyez-nous vos dimensions et votre logo — devis gratuit sous 24h, sans engagement.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <a
            href={getWhatsAppUrl(DEFAULT_WHATSAPP, quoteMessage(catTitle))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="whatsapp" size="lg">💬 Demander un devis WhatsApp</Button>
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
