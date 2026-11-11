"use client";
import { useState } from "react";
import { Trash2, MousePointerClick } from "lucide-react";
import { imgProxyUrl } from "@/lib/images";
import { ProductSearchSelect } from "@/components/admin/ProductSearchSelect";
import type { HeroHotspot } from "@/types";

interface HotspotEditorProps {
  /** URL de l'image du slide (support du positionnement des points). */
  imageUrl: string | null;
  hotspots: HeroHotspot[];
  products: { id: string; name: string; slug: string; main_image_url: string | null }[];
  onChange: (next: HeroHotspot[]) => void;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Éditeur de points cliquables (« collection ») : cliquer sur l'aperçu pose un point
 * (coordonnées en %), chaque point est ensuite lié à un produit via ProductSearchSelect.
 */
export function HotspotEditor({ imageUrl, hotspots, products, onChange }: HotspotEditorProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (!imageUrl) {
    return (
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Ajoutez d&apos;abord une image au slide pour poser des points « collection ».
      </p>
    );
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = round1(((e.clientX - rect.left) / rect.width) * 100);
    const y = round1(((e.clientY - rect.top) / rect.height) * 100);
    onChange([...hotspots, { x, y, product_slug: "" }]);
  };

  const updateHotspot = (i: number, patch: Partial<HeroHotspot>) => {
    onChange(hotspots.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  };

  const removeHotspot = (i: number) => {
    onChange(hotspots.filter((_, idx) => idx !== i));
    setSelected((s) => (s === i ? null : s === null ? null : s > i ? s - 1 : s));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          Points « collection » (cliquez sur l&apos;image pour en poser un)
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
          <MousePointerClick className="w-3 h-3" /> {hotspots.length} point{hotspots.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Aperçu cliquable */}
      <div
        className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg border border-[var(--color-border-default)] cursor-crosshair select-none bg-[var(--color-bg-tertiary)]"
        onClick={handleImageClick}
        role="button"
        aria-label="Ajouter un point sur l'image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgProxyUrl(imageUrl, 600, 800)} alt="" className="w-full h-full object-cover pointer-events-none" />
        {hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(selected === i ? null : i);
            }}
            className={`absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-colors ${
              selected === i
                ? "bg-[var(--color-accent-blue)] border-white text-white"
                : "bg-white border-[var(--color-accent-blue)] text-[var(--color-accent-blue)]"
            }`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            aria-label={`Point ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Liste des points */}
      {hotspots.length > 0 && (
        <div className="space-y-2">
          {hotspots.map((h, i) => (
            <div
              key={i}
              className={`rounded-lg border p-2 space-y-2 ${
                selected === i ? "border-[var(--color-accent-blue)]" : "border-[var(--color-border-default)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Point {i + 1} — x {h.x}% · y {h.y}%
                </span>
                <button
                  type="button"
                  onClick={() => removeHotspot(i)}
                  aria-label={`Supprimer le point ${i + 1}`}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <ProductSearchSelect
                products={products}
                selectedSlugs={h.product_slug ? [h.product_slug] : []}
                onChange={(slugs) => updateHotspot(i, { product_slug: slugs[0] || "" })}
                label="Produit du point"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
