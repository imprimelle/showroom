"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { imgProxyUrl } from "@/lib/images";

interface Slide {
  url: string;
  alt: string;
}

interface HeroSliderProps {
  slides: Slide[];
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaHref: string;
  whatsappHref: string;
}

/**
 * Hero plein écran style « Cozey » : slider d'images en crossfade auto,
 * contenu (titre + CTA) surimprimé en bas à gauche, indicateurs de page.
 * La barre de navigation se superpose par-dessus (transparente) sur la home.
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
      {/* Slides (crossfade) */}
      {slides.map((s, i) => (
        <img
          key={i}
          src={imgProxyUrl(s.url, 1200)}
          alt={s.alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Dégradés : haut sombre (pour la nav) + bas sombre (pour le texte) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70 pointer-events-none" />

      {/* Contenu bas-gauche */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-12 md:pb-14">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight whitespace-pre-line max-w-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 md:mt-5 text-base md:text-lg text-white/85 max-w-xl">
              {subtitle}
            </p>
          )}
          <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center font-semibold rounded-full min-h-[52px] px-8 text-lg bg-white text-black hover:bg-gray-200 transition-colors"
            >
              {ctaText}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-semibold rounded-full min-h-[52px] px-8 text-lg bg-[#25D366] text-white hover:bg-[#1EA952] transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Indicateurs de page (dots) */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-4 md:right-12 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
