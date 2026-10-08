"use client";
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
    <div>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
        Choisissez vos dimensions
      </h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {variants.map((variant) => {
          const isSelected = selectedSku === variant.sku;
          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className={cn(
                "shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 flex flex-col items-center",
                "focus-visible:outline-2 focus-visible:outline-[var(--color-accent-blue)] focus-visible:outline-offset-2",
                isSelected
                  ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border-strong)]"
              )}
            >
              <span className="flex items-baseline">
                <span>{variant.name}</span>
                <span className={cn("ml-1.5 font-mono text-xs opacity-70", isSelected && "opacity-100")}>
                  {variant.price != null ? formatPrice(variant.price) : "Sur devis"}
                </span>
              </span>
              {variant.dimensions && (
                <span className="text-[11px] font-normal opacity-75 leading-tight mt-0.5">
                  {variant.dimensions}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
