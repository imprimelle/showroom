import { createServerClient } from "./supabase/server";
import type { ShowcaseReview, ReviewAggregate } from "@/types";

/**
 * Charge les avis d'un produit (table showcase_reviews) + leur agrégat
 * (note moyenne + répartition 5→1). À utiliser dans un Server Component.
 */
export async function getProductReviews(
  slug: string
): Promise<{ reviews: ShowcaseReview[]; aggregate: ReviewAggregate }> {
  const empty = { reviews: [] as ShowcaseReview[], aggregate: { average: 0, count: 0, distribution: [] as { rating: number; count: number }[] } };

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("showcase_reviews")
      .select("*")
      .eq("product_slug", slug)
      .order("created_at", { ascending: false });

    if (error || !Array.isArray(data)) return empty;

    const reviews = data as ShowcaseReview[];
    const count = reviews.length;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }));
    const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    return { reviews, aggregate: { average, count, distribution } };
  } catch {
    return empty;
  }
}

/**
 * JSON-LD Schema.org « Product + AggregateRating + Review » pour les rich snippets.
 */
export function buildReviewJsonLd(opts: {
  name: string;
  description?: string;
  image?: string | null;
  aggregate: ReviewAggregate;
  reviews: ShowcaseReview[];
}): string {
  const { name, description, image, aggregate, reviews } = opts;

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
  };
  if (description) payload.description = description;
  if (image) payload.image = image;

  if (aggregate.count > 0) {
    payload.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(aggregate.average),
      reviewCount: String(aggregate.count),
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (reviews.length > 0) {
    payload.review = reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author_name },
      datePublished: r.created_at,
      reviewBody: r.content,
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
        bestRating: "5",
      },
    }));
  }

  return JSON.stringify(payload);
}
