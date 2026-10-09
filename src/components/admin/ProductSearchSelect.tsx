"use client";
import { useMemo, useState } from "react";
import { Search, Plus, X, Package } from "lucide-react";
import { imgProxyUrl } from "@/lib/images";
import { normalizeForSearch } from "@/lib/utils";

interface ProductSearchSelectProps {
  /** Tous les produits publiés, sélectionnables (tout univers confondu). */
  products: { id: string; name: string; slug: string; main_image_url: string | null }[];
  /** Slugs actuellement sélectionnés. */
  selectedSlugs: string[];
  onChange: (next: string[]) => void;
}

/**
 * Sélecteur de produits par recherche (multi-sélection).
 * Champ de recherche filtrant les produits publiés (insensible aux accents) ;
 * les produits sélectionnés s'affichent en chips amovibles.
 */
export function ProductSearchSelect({ products, selectedSlugs, onChange }: ProductSearchSelectProps) {
  const [query, setQuery] = useState("");

  const selected = products.filter((p) => selectedSlugs.includes(p.slug));

  const results = useMemo(() => {
    const q = normalizeForSearch(query.trim());
    if (!q) return [];
    const available = products.filter((p) => !selectedSlugs.includes(p.slug));
    return available.filter((p) => normalizeForSearch(p.name).includes(q)).slice(0, 8);
  }, [query, products, selectedSlugs]);

  const add = (slug: string) => {
    if (!selectedSlugs.includes(slug)) onChange([...selectedSlugs, slug]);
    setQuery("");
  };
  const remove = (slug: string) => onChange(selectedSlugs.filter((s) => s !== slug));

  return (
    <div className="space-y-2">
      <span className="block text-xs text-[var(--color-text-secondary)]">Produits liés (bouton « Produits »)</span>

      {/* Recherche */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit publié…"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
        />
      </div>

      {/* Résultats (produits non sélectionnés) */}
      {query.trim() !== "" && results.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border-default)] overflow-hidden divide-y divide-[var(--color-border-default)]">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p.slug)}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <span className="w-8 h-8 shrink-0 rounded-md overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                {p.main_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgProxyUrl(p.main_image_url, 60, 80)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                    <Package className="w-3.5 h-3.5" />
                  </span>
                )}
              </span>
              <span className="flex-1 min-w-0 text-sm text-[var(--color-text-primary)] truncate">{p.name}</span>
              <Plus className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
            </button>
          ))}
        </div>
      )}
      {query.trim() !== "" && results.length === 0 && (
        <p className="text-xs text-[var(--color-text-tertiary)]">Aucun produit trouvé.</p>
      )}

      {/* Produits sélectionnés (chips amovibles) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.slug}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] pl-2.5 pr-1 py-1 text-xs font-medium"
            >
              {p.name}
              <button
                type="button"
                onClick={() => remove(p.slug)}
                aria-label={`Retirer ${p.name}`}
                className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-accent-blue)]/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
