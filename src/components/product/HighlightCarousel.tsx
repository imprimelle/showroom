"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHighlightIcon } from "@/lib/highlight-icons";
import type { Highlight } from "@/types";

/**
 * Carrousel des points forts d'une fiche produit.
 * Cartes (icône + titre) défilantes horizontalement ; un clic révèle le texte
 * complémentaire avec une animation (hauteur + fondu + glissement).
 */
export function HighlightCarousel({ highlights }: { highlights: Highlight[] }) {
  const [active, setActive] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [page, setPage] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    const card = el.firstElementChild as HTMLElement | null;
    if (card) {
      const w = card.offsetWidth + 12; // gap-3 = 12px
      if (w > 0) setPage(Math.min(highlights.length - 1, Math.max(0, Math.round(el.scrollLeft / w))));
    }
  }, [highlights.length]);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * trackRef.current.clientWidth * 0.75, behavior: "smooth" });
  };

  const scrollToIndex = (i: number) => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const w = card.offsetWidth + 12;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Flèche précédente */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Points forts précédents"
        className={cn(
          "absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 md:flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] shadow-sm transition-all hover:bg-[var(--color-bg-tertiary)]",
          !canLeft && "pointer-events-none opacity-0"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Flèche suivante */}
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Points forts suivants"
        className={cn(
          "absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 md:flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] shadow-sm transition-all hover:bg-[var(--color-bg-tertiary)]",
          !canRight && "pointer-events-none opacity-0"
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Piste défilante */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {highlights.map((h, i) => {
          const Icon = getHighlightIcon(h.icon);
          const open = active === i;
          return (
            <div key={i} className="snap-start shrink-0 w-[76%] max-w-[300px] sm:w-64">
              <button
                type="button"
                onClick={() => setActive(open ? null : i)}
                aria-expanded={open}
                className={cn(
                  "w-full text-left rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300",
                  open
                    ? "border-[var(--color-accent-amber)] bg-[var(--color-surface-card)] shadow-lg"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                <span
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
                    open
                      ? "bg-[var(--color-accent-amber)] text-white"
                      : "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
                  {h.title}
                </span>

                <AnimatePresence initial={false}>
                  {open && h.text && (
                    <motion.span
                      initial={{ height: 0, opacity: 0, y: -4 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -4 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="block overflow-hidden"
                    >
                      <span className="block text-[13px] text-[var(--color-text-secondary)] leading-relaxed pt-2.5 mt-0.5 border-t border-[var(--color-border-default)]">
                        {h.text}
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>

                {h.text && !open && (
                  <span className="text-[11px] font-medium text-[var(--color-accent-amber)] inline-flex items-center gap-1">
                    En savoir plus
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Indicateurs de position */}
      {highlights.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {highlights.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Aller au point fort ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === page ? "w-5 bg-[var(--color-accent-amber)]" : "w-1.5 bg-[var(--color-border-strong)]"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
