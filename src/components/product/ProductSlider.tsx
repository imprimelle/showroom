"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductSliderProps {
  products: ShowcaseProduct[];
}

export function ProductSlider({ products }: ProductSliderProps) {
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
        const gap = 16;
        trackRef.current.scrollTo({
          left: clamped * (slideWidth + gap),
          behavior: "smooth",
        });
      }
    },
    [maxIndex]
  );

  // Auto-advance
  useEffect(() => {
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
  }, [maxIndex, scrollTo]);

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
    const gap = 16;
    const index = Math.round(trackRef.current.scrollLeft / (slideWidth + gap));
    scrollTo(index);
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Arrows — desktop only */}
      {products.length > slidesPerView && (
        <>
          <button
            onClick={() => scrollTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 w-10 h-10 rounded-full bg-white shadow-lg border border-[var(--color-border-default)] items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollTo(currentIndex + 1)}
            disabled={currentIndex >= maxIndex}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 w-10 h-10 rounded-full bg-white shadow-lg border border-[var(--color-border-default)] items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots — mobile */}
      {products.length > slidesPerView && (
        <div className="flex justify-center gap-1.5 mt-4 md:hidden">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
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
  );
}
