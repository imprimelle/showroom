"use client";
import { useEffect, useState } from "react";
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

/**
 * Hero plein écran style « Cozey » : slides en crossfade auto (images OU vidéos),
 * contenu (titre + CTA) surimprimé en bas à gauche, indicateurs de page.
 * Boutons discrets et compacts.
 */
export function HeroSlider({ slides, title, subtitle, ctaText, ctaHref, whatsappHref }: HeroSliderProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Slides (crossfade) — image ou vidéo */}
      {slides.map((s, i) => (
        <MediaRenderer
          key={i}
          url={s.url}
          alt={s.alt}
          type={s.type}
          imgWidth={1200}
          imgHeight={1600}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Dégradés : haut sombre (nav) + bas sombre (texte) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70 pointer-events-none" />

      {/* Contenu bas-gauche */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-12 md:pb-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight whitespace-pre-line max-w-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 md:mt-4 text-base md:text-lg text-white/85 max-w-xl">
              {subtitle}
            </p>
          )}
          <div className="mt-5 md:mt-6 flex flex-col items-start gap-2">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center font-medium rounded-full min-h-[34px] px-4 text-xs md:text-sm bg-white/90 text-black hover:bg-white transition-colors"
            >
              {ctaText}
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

      {/* Indicateurs de page (dots) */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-4 md:right-12 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
