"use client";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/stores/currency";

interface Variant {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  dimensions?: string;
}

interface VariantGroupageCard {
  selected: boolean;
  onSelect: () => void;
  dimensions?: string;
  price: number;
  originalPrice: number;
  reductionPercent: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedSku: string | null;
  onSelect: (variant: Variant) => void;
  /** Carte groupage compacte affichée en 1re position du slider (optionnelle). */
  groupage?: VariantGroupageCard | null;
}

export function VariantSelector({ variants, selectedSku, onSelect, groupage }: VariantSelectorProps) {
  const formatPrice = useFormatPrice();
  if (!variants.length) {
    return <p className="text-sm text-[var(--color-text-tertiary)]">Sur devis uniquement</p>;
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pt-2 pb-1">
      {groupage && (
        <button
          key="groupage"
          type="button"
          onClick={groupage.onSelect}
          aria-pressed={groupage.selected}
          className={cn(
            "relative shrink-0 min-w-[128px] rounded-2xl border-2 px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-[var(--color-accent-blue)] focus-visible:outline-offset-2",
            groupage.selected
              ? "border-[var(--color-accent-amber)] bg-[var(--color-accent-amber-soft)] shadow-sm"
              : "border-[var(--color-accent-amber)]/35 bg-[var(--color-surface-card)] hover:border-[var(--color-accent-amber)]"
          )}
        >
          {groupage.selected && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-amber)] text-white shadow-sm">
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-amber)]">
            <Users className="h-3 w-3" /> Groupage
          </span>
          {groupage.dimensions && (
            <span className="mt-1 block text-[11px] leading-tight text-[var(--color-text-secondary)]">
              {groupage.dimensions}
            </span>
          )}
          <span className="mt-1 block text-[11px] leading-tight text-[var(--color-text-tertiary)]">
            <s>{formatPrice(groupage.originalPrice)}</s>
          </span>
          <span className="mt-0.5 block font-mono text-sm font-bold leading-none text-[var(--color-text-primary)]">
            {formatPrice(groupage.price)}
          </span>
          {groupage.reductionPercent > 0 && (
            <span className="mt-1.5 inline-block rounded-full bg-[var(--color-success-soft)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--color-success)]">
              −{groupage.reductionPercent}%
            </span>
          )}
        </button>
      )}

      {variants.map((variant) => {
        const isSelected = selectedSku === variant.sku;
        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant)}
            aria-pressed={isSelected}
            className={cn(
              "relative shrink-0 min-w-[112px] rounded-2xl border px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-[var(--color-accent-blue)] focus-visible:outline-offset-2",
              isSelected
                ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-md"
                : "border-[var(--color-border-strong)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]"
            )}
          >
            {isSelected && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-amber)] text-[var(--color-text-primary)] shadow-sm">
                <Check className="h-3 w-3" strokeWidth={3.5} />
              </span>
            )}
            <span className="block text-sm font-semibold leading-tight">{variant.name}</span>
            {variant.dimensions && (
              <span
                className={cn(
                  "mt-0.5 block text-[11px] leading-tight",
                  isSelected ? "opacity-75" : "text-[var(--color-text-tertiary)]"
                )}
              >
                {variant.dimensions}
              </span>
            )}
            <span
              className={cn(
                "mt-1.5 block font-mono text-xs leading-none",
                isSelected ? "text-[var(--color-accent-amber)]" : "text-[var(--color-text-primary)]"
              )}
            >
              {variant.price != null ? formatPrice(variant.price) : "Sur devis"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
