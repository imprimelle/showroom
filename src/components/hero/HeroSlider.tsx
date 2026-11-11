"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import type { MediaItem } from "@/types";

interface HeroSliderProps {
  slides: MediaItem[];
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaHref: string;
  whatsappHref: string;
}

/** Durée de la transition entre deux slides (ms). */
const TRANSITION_MS = 700;
/** Seuil de molette accumulée (px) pour déclencher un changement de slide. */
const WHEEL_THRESHOLD = 40;
/** Seuil tactile (px) pour un swipe vertical. */
const TOUCH_THRESHOLD = 40;

/**
 * Hero plein écran en **slider vertical piloté au scroll**.
 *
 * Comportement :
 *  - la molette (desktop) et le swipe (mobile) font défiler les slides verticalement ;
 *  - tant qu'il reste des slides dans la direction du scroll, celui-ci est « avalé »
 *    par le héro (pas de défilement de page) ;
 *  - arrivé au dernier slide, le scroll est relâché vers les sections suivantes.
 *
 * Chaque slide peut porter son propre contenu (titre / sous-titre / CTA) ; à défaut,
 * les réglages globaux (`title`, `subtitle`, `ctaText`, `ctaHref`) sont utilisés.
 */
export function HeroSlider({ slides, title, subtitle, ctaText, ctaHref, whatsappHref }: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const lockRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const wheelAccumRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  const lastIndex = Math.max(0, slides.length - 1);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(lastIndex, next));
      if (clamped === activeRef.current) return;
      activeRef.current = clamped;
      setActive(clamped);
      lockRef.current = true;
      if (lockTimerRef.current !== null) window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = window.setTimeout(() => {
        lockRef.current = false;
      }, TRANSITION_MS + 60);
    },
    [lastIndex]
  );

  // === Molette (desktop) ===
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      if (!delta) return;
      const down = delta > 0;
      const idx = activeRef.current;

      // Relâchement : vers le bas au dernier slide, vers le haut au premier slide.
      if (down && idx >= lastIndex) return;
      if (!down && idx <= 0) return;

      e.preventDefault();
      if (lockRef.current) return;

      wheelAccumRef.current += Math.abs(delta);
      if (wheelAccumRef.current < WHEEL_THRESHOLD) return;
      wheelAccumRef.current = 0;
      goTo(down ? idx + 1 : idx - 1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lastIndex, goTo]);

  // === Tactile (mobile) ===
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      const dy = touchStartYRef.current - e.touches[0].clientY; // > 0 = swipe vers le haut
      if (Math.abs(dy) < TOUCH_THRESHOLD) return;

      const down = dy < 0; // swipe vers le bas (retour au slide précédent)
      const idx = activeRef.current;

      // Relâchement vers le bas : dernier slide → défilement de page d'un écran.
      if (!down && idx >= lastIndex) {
        touchStartYRef.current = null;
        window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        return;
      }
      // Tout en haut : rien au-dessus, on laisse le navigateur (rebond éventuel).
      if (down && idx <= 0) return;

      e.preventDefault();
      touchStartYRef.current = null;
      if (lockRef.current) return;
      goTo(down ? idx - 1 : idx + 1);
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [lastIndex, goTo]);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current !== null) window.clearTimeout(lockTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[var(--color-bg-secondary)]"
      style={{ touchAction: "none" }}
    >
      {/* Piste verticale des slides */}
      <div
        className="absolute inset-0 transition-transform ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateY(-${active * 100}%)`, transitionDuration: `${TRANSITION_MS}ms` }}
      >
        {slides.map((s, i) => {
          const slideTitle = s.title || title;
          const slideSubtitle = s.subtitle || subtitle;
          const slideCtaText = s.cta_text || ctaText;
          const slideCtaHref = s.cta_href || ctaHref;
          return (
            <div key={i} className="relative w-full h-full overflow-hidden">
              <MediaRenderer
                url={s.url}
                alt={s.alt}
                type={s.type}
                imgWidth={1200}
                imgHeight={1600}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                videoPreload={i === 0 ? "metadata" : "none"}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Dégradés : haut sombre (nav) + bas sombre (texte) */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70 pointer-events-none" />

              {/* Contenu bas-gauche */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-12 md:pb-12">
                <div className="max-w-7xl mx-auto">
                  <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight whitespace-pre-line max-w-2xl">
                    {slideTitle}
                  </h1>
                  {slideSubtitle && (
                    <p className="mt-3 md:mt-4 text-base md:text-lg text-white/85 max-w-xl">
                      {slideSubtitle}
                    </p>
                  )}
                  <div className="mt-5 md:mt-6 flex flex-col items-start gap-2">
                    <Link
                      href={slideCtaHref}
                      className="inline-flex items-center justify-center font-medium rounded-full min-h-[34px] px-4 text-xs md:text-sm bg-white/90 text-black hover:bg-white transition-colors"
                    >
                      {slideCtaText}
                    </Link>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center font-medium rounded-full min-h-[34px] px-4 text-xs md:text-sm bg-[#25D366]/90 text-white hover:bg-[#1EA952] transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicateurs verticaux (barres latérales) */}
      {slides.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-6 flex flex-col items-center gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active ? "h-6 w-1.5 bg-white/90" : "h-3 w-1.5 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
