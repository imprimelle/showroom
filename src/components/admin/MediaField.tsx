"use client";
import { useRef, useState } from "react";
import { Upload, Trash2, ImageIcon, Film, Crop } from "lucide-react";
import type { MediaItem } from "@/types";
import { isVideoUrl } from "@/lib/utils";
import type { CropSpec } from "@/lib/media-specs";
import { ImageCropper } from "@/components/admin/ImageCropper";

interface MediaFieldProps {
  value?: MediaItem | null;
  onChange: (media: MediaItem | null) => void;
  label?: string;
  hint?: string;
  /**
   * Spec de recadrage appliquée à l'upload d'une image (ratio + dimensions cibles).
   * Si défini et que le fichier choisi est une image, un recadreur s'ouvre avant l'envoi.
   * `null`/`undefined` = upload direct sans recadrage.
   */
  cropSpec?: CropSpec | null;
}

/**
 * Champ média admin : URL libre (image ou vidéo) + upload vers Supabase + aperçu.
 * L'upload envoie le fichier vers /api/admin/upload et récupère l'URL publique.
 * Si `cropSpec` est fourni, les images sont recadrées aux dimensions standardisées
 * avant l'envoi (voir ImageCropper).
 */
export function MediaField({ value, onChange, label, hint, cropSpec }: MediaFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pendingCrop, setPendingCrop] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const url = value?.url || "";
  const currentType = value?.type || (url ? (isVideoUrl(url) ? "video" : "image") : "image");

  const handleUrlChange = (raw: string) => {
    const u = raw.trim();
    if (!u) {
      onChange(null);
      return;
    }
    onChange({ type: isVideoUrl(u) ? "video" : "image", url: u, alt: value?.alt });
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }
      onChange({ type: data.type, url: data.url, alt: value?.alt });
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(false);
    }
  };

  const handleLocalFile = (file: File) => {
    if (cropSpec && file.type.startsWith("image/")) {
      setPendingCrop(file);
      return;
    }
    uploadFile(file);
  };

  return (
    <div className="space-y-1.5">
      {(label || hint) && (
        <div>
          {label && <span className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>}
          {hint && <span className="block text-[11px] leading-snug text-[var(--color-text-tertiary)] mt-0.5">{hint}</span>}
        </div>
      )}
      <div className="flex items-start gap-2.5">
        {/* Aperçu */}
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] shrink-0 flex items-center justify-center">
          {url ? (
            currentType === "video" ? (
              <video src={url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={url} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <ImageIcon className="w-5 h-5 text-[var(--color-text-tertiary)]" />
          )}
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <input
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="URL image ou vidéo (.mp4) — ou cliquez Uploader"
            className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] disabled:opacity-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Envoi…" : "Uploader"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLocalFile(f);
                e.target.value = "";
              }}
            />
            {cropSpec && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-tertiary)]">
                <Crop className="w-3 h-3" /> Recadrage auto à l&apos;upload
              </span>
            )}
            {url && (
              <button
                type="button"
                onClick={() => onChange(null)}
                aria-label="Supprimer"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {url && currentType === "video" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-accent-blue)]">
                <Film className="w-3 h-3" /> Vidéo
              </span>
            )}
          </div>
          {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        </div>
      </div>

      {pendingCrop && cropSpec && (
        <ImageCropper
          file={pendingCrop}
          spec={cropSpec}
          onCancel={() => setPendingCrop(null)}
          onApply={(blob) => {
            const base = pendingCrop.name.replace(/\.[^.]+$/, "") || "image";
            const cropped = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
            setPendingCrop(null);
            uploadFile(cropped);
          }}
        />
      )}
    </div>
  );
}
