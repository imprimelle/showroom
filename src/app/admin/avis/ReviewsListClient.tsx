"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Eye, EyeOff, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { ShowcaseReview } from "@/types";

interface ProductRef {
  slug: string;
  name: string;
}

type StatusFilter = "all" | "visible" | "hidden";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function Stars({ rating, className = "w-4 h-4" }: { rating: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            className,
            n <= rating
              ? "text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)]"
              : "text-[var(--color-border-strong)]"
          )}
        />
      ))}
    </div>
  );
}

interface EditForm {
  author_name: string;
  rating: number;
  title: string;
  content: string;
  country: string;
  order_number: string;
  verified: boolean;
  product_slug: string;
}

export function ReviewsListClient({
  reviews,
  products,
}: {
  reviews: ShowcaseReview[];
  products: ProductRef[];
}) {
  const router = useRouter();

  // Filtres
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  // Édition
  const [editing, setEditing] = useState<ShowcaseReview | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Action en cours (id) pour désactiver les boutons pendant un appel.
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const d = new Date(r.created_at);
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (d < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59.999`);
        if (d > to) return false;
      }
      if (productSlug && r.product_slug !== productSlug) return false;
      if (status === "visible" && r.hidden) return false;
      if (status === "hidden" && !r.hidden) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${r.author_name} ${r.title || ""} ${r.content} ${r.product_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, fromDate, toDate, productSlug, status, query]);

  const applyPreset = (days: number | null) => {
    if (days === null) {
      setFromDate("");
      setToDate("");
      return;
    }
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(to.toISOString().slice(0, 10));
  };

  const openEdit = (r: ShowcaseReview) => {
    setEditing(r);
    setForm({
      author_name: r.author_name,
      rating: r.rating,
      title: r.title || "",
      content: r.content,
      country: r.country || "",
      order_number: r.order_number || "",
      verified: !!r.verified,
      product_slug: r.product_slug,
    });
    setError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setError("");
  };

  const saveEdit = async () => {
    if (!editing || !form) return;
    if (form.author_name.trim().length < 2) return setError("Nom trop court.");
    if (form.content.trim().length < 10) return setError("Contenu trop court (min 10 caractères).");
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: form.author_name.trim(),
          rating: form.rating,
          title: form.title.trim() || null,
          content: form.content.trim(),
          country: form.country.trim() || null,
          order_number: form.order_number.trim() || null,
          verified: form.verified,
          product_slug: form.product_slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'enregistrement.");
        return;
      }
      closeEdit();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const toggleHidden = async (r: ShowcaseReview) => {
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !r.hidden }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const removeReview = async (r: ShowcaseReview) => {
    if (!window.confirm(`Supprimer définitivement l'avis de « ${r.author_name} » ?`)) return;
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const hiddenCount = reviews.filter((r) => r.hidden).length;

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Du</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Au</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Tout", days: null as number | null },
              { label: "Aujourd'hui", days: 0 },
              { label: "7 jours", days: 7 },
              { label: "30 jours", days: 30 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.days)}
                className={cn(
                  "h-10 px-3 rounded-lg text-xs font-medium border transition-colors",
                  (p.days === null && !fromDate && !toDate) ||
                    (p.days !== null && fromDate && toDate)
                    ? "border-[var(--color-accent-blue)] text-[var(--color-accent-blue)] bg-[var(--color-bg-tertiary)]"
                    : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Produit</label>
            <select
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-primary)]"
            >
              <option value="">Tous les produits</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Statut</label>
            <div className="flex h-10 overflow-hidden rounded-lg border border-[var(--color-border-default)]">
              {(
                [
                  ["all", `Tous (${reviews.length})`],
                  ["visible", `Visibles (${reviews.length - hiddenCount})`],
                  ["hidden", `Masqués (${hiddenCount})`],
                ] as [StatusFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    "px-3 text-xs font-medium transition-colors",
                    status === value
                      ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Auteur, contenu, titre…"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">Aucun avis ne correspond aux filtres.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-2xl border bg-[var(--color-surface-card)] p-4",
                r.hidden ? "border-[var(--color-border-strong)] opacity-70" : "border-[var(--color-border-default)]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                    {r.author_name}
                    {r.country ? <span className="font-normal text-[var(--color-text-tertiary)]"> · {r.country}</span> : null}
                  </p>
                  {r.title && <p className="text-xs font-medium text-[var(--color-text-secondary)]">{r.title}</p>}
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                    {r.content}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
                    <span>Produit : <span className="text-[var(--color-text-secondary)]">{r.product_name}</span></span>
                    {r.order_number && <span>N° {r.order_number}</span>}
                    {r.verified && (
                      <span className="text-[var(--color-success)]">Achat vérifié</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      r.hidden
                        ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                        : "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    )}
                  >
                    {r.hidden ? "Masqué" : "Visible"}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    aria-label="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHidden(r)}
                    disabled={busyId === r.id}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
                    aria-label={r.hidden ? "Rendre visible" : "Masquer"}
                  >
                    {r.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeReview(r)}
                    disabled={busyId === r.id}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'édition */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEdit}>
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)]">Modifier l&apos;avis</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="Auteur"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Note</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, rating: n })}
                      aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "w-7 h-7 transition-colors",
                          n <= form.rating
                            ? "text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)]"
                            : "text-[var(--color-border-strong)]"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Titre (optionnel)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Contenu</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Pays"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
                <Input
                  label="N° de commande"
                  value={form.order_number}
                  onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Produit</label>
                <select
                  value={form.product_slug}
                  onChange={(e) => setForm({ ...form, product_slug: e.target.value })}
                  className="w-full h-12 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)]"
                >
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.verified}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                  className="h-4 w-4"
                />
                Achat vérifié
              </label>

              {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={closeEdit} disabled={saving}>
                  Annuler
                </Button>
                <Button variant="primary" className="flex-1" onClick={saveEdit} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
