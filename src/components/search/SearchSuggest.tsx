"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { CATEGORIES, type Category, type SubCategory } from "@/lib/categories";
import { normalizeForSearch } from "@/lib/utils";
import { useFormatPrice } from "@/stores/currency";
import { imgProxyUrl } from "@/lib/images";

interface SuggestionItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  category: string;
  family?: string;
  price: number | null;
}

interface SearchSuggestProps {
  query: string;
  /** Univers restreint (page catégorie) — null = catalogue complet. */
  family?: string;
  /** Appelé quand l'utilisateur choisit une suggestion (pour fermer drawer/dropdown). */
  onNavigate?: () => void;
  variant?: "drawer" | "page";
}

/**
 * Liste de suggestions de recherche (produits avec vignettes + catégories).
 * Ne rend PAS le champ input (géré par le parent) — uniquement les résultats.
 *
 * Structure simplifiée :
 * - Sans requête → uniquement les produits populaires + lien « Voir tout le catalogue ».
 * - Avec requête → catégories correspondantes + produits correspondants + « Voir tous les résultats ».
 * Tous les éléments sont des <Link> (liens natifs, robustes au clic).
 */
export function SearchSuggest({ query, family, onNavigate, variant = "page" }: SearchSuggestProps) {
  const formatPrice = useFormatPrice();
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Débounce + annulation de la requête précédente
  useEffect(() => {
    const controller = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = controller;

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (family) params.set("family", family);
        const res = await fetch(`/api/search/suggest?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const t = setTimeout(load, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, family]);

  const q = normalizeForSearch(query.trim());
  const hasQuery = q.length > 0;

  // Catégories suggérées — calculées uniquement quand une requête est saisie.
  const { matchedFamilies, matchedSubs } = useMemo(() => {
    if (!hasQuery) return { matchedFamilies: [] as Category[], matchedSubs: [] as { family: Category; sub: SubCategory }[] };
    const matchedFamilies: Category[] = CATEGORIES.filter((f) =>
      normalizeForSearch(f.name).includes(q)
    );
    const matchedSubs: { family: Category; sub: SubCategory }[] = CATEGORIES.flatMap((f) =>
      f.children
        .filter((s) => normalizeForSearch(s.name).includes(q))
        .map((s) => ({ family: f, sub: s }))
    );
    return { matchedFamilies, matchedSubs };
  }, [q, hasQuery]);

  const seeAllHref = family
    ? `/collection/categorie/${family}${hasQuery ? `?q=${encodeURIComponent(query.trim())}` : ""}`
    : hasQuery
      ? `/collection?q=${encodeURIComponent(query.trim())}`
      : "/collection";

  const itemRow =
    "flex w-full items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-bg-tertiary)] text-left transition-colors";

  const noCategoryMatch = matchedFamilies.length === 0 && matchedSubs.length === 0;

  return (
    <div className={variant === "drawer" ? "pb-3" : "p-1"}>
      {/* Libellé de section */}
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {hasQuery ? (
          <>Suggestions pour «&nbsp;{query.trim()}&nbsp;»</>
        ) : (
          <>
            <TrendingUp className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Populaires
          </>
        )}
      </p>

      {/* Catégories / univers correspondants (uniquement avec une requête) */}
      {hasQuery && !noCategoryMatch && (
        <div className="mb-1">
          {matchedFamilies.map((f) => (
            <Link key={f.id} href={`/collection/categorie/${f.id}`} onClick={onNavigate} className={itemRow}>
              <span className="text-base shrink-0">{f.icon}</span>
              <span className="flex-1 min-w-0 text-sm font-medium text-[var(--color-text-primary)] truncate">
                {f.name}
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-accent-amber)] shrink-0">
                Univers
              </span>
            </Link>
          ))}
          {matchedSubs.map(({ family: f, sub }) => (
            <Link
              key={sub.id}
              href={`/collection?family=${f.id}&category=${sub.id}`}
              onClick={onNavigate}
              className={itemRow}
            >
              <span className="text-base shrink-0">{sub.icon}</span>
              <span className="flex-1 min-w-0 text-sm font-medium text-[var(--color-text-primary)] truncate">
                {sub.name}
              </span>
              <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0">{f.name}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Produits avec vignettes */}
      {loading && items.length === 0 ? (
        <div className="px-3 py-6 text-sm text-[var(--color-text-tertiary)] text-center">
          Recherche…
        </div>
      ) : items.length > 0 ? (
        <ul className="space-y-0.5">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/collection/${it.slug}`} onClick={onNavigate} className={itemRow}>
                <span className="w-11 h-14 shrink-0 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgProxyUrl(it.image, 120, 160)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-lg">📦</span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {it.name}
                  </span>
                  <span className="block text-xs text-[var(--color-text-tertiary)] truncate">
                    {it.category}
                  </span>
                  <span className="block text-xs font-semibold text-[var(--color-text-primary)]">
                    {it.price != null ? `À partir de ${formatPrice(it.price)}` : "Sur devis"}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      ) : !hasQuery ? (
        <div className="px-3 py-6 text-sm text-[var(--color-text-tertiary)] text-center">
          Aucun produit disponible
        </div>
      ) : noCategoryMatch ? (
        <div className="px-3 py-6 text-sm text-[var(--color-text-tertiary)] text-center">
          Aucun résultat trouvé
        </div>
      ) : null}

      {/* Voir tous les résultats */}
      <Link
        href={seeAllHref}
        onClick={onNavigate}
        className="mt-1 flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-[var(--color-accent-blue)] hover:underline"
      >
        {hasQuery ? "Voir tous les résultats" : "Voir tout le catalogue"}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
