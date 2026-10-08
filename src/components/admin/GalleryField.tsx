"use client";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { MediaField } from "@/components/admin/MediaField";
import type { CropSpec } from "@/lib/media-specs";
import { cn, isVideoUrl } from "@/lib/utils";

/**
 * Champ galerie admin : liste d'URLs d'images (upload + URL libre + aperçu),
 * avec ajout / suppression / réordonnancement par glisser-déposer.
 * `value` est un tableau de strings (URLs) — aligné sur products.gallery_images (text[]).
 * L'ordre du tableau est l'ordre d'affichage de la galerie (persisté tel quel).
 */
export function GalleryField({
  value,
  onChange,
  label,
  hint,
  cropSpec,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  hint?: string;
  /** Spec de recadrage appliquée aux images uploadées (transmise à MediaField). */
  cropSpec?: CropSpec | null;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const update = (i: number, url: string | null) => {
    const next = [...value];
    if (url) next[i] = url;
    else next.splice(i, 1);
    onChange(next);
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {(label || hint) && (
        <div>
          {label && (
            <span className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
          )}
          {hint && (
            <span className="block text-[11px] leading-snug text-[var(--color-text-tertiary)] mt-0.5">{hint}</span>
          )}
        </div>
      )}
      {value.map((url, i) => (
        <div
          key={i}
          draggable
          onDragStart={(e) => {
            setDragIndex(i);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(i));
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overIndex !== i) setOverIndex(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null && dragIndex !== i) reorder(dragIndex, i);
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={cn(
            "relative flex items-start gap-2 rounded-lg p-2 transition-all duration-150",
            dragIndex === i
              ? "border border-dashed border-[var(--color-accent-blue)] opacity-50"
              : "border border-transparent"
          )}
        >
          {overIndex === i && dragIndex !== null && dragIndex !== i && (
            <span className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[var(--color-accent-blue)]" />
          )}
          <span
            title="Glisser pour réordonner"
            className="mt-2 shrink-0 cursor-grab active:cursor-grabbing text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-[var(--color-text-tertiary)] mt-2 w-4 shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <MediaField
              value={{ type: isVideoUrl(url) ? "video" : "image", url }}
              onChange={(m) => update(i, m?.url || null)}
              cropSpec={cropSpec}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors"
      >
        + Ajouter une photo
      </button>
    </div>
  );
}
