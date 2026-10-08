"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/stores/currency";

interface Variant {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  dimensions?: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedSku: string | null;
  onSelect: (variant: Variant) => void;
}

export function VariantSelector({ variants, selectedSku, onSelect }: VariantSelectorProps) {
  const formatPrice = useFormatPrice();
  if (!variants.length) {
    return <p className="text-sm text-[var(--color-text-tertiary)]">Sur devis uniquement</p>;
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
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
