"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductSliderProps {
  products: ShowcaseProduct[];
  /** Défilement automatique (toutes les 5s). Défaut : `true`. */
  autoPlay?: boolean;
}

/** Espace horizontal entre les cartes (px) — volontairement compact. */
const GAP = 6;

export function ProductSlider({ products, autoPlay = true }: ProductSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Number of visible slides based on viewport
  const getSlidesPerView = () => {
    if (typeof window === "undefined") return 2;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 3;
    return 2;
  };

  const [slidesPerView, setSlidesPerView] = useState(2);
  const maxIndex = Math.max(0, products.length - slidesPerView);

  useEffect(() => {
    const update = () => setSlidesPerView(getSlidesPerView());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setCurrentIndex(clamped);
      if (trackRef.current) {
        const slideWidth = trackRef.current.children[0]?.clientWidth || 0;
        trackRef.current.scrollTo({
          left: clamped * (slideWidth + GAP),
          behavior: "smooth",
        });
      }
    },
    [maxIndex]
  );

  // Auto-advance (désactivé si autoPlay === false)
  useEffect(() => {
    if (!autoPlay) return;
    autoTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev >= maxIndex ? 0 : prev + 1;
        scrollTo(next);
        return next;
      });
    }, 5000);
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [maxIndex, scrollTo, autoPlay]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    scrollLeft.current = trackRef.current?.scrollLeft || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    const dx = e.touches[0].clientX - startX.current;
    trackRef.current.scrollLeft = scrollLeft.current - dx;
  };

  const handleTouchEnd = () => {
    if (!trackRef.current) return;
    setIsDragging(false);
    const slideWidth = trackRef.current.children[0]?.clientWidth || 0;
    const index = Math.round(trackRef.current.scrollLeft / (slideWidth + GAP));
    scrollTo(index);
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-0 pb-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[calc(50%-3px)] sm:w-[calc(33.333%-4px)] lg:w-[calc(25%-4.5px)] shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Indicateurs de scroll — discrets, noir & blanc, contextuels */}
      {products.length > slidesPerView && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => scrollTo(currentIndex - 1)}
              aria-label="Faire défiler vers la gauche"
              className="absolute top-1/2 -translate-y-1/2 -left-2 z-10 flex h-9 w-10 items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-md transition-colors hover:bg-[#15803d]"
            >
              <ArrowLeft className="h-4 w-6" strokeWidth={2.5} />
            </button>
          )}
          {currentIndex < maxIndex && (
            <button
              onClick={() => scrollTo(currentIndex + 1)}
              aria-label="Faire défiler vers la droite"
              className="absolute top-1/2 -translate-y-1/2 -right-2 z-10 flex h-9 w-10 items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-md transition-colors hover:bg-[#15803d]"
            >
              <ArrowRight className="h-4 w-6" strokeWidth={2.5} />
            </button>
          )}
        </>
      )}

      {/* Dots — supprimés : la séparation visuelle est assurée par le fond
          coloré (rectangle légèrement arrondi) qui enveloppe chaque slider. */}
    </div>
  );
}
