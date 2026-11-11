"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";
import { imgProxyUrl } from "@/lib/images";
import { formatFCFA } from "@/lib/utils";
import type { HeroHotspot, HotspotProduct, MediaItem } from "@/types";

interface HeroSliderProps {
  slides: MediaItem[];
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaHref: string;
  whatsappHref: string;
  searchQuestion: string;
  searchTerms: string[];
  products: HotspotProduct[];
}

/** Durée de la transition entre deux slides (ms). */
const TRANSITION_MS = 700;
/** Seuil de molette accumulée (px) pour déclencher un changement de slide. */
const WHEEL_THRESHOLD = 40;
/** Seuil tactile (px) pour un swipe vertical. */
const TOUCH_THRESHOLD = 40;

/** Point + slide actuellement ouvert en popover (null = fermé). */
interface OpenHotspot {
  slide: number;
  hotspot: number;
}

/**
 * Hero plein écran en **slider vertical piloté au scroll**, avec :
 *  - recherche épinglée en bas (toujours visible sur tous les slides) ;
 *  - titre / sous-titre / CTA / bouton WhatsApp par slide (repli sur les globaux) ;
 *  - slides « collection » : points cliquables sur l'image → popover produit (nom + prix).
 */
export function HeroSlider({
  slides,
  title,
  subtitle,
  ctaText,
  ctaHref,
  whatsappHref,
  searchQuestion,
  searchTerms,
  products,
}: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<OpenHotspot | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const lockRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const wheelAccumRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  const lastIndex = Math.max(0, slides.length - 1);

  const productBySlug = useMemo(() => {
    const m = new Map<string, HotspotProduct>();
    for (const p of products) if (p.slug) m.set(p.slug, p);
    return m;
  }, [products]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(lastIndex, next));
      if (clamped === activeRef.current) return;
      activeRef.current = clamped;
      setActive(clamped);
      setOpen(null);
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
      const dy = touchStartYRef.current - e.touches[0].clientY;
      if (Math.abs(dy) < TOUCH_THRESHOLD) return;

      const down = dy < 0;
      const idx = activeRef.current;

      if (!down && idx >= lastIndex) {
        touchStartYRef.current = null;
        window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        return;
      }
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
          const slideWhatsappText = s.whatsapp_text || "💬 WhatsApp";
          const slideWhatsappHref = s.whatsapp_href || whatsappHref;
          const hotspots = s.hotspots || [];

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

              {/* Points cliquables « collection » */}
              {hotspots.map((h: HeroHotspot, hi: number) => {
                const isOpen = open?.slide === i && open?.hotspot === hi;
                const product = h.product_slug ? productBySlug.get(h.product_slug) : undefined;
                const flipX = h.x > 55;
                const flipY = h.y > 70;
                const cornerClass =
                  !flipX && !flipY
                    ? "-top-1.5 -left-1.5"
                    : flipX && !flipY
                      ? "-top-1.5 -right-1.5"
                      : !flipX && flipY
                        ? "-bottom-1.5 -left-1.5"
                        : "-bottom-1.5 -right-1.5";
                return (
                  <div key={hi} className="absolute z-20" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(isOpen ? null : { slide: i, hotspot: hi });
                      }}
                      aria-label={`Produit ${product?.name || hi + 1}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 p-1"
                    >
                      <span className="absolute inset-0 rounded-full bg-white/80 animate-ping" />
                      <span
                        className={`relative block h-4 w-4 rounded-full border-2 shadow-md ${
                          isOpen ? "bg-[var(--color-accent-blue)] border-white" : "bg-white border-[var(--color-accent-blue)]"
                        }`}
                      />
                    </button>

                    {/* Popover ancré au point */}
                    {isOpen && (
                      <div
                        className="absolute w-52"
                        style={{
                          transform: `translate(${flipX ? "calc(-100% - 16px)" : "16px"}, ${flipY ? "calc(-100% - 16px)" : "16px"})`,
                        }}
                      >
                        <div className="relative rounded-xl bg-white shadow-xl border border-[var(--color-border-default)] p-3">
                          <span className={`absolute h-3 w-3 rotate-45 bg-white border-l border-t border-[var(--color-border-default)] ${cornerClass}`} />
                          {product ? (
                            <Link href={`/collection/${product.slug}`} onClick={() => setOpen(null)} className="block">
                              <div className="flex gap-2.5">
                                {product.image_url && (
                                  <span className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imgProxyUrl(product.image_url, 120, 120)} alt={product.name} className="w-full h-full object-cover" />
                                  </span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2">{product.name}</p>
                                  {product.price != null && (
                                    <p className="mt-0.5 text-sm font-bold text-[var(--color-accent-amber)]">{formatFCFA(product.price)}</p>
                                  )}
                                </div>
                              </div>
                              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-blue)]">
                                Voir le produit →
                              </span>
                            </Link>
                          ) : (
                            <p className="text-xs text-[var(--color-text-tertiary)]">Produit introuvable.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Contenu bas-gauche */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-24 md:px-12 md:pb-28">
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
                      href={slideWhatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center font-medium rounded-full min-h-[34px] px-4 text-xs md:text-sm bg-[#25D366]/90 text-white hover:bg-[#1EA952] transition-colors"
                    >
                      {slideWhatsappText}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recherche épinglée en bas (toujours visible) */}
      <div className="absolute bottom-3 left-0 right-0 z-30 px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          <HomeSearchBar question={searchQuestion} terms={searchTerms} />
        </div>
      </div>

      {/* Indicateurs verticaux (barres latérales) */}
      {slides.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-6 flex flex-col items-center gap-1.5 z-30">
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
