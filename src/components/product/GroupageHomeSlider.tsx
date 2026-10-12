"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Users, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatPrice } from "@/stores/currency";
import { imgProxyUrl } from "@/lib/images";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { GroupageHomeItem } from "@/lib/groupage-home";

interface GroupageStatus {
  places_taken: number;
  remaining: number;
  max_places: number;
}

export function GroupageHomeSlider({ items }: { items: GroupageHomeItem[] }) {
  const [statuses, setStatuses] = useState<Record<string, GroupageStatus>>({});
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  // Jauge « live » : place / restantes par produit (repli sur la base d'affichage).
  useEffect(() => {
    let active = true;
    Promise.all(
      items.map((it) =>
        fetch(`/api/groupage?product_id=${it.id}`)
          .then((r) => r.json())
          .then((d) => ({ id: it.id, d }))
          .catch(() => ({ id: it.id, d: null }))
      )
    ).then((results) => {
      if (!active) return;
      const map: Record<string, GroupageStatus> = {};
      for (const { id, d } of results) {
        if (d?.enabled) {
          map[id] = {
            places_taken: d.places_taken ?? 0,
            remaining: d.remaining ?? 0,
            max_places: d.max_places ?? 0,
          };
        }
      }
      setStatuses(map);
    });
    return () => {
      active = false;
    };
  }, [items]);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 1024) setSlidesPerView(3);
      else if (window.innerWidth >= 640) setSlidesPerView(2);
      else setSlidesPerView(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, items.length - slidesPerView);

  const scrollTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clamped);
    const child = track.children[0] as HTMLElement | undefined;
    const slideWidth = (child?.clientWidth ?? 0) + 16; // gap-4
    track.scrollTo({ left: clamped * slideWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[0] as HTMLElement | undefined;
    const slideWidth = (child?.clientWidth ?? 0) + 16;
    const idx = Math.round(track.scrollLeft / slideWidth);
    setCurrentIndex(Math.max(0, Math.min(idx, maxIndex)));
  };

  if (items.length === 0) return null;

  return (
    <section className="bg-[var(--color-bg-secondary)] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          align="left"
          eyebrow="Achat groupé"
          title="Rejoignez un groupage"
          subtitle="Plus on est nombreux, moins c'est cher"
        />

        <div className="relative">
          {/* Piste défilante */}
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((it) => (
              <div
                key={it.id}
                className="w-[80vw] max-w-[320px] sm:w-[calc(50%-8px)] sm:max-w-none lg:w-[calc(33.333%-11px)] shrink-0 snap-start"
              >
                <GroupageHomeCard item={it} status={statuses[it.id]} />
              </div>
            ))}
          </div>

          {/* Flèches — desktop uniquement */}
          {items.length > slidesPerView && (
            <>
              <button
                type="button"
                onClick={() => scrollTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                aria-label="Groupage précédent"
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 w-10 h-10 rounded-full bg-white shadow-lg border border-[var(--color-border-default)] items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(currentIndex + 1)}
                disabled={currentIndex >= maxIndex}
                aria-label="Groupage suivant"
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 w-10 h-10 rounded-full bg-white shadow-lg border border-[var(--color-border-default)] items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Points — mobile uniquement */}
        {items.length > slidesPerView && (
          <div className="flex justify-center gap-1.5 mt-4 md:hidden">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Aller au groupage ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5 bg-[var(--color-text-primary)]"
                    : "w-1.5 bg-[var(--color-border-strong)]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Carte groupage « accueil » : reprend le style de la grande carte groupage
 * (GroupageCard) mais masque le partage et les options ajoutables. Ne subsistent
 * que : image produit + badge/réduction, prix barré + prix groupé + économie,
 * options incluses (« Inclus : … »), jauge de places et bouton « Rejoindre ».
 */
function GroupageHomeCard({
  item,
  status,
}: {
  item: GroupageHomeItem;
  status?: GroupageStatus;
}) {
  const formatPrice = useFormatPrice();

  const maxPlaces = status?.max_places ?? item.maxPlaces;
  const placesTaken = status?.places_taken ?? item.basePlaces;
  const remaining = status?.remaining ?? Math.max(0, maxPlaces - item.basePlaces);
  const pct = Math.min(100, maxPlaces > 0 ? (placesTaken / maxPlaces) * 100 : 0);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[var(--color-accent-amber)] bg-[var(--color-cream)]">
      {/* Image produit + badge groupage + réduction */}
      <Link
        href={`/collection/${item.slug}?groupage=1`}
        className="relative block aspect-[4/3] overflow-hidden bg-[var(--color-bg-tertiary)]"
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgProxyUrl(item.image, 640, 480)}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-text-tertiary)]">
            <Users className="w-8 h-8" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-amber)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
          <Users className="h-3.5 w-3.5" /> Groupage
        </span>
        {item.reductionPercent > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-[var(--color-success)] px-2 py-0.5 text-xs font-bold text-white">
            −{item.reductionPercent}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold leading-snug text-[var(--color-text-primary)]">
          {item.name}
        </h3>

        {/* Prix barré + prix groupé + économie */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm text-[var(--color-text-tertiary)] line-through">
            {formatPrice(item.originalTotal)}
          </span>
          <span className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
            {formatPrice(item.groupPrice)}
          </span>
        </div>
        {item.savings > 0 && (
          <p className="mt-0.5 text-xs font-semibold text-[var(--color-success)]">
            Économisez {formatPrice(item.savings)}
          </p>
        )}

        {/* Options incluses */}
        {item.includedOptions.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Inclus :
            </span>
            {item.includedOptions.map((opt) => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-amber-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)]"
              >
                <Check className="h-3 w-3 text-[var(--color-accent-amber)]" />
                {opt.label}
                {opt.price != null && opt.price > 0 && (
                  <span className="text-[10px] font-semibold text-[var(--color-success)]">
                    {formatPrice(opt.price)}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Jauge de places */}
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
            Il nous manque{" "}
            <span className="font-bold text-[var(--color-accent-amber)]">{remaining}</span>{" "}
            commande{remaining > 1 ? "s" : ""} pour livrer le groupage
          </p>

          <div className="relative h-3.5 overflow-hidden rounded-full bg-[var(--color-border-strong)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, #FFA500, #F97316, #F59E0B, #22C55E, #0EA5E9)",
              }}
            />
            <span className="groupage-sheen absolute inset-y-0 left-0 w-1/4 rounded-full bg-white/50 blur-[3px]" />
          </div>

          <div className="relative mt-2 h-5 text-[10px] leading-none">
            <div className="absolute inset-x-0 top-0 flex justify-between">
              {[0, 25, 50, 75, 100].map((t) => (
                <span key={t} className="h-1.5 w-px bg-[var(--color-border-strong)]" />
              ))}
            </div>
            <span className="absolute left-0 top-2 font-medium text-[var(--color-text-tertiary)]">
              0
            </span>
            <span
              className="absolute top-2 -translate-x-1/2 font-bold text-[var(--color-accent-amber)]"
              style={{ left: `${pct}%` }}
            >
              {placesTaken}
            </span>
            <span className="absolute right-0 top-2 font-medium text-[var(--color-text-tertiary)]">
              {maxPlaces}
            </span>
          </div>
        </div>

        {/* Bouton rejoindre */}
        <Link
          href={`/collection/${item.slug}?groupage=1`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-success)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#15803D]"
        >
          <Users className="h-4 w-4" />
          Rejoindre le groupage
        </Link>
      </div>
    </div>
  );
}
