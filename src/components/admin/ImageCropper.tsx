"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, ZoomIn, ZoomOut, RotateCcw, X, Check, AlertTriangle } from "lucide-react";
import type { CropSpec } from "@/lib/media-specs";
import { ratioLabel } from "@/lib/media-specs";

interface ImageCropperProps {
  /** Fichier image source (à recadrer). */
  file: File;
  /** Dimensions cibles (ratio imposé + taille de sortie). */
  spec: CropSpec;
  onCancel: () => void;
  /** Reçoit le blob JPEG recadré aux dimensions `spec.width × spec.height`. */
  onApply: (blob: Blob) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Recadreur d'image (modal) : fenêtre de cadrage à ratio fixe, image déplaçable
 * et zoomable en dessous. Sans dépendance externe (canvas natif).
 */
export function ImageCropper({ file, spec, onCancel, onApply }: ImageCropperProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const [objectUrl, setObjectUrl] = useState("");
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [container, setContainer] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  // Charge l'image source.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setError("Impossible de lire cette image.");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const coverScale = useCallback(
    (cw: number, ch: number) =>
      natural ? Math.max(cw / natural.w, ch / natural.h) : 1,
    [natural]
  );

  // Ajuste l'image au cadrage (mode « cover ») dans l'espace disponible.
  const fit = useCallback(() => {
    if (!natural || !stageRef.current) return;
    const stage = stageRef.current.getBoundingClientRect();
    const availW = Math.max(80, stage.width - 32);
    const availH = Math.max(80, stage.height - 32);
    let w = availW;
    let h = availW / spec.ratio;
    if (h > availH) {
      h = availH;
      w = availH * spec.ratio;
    }
    const s = coverScale(w, h);
    setContainer({ w, h });
    setScale(s);
    setPos({ x: (w - natural.w * s) / 2, y: (h - natural.h * s) / 2 });
  }, [natural, spec.ratio, coverScale]);

  useEffect(() => {
    fit();
  }, [fit]);

  // Recalcule à la taille de fenêtre.
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  // Échap pour annuler.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const clampPos = useCallback(
    (x: number, y: number, s: number, cw: number, ch: number) => {
      if (!natural) return { x, y };
      const iw = natural.w * s;
      const ih = natural.h * s;
      const minX = Math.min(0, cw - iw);
      const minY = Math.min(0, ch - ih);
      return {
        x: Math.min(0, Math.max(minX, x)),
        y: Math.min(0, Math.max(minY, y)),
      };
    },
    [natural]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy, scale, container.w, container.h));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const setZoom = (next: number) => {
    const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setScale(s);
    setPos((p) => clampPos(p.x, p.y, s, container.w, container.h));
  };

  const reset = () => fit();

  const apply = () => {
    if (!natural || !imgRef.current || container.w === 0) return;
    setApplying(true);
    setError("");
    // Zone de cadrage dans les coordonnées naturelles de l'image.
    const sx = -pos.x / scale;
    const sy = -pos.y / scale;
    const sw = container.w / scale;
    const sh = container.h / scale;

    const canvas = document.createElement("canvas");
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas non supporté par ce navigateur.");
      setApplying(false);
      return;
    }
    // Fond blanc (évite les bords transparents si la source est décalée).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setApplying(false);
        if (blob) onApply(blob);
        else setError("Erreur lors de la génération de l'image recadrée.");
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Recadrer l'image">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] overflow-hidden flex flex-col max-h-[92vh] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-[var(--color-accent-blue)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recadrer l&apos;image</h3>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fermer" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consigne */}
        <div className="px-4 pt-3 text-[11px] text-[var(--color-text-tertiary)]">
          Ratio imposé <span className="font-semibold text-[var(--color-text-secondary)]">{ratioLabel(spec)}</span> ({spec.width} × {spec.height} px). Faites glisser pour repositionner, ajustez le zoom.
        </div>

        {/* Zone de cadrage */}
        <div ref={stageRef} className="relative h-[48vh] min-h-[300px] max-h-[540px] p-4 flex items-center justify-center bg-[var(--color-bg-tertiary)]">
          {!natural && !error && (
            <p className="text-sm text-[var(--color-text-tertiary)]">Chargement…</p>
          )}
          {error && !natural && (
            <p className="flex items-center gap-1.5 text-sm text-[var(--color-error)]">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
          {natural && container.w > 0 && (
            <div
              className="relative overflow-hidden touch-none select-none rounded-md shadow-lg bg-black"
              style={{ width: container.w, height: container.h, cursor: "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <img
                ref={imgRef}
                src={objectUrl}
                alt=""
                draggable={false}
                className="absolute left-0 top-0 select-none pointer-events-none"
                style={{
                  width: natural.w,
                  height: natural.h,
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                  transformOrigin: "top left",
                  maxWidth: "none",
                }}
              />
              {/* Grille des tiers */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/50" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/50" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/50" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/50" />
                <div className="absolute inset-0 border-2 border-white/80 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={Math.min(scale, MAX_ZOOM)}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-28 accent-[var(--color-text-primary)]"
              aria-label="Zoom"
            />
            <ZoomIn className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className="inline-flex items-center h-9 px-4 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
              Annuler
            </button>
            <button type="button" onClick={apply} disabled={applying || !natural} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:bg-[#111827] disabled:opacity-50 transition-colors">
              <Check className="w-4 h-4" />
              {applying ? "Recadrage…" : "Appliquer"}
            </button>
          </div>
        </div>

        {error && natural && (
          <p className="px-4 pb-3 text-xs text-[var(--color-error)]">{error}</p>
        )}
      </div>
    </div>
  );
}
