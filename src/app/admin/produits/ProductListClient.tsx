"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Eye, EyeOff, ExternalLink } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";
import { CATEGORIES, getCategoryLabel, getFamilyLabel, resolveFamily } from "@/lib/categories";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductListClientProps {
  products: ShowcaseProduct[];
}

export function ProductListClient({ products }: ProductListClientProps) {
  const [filter, setFilter] = useState<"all" | "published" | "hidden">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  let filtered = products;
  if (filter === "published") filtered = filtered.filter((p) => p.is_published);
  if (filter === "hidden") filtered = filtered.filter((p) => !p.is_published);
  if (categoryFilter !== "all") filtered = filtered.filter((p) => resolveFamily(p.showcase?.family, p.showcase?.category) === categoryFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
  }

  const togglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !current }),
    });
    window.location.reload();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(["all", "published", "hidden"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  filter === f ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]"
                )}
              >
                {f === "all" ? "Tous" : f === "published" ? "Publiés" : "Masqués"}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-secondary)]"
          >
            <option value="all">Toutes familles</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((product) => {
          const lowestPrice = product.variants?.length ? Math.min(...product.variants.map((v) => v.price)) : null;
          const familyId = resolveFamily(product.showcase?.family, product.showcase?.category);
          return (
            <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
              <div className={cn("w-3 h-3 rounded-full shrink-0", product.is_published ? "bg-[var(--color-success)]" : "bg-[var(--color-text-tertiary)]")} />
              <div className="flex-1 min-w-0">
                <Link href={`/admin/produits/${product.id}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-blue)] truncate block">
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <span>{familyId ? getFamilyLabel(familyId) : "Sans famille"}{product.showcase?.category ? ` · ${getCategoryLabel(product.showcase.category)}` : ""}</span>
                  {product.variants?.length ? <span>· {product.variants.length} variante{product.variants.length > 1 ? "s" : ""}</span> : null}
                  {lowestPrice ? <span>· dès {formatFCFA(lowestPrice)}</span> : null}
                  {product.showcase?.popularity ? <span>· {product.showcase.popularity}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePublish(product.id, product.is_published)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]" title={product.is_published ? "Masquer" : "Publier"}>
                  {product.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <a href={`/collection/${product.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
