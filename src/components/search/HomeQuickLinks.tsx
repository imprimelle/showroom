"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { imgProxyUrl } from "@/lib/images";
import type { ResolvedQuickLink } from "@/lib/home-search";

/** Cycle d'indication (ms) : scroll droite → retour, répété. */
const PEEK_CYCLE_MS = 3000;
/** Durée de maintien en position « droite » avant retour. */
const PEEK_HOLD_MS = 1300;
/** Largeur de « peek » vers la droite (px). */
const PEEK_DISTANCE = 180;

/**
 * Slider horizontal de liens rapides (sous-catégories + pages) sous la barre de
 * recherche de l'accueil. Une puce directionnelle à droite + un défilement
 * automatique « droite puis retour » toutes les 3 s indiquent que le slider défile,
 * jusqu'à la première interaction utilisateur (swipe / molette).
 */
export function HomeQuickLinks({ links }: { links: ResolvedQuickLink[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Détecte si la piste déborde réellement (au montage + au resize).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setIsScrollable(track.scrollWidth > track.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Indication de défilement : peek droite → retour, toutes les 3 s,
  // jusqu'à ce que l'utilisateur interagisse (swipe / molette).
  useEffect(() => {
    if (hasInteracted || !isScrollable) return;
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const peek = Math.min(PEEK_DISTANCE, maxScroll);
    let backTimer: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      track.scrollTo({ left: peek, behavior: "smooth" });
      backTimer = setTimeout(() => {
        track.scrollTo({ left: 0, behavior: "smooth" });
      }, PEEK_HOLD_MS);
    }, PEEK_CYCLE_MS);

    return () => {
      clearInterval(interval);
      if (backTimer) clearTimeout(backTimer);
    };
  }, [hasInteracted, isScrollable]);

  if (links.length === 0) return null;

  return (
    <div className="relative">
      {/* Piste défilante */}
      <div
        ref={trackRef}
        onPointerDown={() => setHasInteracted(true)}
        onWheel={() => setHasInteracted(true)}
        className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 pl-4 pr-9 pb-1 snap-x snap-proximity"
      >
        {links.map((l) => (
          <Link key={l.key} href={l.href} className="shrink-0 snap-start">
            <span className="inline-flex items-center gap-2.5 h-11 rounded-full bg-[var(--color-bg-tertiary)] pl-1.5 pr-4 hover:bg-[var(--color-border-default)] transition-colors">
              {/* Miniature (image produit / page) ou icône de repli */}
              <span className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] shrink-0 flex items-center justify-center text-base">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgProxyUrl(l.image, 64, 64)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span aria-hidden="true">{l.icon || "📄"}</span>
                )}
              </span>
              {/* Nom en gras, 2 lignes max */}
              <span className="text-sm font-bold text-[var(--color-text-primary)] leading-tight line-clamp-2 max-w-[9rem] text-left">
                {l.name}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* Puce directionnelle à droite (indique que le slider défile) */}
      {isScrollable && !hasInteracted && (
        <div className="pointer-events-none absolute right-0 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm border border-[var(--color-border-default)]">
          <ChevronRight className="h-3 w-3 text-[var(--color-accent-amber)]" />
        </div>
      )}
    </div>
  );
}
