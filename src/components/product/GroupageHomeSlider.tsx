"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatPrice } from "@/stores/currency";
import { imgProxyUrl } from "@/lib/images";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/admin/content/EditableText";
import type { GroupageHomeItem } from "@/lib/groupage-home";

interface GroupageStatus {
  places_taken: number;
  remaining: number;
  max_places: number;
}

/** Espace horizontal entre les cartes (px) — aligné sur ProductSlider. */
const GAP = 6;

export function GroupageHomeSlider({ items }: { items: GroupageHomeItem[] }) {
  const [statuses, setStatuses] = useState<Record<string, GroupageStatus>>({});
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(2);

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
      if (window.innerWidth >= 1024) setSlidesPerView(4);
      else if (window.innerWidth >= 640) setSlidesPerView(3);
      else setSlidesPerView(2);
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
    const slideWidth = (child?.clientWidth ?? 0) + GAP;
    track.scrollTo({ left: clamped * slideWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[0] as HTMLElement | undefined;
    const slideWidth = (child?.clientWidth ?? 0) + GAP;
    const idx = Math.round(track.scrollLeft / slideWidth);
    setCurrentIndex(Math.max(0, Math.min(idx, maxIndex)));
  };

  if (items.length === 0) return null;

  return (
    <section className="bg-[var(--color-bg-secondary)] py-10 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          align="left"
          eyebrow="Achat groupé"
          title="Rejoignez un groupage"
          subtitle="Plus on est nombreux, moins c'est cher"
          eyebrowKey="home.groupage.eyebrow"
          titleKey="home.groupage.title"
          subtitleKey="home.groupage.subtitle"
        />

        <div className="relative">
          {/* Piste défilante */}
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((it) => (
              <div
                key={it.id}
                className="w-[calc(50%-3px)] sm:w-[calc(33.333%-4px)] lg:w-[calc(25%-4.5px)] shrink-0 snap-start"
              >
                <GroupageHomeCard item={it} status={statuses[it.id]} />
              </div>
            ))}
          </div>

          {/* Indicateurs de scroll — discrets, noir & blanc, contextuels */}
          {items.length > slidesPerView && (
            <>
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => scrollTo(currentIndex - 1)}
                  aria-label="Groupage précédent"
                  className="absolute top-1/2 -translate-y-1/2 -left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[var(--color-text-primary)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {currentIndex < maxIndex && (
                <button
                  type="button"
                  onClick={() => scrollTo(currentIndex + 1)}
                  aria-label="Groupage suivant"
                  className="absolute top-1/2 -translate-y-1/2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[var(--color-text-primary)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
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
 * Carte groupage « accueil » — compacte, alignée sur ProductCard.
 * Masque les options : ne subsistent que l'image + badges, le nom, le prix
 * (barré + groupé + économie), une jauge fine et le bouton « Rejoindre ».
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
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Image produit + badges */}
      <Link
        href={`/collection/${item.slug}?groupage=1`}
        className="relative block aspect-[3/4] overflow-hidden bg-[var(--color-bg-tertiary)]"
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgProxyUrl(item.image, 600, 800)}
            alt={item.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-text-tertiary)]">
            <Users className="w-8 h-8" />
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-amber)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
          <Users className="h-3 w-3" /> <EditableText contentKey="groupage.badge" defaultValue="Groupage" />
        </span>
        {item.reductionPercent > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-[var(--color-success)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            −{item.reductionPercent}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-medium leading-snug text-[var(--color-text-primary)]">
          {item.name}
        </h3>

        {/* Prix barré + prix groupé + économie */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xs font-mono text-[var(--color-text-tertiary)] line-through">
            {formatPrice(item.originalTotal)}
          </span>
          <span className="text-[15px] font-bold leading-none text-[var(--color-success)]">
            {formatPrice(item.groupPrice)}
          </span>
        </div>
        {item.savings > 0 && (
          <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-success)]">
            Économisez {formatPrice(item.savings)}
          </p>
        )}

        {/* Jauge de places compacte */}
        <div className="mt-2.5">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-border-strong)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, #FFA500, #F97316, #F59E0B, #22C55E, #0EA5E9)",
              }}
            />
          </div>
          <p className="mt-1 text-[11px] font-medium leading-snug text-[var(--color-text-secondary)]">
            Il manque{" "}
            <span className="font-bold text-[var(--color-accent-amber)]">{remaining}</span>{" "}
            commande{remaining > 1 ? "s" : ""}
          </p>
        </div>

        {/* Bouton rejoindre */}
        <Link
          href={`/collection/${item.slug}?groupage=1`}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-success)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#15803D]"
        >
          <Users className="h-3.5 w-3.5" />
          <EditableText contentKey="groupage.join" defaultValue="Rejoindre le groupage" />
        </Link>
      </div>
    </div>
  );
}
