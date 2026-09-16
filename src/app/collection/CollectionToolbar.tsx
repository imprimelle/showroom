"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, getCategory, getFamilyOfSubCategory } from "@/lib/categories";
import { USAGES } from "@/lib/usages";
import { cn } from "@/lib/utils";
import { SortSelect } from "./SortSelect";

interface CollectionToolbarProps {
  currentFamily?: string;
  currentCategory?: string;
  currentUsage?: string;
  currentQuery?: string;
  currentSort?: string;
}

export function CollectionToolbar({ currentFamily, currentCategory, currentUsage, currentQuery, currentSort }: CollectionToolbarProps) {
  const router = useRouter();
  const [q, setQ] = useState(currentQuery || "");

  const activeFamily = getCategory(currentFamily) || getFamilyOfSubCategory(currentCategory);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (currentFamily) params.set("family", currentFamily);
    if (currentCategory) params.set("category", currentCategory);
    if (currentUsage) params.set("usage", currentUsage);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/collection${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Préserve famille + catégorie quand on bascule l'emplacement
  const usageHref = (usageId: string | null) => {
    const params = new URLSearchParams();
    if (currentFamily) params.set("family", currentFamily);
    if (currentCategory) params.set("category", currentCategory);
    if (usageId) params.set("usage", usageId);
    const s = params.toString();
    return `/collection${s ? `?${s}` : ""}`;
  };

  const chipClass = (active: boolean) =>
    cn(
      "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
      active
        ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]"
    );

  return (
    <div className="space-y-3 mb-6">
      {/* Familles (niveau 1) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        <Link href="/collection" className={chipClass(!activeFamily)}>
          Toutes
        </Link>
        {CATEGORIES.map((fam) => (
          <Link key={fam.id} href={`/collection?family=${fam.id}`} className={chipClass(activeFamily?.id === fam.id)}>
            {fam.icon} {fam.name}
          </Link>
        ))}
      </div>

      {/* Sous-catégories (niveau 2) */}
      {activeFamily && activeFamily.children.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {activeFamily.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/collection?family=${activeFamily.id}&category=${sub.id}`}
              className={chipClass(currentCategory === sub.id)}
            >
              {sub.icon} {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Emplacement (usage intérieur/extérieur) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 items-center">
        <span className="text-xs font-medium text-[var(--color-text-tertiary)] shrink-0">Emplacement :</span>
        <Link href={usageHref(null)} className={chipClass(!currentUsage)}>
          Tous
        </Link>
        {USAGES.map((u) => (
          <Link key={u.id} href={usageHref(u.id)} className={chipClass(currentUsage === u.id)}>
            {u.label}
          </Link>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 items-center">
        <form onSubmit={submitSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
        </form>
        <SortSelect current={currentSort || "popularity"} />
      </div>
    </div>
  );
}
