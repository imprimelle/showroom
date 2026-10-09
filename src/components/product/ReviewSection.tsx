"use client";
import { useMemo, useState } from "react";
import { Star, CheckCircle2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { ShowcaseReview, ReviewAggregate } from "@/types";

/** Étoiles avec remplissage partiel (0–5). */
function Stars({ rating, className, size = "w-4 h-4" }: { rating: number; className?: string; size?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Note ${rating} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <span key={i} className={cn("relative inline-block", size)}>
            <Star className={cn("absolute inset-0 text-[var(--color-border-strong)]", size)} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)]", size)} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

/** Carte d'avis : nom du produit + note + auteur + badge « Achat vérifié » + texte. */
function ReviewCard({ review }: { review: ShowcaseReview }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent-amber)] truncate">
            {review.product_name}
          </p>
          <Stars rating={review.rating} className="mt-1" />
          {review.title && (
            <h4 className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{review.title}</h4>
          )}
        </div>
        {review.verified && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] px-2.5 py-1 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Achat vérifié
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{review.content}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
        <span className="font-medium text-[var(--color-text-secondary)]">{review.author_name}</span>
        <span>·</span>
        <span>{formatDate(review.created_at)}</span>
        {review.order_number && <span>· Commande {review.order_number}</span>}
      </div>
    </article>
  );
}

/** Formulaire « Laisser un avis ». */
function ReviewForm({
  productSlug,
  onSuccess,
  onCancel,
}: {
  productSlug: string;
  onSuccess: (review: ShowcaseReview) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (name.trim().length < 2) return setError("Veuillez indiquer votre nom.");
    if (content.trim().length < 10) return setError("Votre avis doit contenir au moins 10 caractères.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: productSlug,
          author_name: name.trim(),
          rating,
          title: title.trim() || null,
          content: content.trim(),
          order_number: orderNumber.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }
      onSuccess(data.review as ShowcaseReview);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Laisser un avis</h3>
        <button type="button" onClick={onCancel} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
          Annuler
        </button>
      </div>

      {/* Note (étoiles cliquables) */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[var(--color-text-secondary)]">Votre note :</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  n <= rating ? "text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)]" : "text-[var(--color-border-strong)]"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Input label="Votre nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Awa Koné" />
        <Input label="Titre (optionnel)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Résumez votre expérience" />
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Votre avis</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Partagez votre expérience avec ce produit…"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)] resize-none"
          />
        </div>
        <Input
          label="N° de commande (optionnel — pour avis vérifié)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Ex : CMD-1A2B3C"
        />
      </div>

      {error && <p className="mt-3 text-xs text-[var(--color-error)]">{error}</p>}

      <Button variant="primary" size="lg" className="w-full mt-4" onClick={submit} disabled={submitting}>
        {submitting ? "Envoi…" : "Publier mon avis"}
      </Button>
    </div>
  );
}

/**
 * Composant d'avis clients (style Trustpilot) en bas de fiche produit :
 * note globale, répartition des notes, fil d'avis et formulaire de dépôt.
 */
export function ReviewSection({
  productSlug,
  productName,
  reviews: initialReviews,
}: {
  productSlug: string;
  productName: string;
  reviews: ShowcaseReview[];
}) {
  const [reviews, setReviews] = useState<ShowcaseReview[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

  const aggregate = useMemo<ReviewAggregate>(() => {
    const count = reviews.length;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }));
    const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    return { average, count, distribution };
  }, [reviews]);

  const handleSuccess = (review: ShowcaseReview) => {
    setReviews((prev) => [review, ...prev]);
    setShowForm(false);
    setJustPosted(true);
    setTimeout(() => setJustPosted(false), 4000);
  };

  const maxCount = Math.max(1, ...aggregate.distribution.map((d) => d.count));

  return (
    <section id="avis" className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          Avis clients
        </h2>

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Colonne gauche : note globale + répartition */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 text-center">
              <p className="text-5xl font-bold font-display text-[var(--color-text-primary)]">
                {aggregate.count > 0 ? aggregate.average.toFixed(1).replace(".", ",") : "—"}
              </p>
              <div className="flex justify-center mt-2">
                <Stars rating={aggregate.average} size="w-5 h-5" />
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Note globale · {aggregate.count} avis
              </p>
            </div>

            {/* Répartition des notes */}
            {aggregate.count > 0 && (
              <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 space-y-2">
                {aggregate.distribution.map((d) => (
                  <div key={d.rating} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-medium text-[var(--color-text-secondary)] text-right">{d.rating}</span>
                    <Star className="w-3.5 h-3.5 text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)] shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent-amber)]"
                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs text-[var(--color-text-tertiary)]">{d.count}</span>
                  </div>
                ))}
              </div>
            )}

            {!showForm && (
              <Button variant="whatsapp" size="lg" className="w-full" onClick={() => setShowForm(true)}>
                <PenLine className="w-4 h-4 mr-2" />
                Laisser un avis
              </Button>
            )}

            {justPosted && (
              <p className="text-sm text-[var(--color-success)] text-center">✓ Merci, votre avis a été publié !</p>
            )}
          </div>

          {/* Colonne droite : fil d'avis */}
          <div className="space-y-4">
            {showForm && (
              <ReviewForm
                productSlug={productSlug}
                onSuccess={handleSuccess}
                onCancel={() => setShowForm(false)}
              />
            )}

            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-default)] p-8 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Aucun avis pour « {productName} » pour le moment.
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Soyez le premier à partager votre expérience !</p>
              </div>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
