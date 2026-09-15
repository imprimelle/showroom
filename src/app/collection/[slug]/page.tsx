import { notFound } from "next/navigation";
import { getProductBySlug, getPublishedProducts } from "@/lib/products";
import { resolveFamily } from "@/lib/categories";
import { getShowcaseSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/utils";
import { ProductPageClient } from "./ProductPageClient";
import { ProductPageSkeleton } from "@/components/ui/Skeleton";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { ShowcaseProduct } from "@/lib/products";

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

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageClient product={product} relatedProducts={relatedProducts} whatsapp={whatsapp} />
    </Suspense>
  );
}
