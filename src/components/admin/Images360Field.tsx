"use client";
import { useRef, useState } from "react";
import { Upload, X, ChevronLeft, ChevronRight, Rotate3d, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Images360FieldProps {
  /** URLs des frames de la vue 360° (ordre = sens de rotation). */
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  hint?: string;
}

/**
 * Champ dédié aux frames de la vue 360° : upload multiple (32+ images),
 * grille de vignettes numérotées, réordonnancement (◀ ▶) et suppression.
 * L'ordre du tableau = sens de rotation dans le rendu 360.
 */
export function Images360Field({ value, onChange, label, hint }: Images360FieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    setError("");
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erreur lors de l'upload");
          break;
        }
        urls.push(data.url);
      }
      if (urls.length) onChange([...value, ...urls]);
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2.5">
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

      {value.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Supprimer les ${value.length} frames 360° de ce produit ?`)) {
                onChange([]);
              }
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-[var(--color-error)] bg-[var(--color-error-soft)] hover:bg-[var(--color-error)] hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Tout supprimer ({value.length})
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div
            key={i}
            className="group relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-tertiary)]"
          >
            <img src={url} alt={`Frame ${i + 1}`} className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {i + 1}
            </span>

            {/* Contrôles (survol) */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-gradient-to-t from-black/70 to-transparent pt-4 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Déplacer avant"
                className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Supprimer la frame"
                className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-[var(--color-error)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Déplacer après"
                className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Tuile d'upload multiple */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[3/4] w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent-blue)] hover:text-[var(--color-accent-blue)] disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <span className="text-[10px] font-medium">Envoi…</span>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-tight">Ajouter<br />32+</span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length) uploadFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
        <Rotate3d className="h-3.5 w-3.5" />
        {value.length} frame{value.length > 1 ? "s" : ""} — l&apos;ordre définit le sens de rotation.
      </p>

      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
