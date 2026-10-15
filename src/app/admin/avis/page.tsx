import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewsListClient } from "./ReviewsListClient";
import type { ShowcaseReview } from "@/types";

export const dynamic = "force-dynamic";

interface ProductRef {
  slug: string;
  name: string;
}

export default async function AdminAvisPage() {
  const admin = createAdminClient();

  // Tous les avis (masqués inclus) — l'admin doit tout voir.
  const { data: reviews } = await admin
    .from("showcase_reviews")
    .select("*")
    .order("created_at", { ascending: false });

  // Produits publiés (slug + nom) pour le filtre et le changement de produit.
  const { data: products } = await admin
    .from("products")
    .select("slug, name")
    .eq("is_published", true)
    .order("name", { ascending: true });

  const reviewList = (reviews || []) as ShowcaseReview[];
  const productList = (products || []) as ProductRef[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Avis clients</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {reviewList.length} avis · {productList.length} produits
        </p>
      </div>
      <ReviewsListClient reviews={reviewList} products={productList} />
    </div>
  );
}
