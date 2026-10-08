"use client";
import { cn } from "@/lib/utils";
import { imgProxyUrl } from "@/lib/images";

interface StickyProductBarProps {
  name: string;
  /** Prix formaté (ou « Sur devis »). */
  priceLabel: string;
  /** Image du produit (recadrée en 4:3). */
  image: string | null;
  visible: boolean;
}

/**
 * Barre fine fixée en haut de page, affichée quand l'image principale
 * sort du viewport. Remplace visuellement la TopNav (masquée via
 * `body[data-sticky-product]` dans globals.css).
 */
export function StickyProductBar({ name, priceLabel, image, visible }: StickyProductBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          {/* Image 4:3 du produit */}
          {image ? (
            <img
              src={imgProxyUrl(image, 160, 120)}
              alt={name}
              className="h-11 aspect-[4/3] shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="h-11 aspect-[4/3] shrink-0 rounded-md bg-[var(--color-bg-tertiary)]" />
          )}

          {/* Nom à gauche */}
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {name}
          </span>

          {/* Prix à droite */}
          <span className="shrink-0 font-mono text-sm font-bold text-[var(--color-text-primary)]">
            {priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
