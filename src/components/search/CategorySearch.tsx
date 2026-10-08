"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchSuggest } from "./SearchSuggest";

interface CategorySearchProps {
  family: string;
  familyName: string;
  initialQuery?: string;
}

/**
 * Barre de recherche visible sur les pages catégorie (`/collection/categorie/[family]`).
 * Au focus → dropdown de suggestions (produits avec images + catégories).
 * À la soumission → filtre la page via `?q=`.
 */
export function CategorySearch({ family, familyName, initialQuery }: CategorySearchProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery || "");
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const s = params.toString();
    router.push(`/collection/categorie/${family}${s ? `?${s}` : ""}`);
    setFocused(false);
  };

  return (
    <div ref={wrapRef} className="relative mb-6">
      <form onSubmit={submit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={`Rechercher dans ${familyName}…`}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] shadow-sm focus:outline-none focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.12)]"
          />
        </div>
      </form>

      {focused && (
        <div className="absolute z-30 left-0 right-0 top-full mt-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-xl max-h-[70vh] overflow-y-auto">
          <SearchSuggest
            query={q}
            family={family}
            variant="page"
            onNavigate={() => setFocused(false)}
          />
        </div>
      )}
    </div>
  );
}
