"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { SortSelect } from "./SortSelect";

interface CollectionToolbarProps {
  currentCategory?: string;
  currentQuery?: string;
  currentSort?: string;
}

export function CollectionToolbar({ currentCategory, currentQuery, currentSort }: CollectionToolbarProps) {
  const router = useRouter();
  const [q, setQ] = useState(currentQuery || "");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/collection${params.toString() ? `?${params.toString()}` : ""}`);
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
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        <Link href="/collection" className={chipClass(!currentCategory)}>
          Toutes
        </Link>
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} href={`/collection?category=${cat.id}`} className={chipClass(currentCategory === cat.id)}>
            {cat.icon} {cat.name}
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
            placeholder="Rechercher une enseigne..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
        </form>
        <SortSelect current={currentSort || "popularity"} />
      </div>
    </div>
  );
}
