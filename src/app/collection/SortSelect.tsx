"use client";

interface SortSelectProps {
  current: string;
}

export function SortSelect({ current }: SortSelectProps) {
  return (
    <select
      defaultValue={current}
      className="px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-secondary)]"
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value === "popularity") url.searchParams.delete("sort");
        else url.searchParams.set("sort", e.target.value);
        window.location.href = url.toString();
      }}
    >
      <option value="popularity">Popularité</option>
      <option value="price-asc">Prix croissant</option>
      <option value="price-desc">Prix décroissant</option>
    </select>
  );
}
