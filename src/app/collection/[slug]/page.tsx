import { notFound } from "next/navigation";
import { getProductBySlug, getPublishedProducts } from "@/lib/products";
import { resolveFamily } from "@/lib/categories";
import { getShowcaseSettings } from "@/lib/settings";
import { normalizePhone, getMinPrice } from "@/lib/utils";
import { resolveFaqPills } from "@/lib/faq";
import { resolveActiveParameters } from "@/lib/parameters";
import { ProductPageClient } from "./ProductPageClient";
import { ProductPageSkeleton } from "@/components/ui/Skeleton";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { ShowcaseProduct } from "@/lib/products";
import type { IdeaDecoSlide } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };

  return {
    title: product.showcase?.seo?.title || product.name,
    description: product.showcase?.seo?.description || product.showcase?.short_description || `Découvrez ${product.name} — fabrication sur mesure par Imprimelle CI.`,
    openGraph: {
      title: product.showcase?.seo?.title || product.name,
      description: product.showcase?.seo?.description || "",
      images: product.main_image_url ? [{ url: product.main_image_url }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Related products: same family first, then fallback to any published
  const [all, settings] = await Promise.all([
    getPublishedProducts().catch(() => [] as ShowcaseProduct[]),
    getShowcaseSettings(),
  ]);

  const familyId = resolveFamily(product.showcase?.family, product.showcase?.category);
  const sameFamily = all.filter(
    (p) => p.id !== product.id && resolveFamily(p.showcase?.family, p.showcase?.category) === familyId
  );
  const fallback = all.filter(
    (p) => p.id !== product.id && resolveFamily(p.showcase?.family, p.showcase?.category) !== familyId
  );
  const relatedProducts = [...sameFamily, ...fallback].slice(0, 4);

  const whatsapp = normalizePhone(settings.contact?.whatsapp);
  const parameters = resolveActiveParameters(product.showcase, settings.product_parameters);
  const faqPills = resolveFaqPills(settings.faq_pills);

  // Résolution des vidéos « Idées décos » de l'univers : slugs de produits → refs produit.
  const slugMap = new Map(all.map((p) => [p.slug, p]));
  const ideaDecoVideos: IdeaDecoSlide[] = (settings.idea_deco?.[familyId || ""] || []).map((v) => ({
    url: v.url,
    poster: v.poster || null,
    products: (v.product_slugs || [])
      .map((slug) => {
        const p = slugMap.get(slug);
        if (!p) return null;
        return {
          slug: p.slug,
          name: p.name,
          image_url: p.main_image_url,
          price: getMinPrice(p.variants),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x)),
  }));

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageClient
        product={product}
        relatedProducts={relatedProducts}
        whatsapp={whatsapp}
        parameters={parameters}
        faqPills={faqPills}
        ideaDecoVideos={ideaDecoVideos}
      />
    </Suspense>
  );
}
