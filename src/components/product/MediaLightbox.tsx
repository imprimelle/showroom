"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ImageIcon } from "lucide-react";
import { imgProxyUrl } from "@/lib/images";

export interface LightboxItem {
  type: "image" | "video";
  url: string;
  alt?: string;
}

interface MediaLightboxProps {
  open: boolean;
  onClose: () => void;
  /** Tous les médias (photos + vidéos), dans l'ordre d'affichage de la défileuse. */
  items: LightboxItem[];
  /** Index de départ dans `items`. */
  initialIndex?: number;
  productName?: string;
}

/**
 * Lightbox style « bottom sheet » (même aspect que le panier) : glisse depuis le bas
 * de l'écran, fond semi-transparent laissant voir la fiche produit en arrière-plan,
 * et défileuse verticale de photos/vidéos haute résolution avec espacement réduit.
 * Bloque le défilement de l'arrière-plan tant qu'elle est ouverte.
 */
export function MediaLightbox({
  open,
  onClose,
  items,
  initialIndex = 0,
  productName,
}: MediaLightboxProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bloque le scroll de l'arrière-plan + fermeture via Échap.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Positionne la défileuse sur le média de départ à l'ouverture.
  useEffect(() => {
    if (!open) return;
    const idx = Math.min(Math.max(initialIndex, 0), items.length - 1);
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-lightbox-index="${idx}"]`
    );
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "auto", block: "start" }));
    }
  }, [open, initialIndex, items.length]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fond semi-transparent (laisse voir la fiche produit derrière) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/40"
            onClick={onClose}
          />

          {/* Bottom sheet glissant depuis le bas */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-h-[75vh] rounded-t-2xl bg-[var(--color-surface-elevated)]/95 backdrop-blur-xl flex flex-col overflow-hidden md:mx-auto md:mb-4 md:max-w-xl md:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={productName ? `Galerie — ${productName}` : "Galerie multimédia"}
          >
            {/* Poignée (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-9 h-1 rounded-full bg-[var(--color-border-strong)]" />
            </div>

            {/* En-tête */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border-default)] shrink-0">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-semibold font-display text-[var(--color-text-primary)]">
                  <ImageIcon className="w-5 h-5 shrink-0 text-[var(--color-accent-amber)]" />
                  <span className="truncate">{productName || "Galerie"}</span>
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {items.length} média{items.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer la galerie"
                className="ml-auto shrink-0 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Défileuse verticale (espacement réduit entre les médias) */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2"
            >
              {items.map((item, i) => (
                <div key={i} data-lightbox-index={i} className="w-full">
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-auto rounded-xl bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgProxyUrl(item.url, 1200, 1600)}
                      alt={item.alt || ""}
                      className="w-full h-auto rounded-xl"
                      draggable={false}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
