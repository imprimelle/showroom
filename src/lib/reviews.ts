import { createServerClient } from "./supabase/server";
import type { ShowcaseReview, ReviewAggregate } from "@/types";

/**
 * Calcule l'agrégat d'avis (note moyenne + répartition 5→1) à partir d'une liste.
 * Utilisé pour la note produit (avis propres au slug) comme pour la note globale du mur d'avis.
 */
export function computeAggregate(reviews: ShowcaseReview[]): ReviewAggregate {
  const count = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));
  const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  return { average, count, distribution };
}

/**
 * Charge TOUS les avis du site (table showcase_reviews), tous produits confondus,
 * du plus récent au plus ancien. Le mur d'avis en bas de fiche produit est global
 * (chaque carte indiquant le produit concerné). À utiliser dans un Server Component.
 */
export async function getAllReviews(limit = 200): Promise<ShowcaseReview[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("showcase_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) return [];
    return data as ShowcaseReview[];
  } catch {
    return [];
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
