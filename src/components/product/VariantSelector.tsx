"use client";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/lib/utils";

interface Variant {
  id: string;
  sku: string;
  name: string;
  price: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedSku: string | null;
  onSelect: (variant: Variant) => void;
}

export function VariantSelector({ variants, selectedSku, onSelect }: VariantSelectorProps) {
  if (!variants.length) {
    return <p className="text-sm text-[var(--color-text-tertiary)]">Sur devis uniquement</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Taille</h3>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedSku === variant.sku;
          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-150",
                "focus-visible:outline-2 focus-visible:outline-[var(--color-accent-blue)] focus-visible:outline-offset-2",
                isSelected
                  ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border-strong)]"
              )}
            >
              <span>{variant.name}</span>
              <span className={cn("ml-1.5 font-mono text-xs opacity-70", isSelected && "opacity-100")}>
                {formatFCFA(variant.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
