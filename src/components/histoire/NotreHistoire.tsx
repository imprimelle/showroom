"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IntroSection } from "./IntroSection";
import { DualFocusSection } from "./DualFocusSection";
import { FabricationSection } from "./FabricationSection";
import { AfricaMapSection } from "./AfricaMapSection";
import { CtaSection } from "./CtaSection";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "acte-1", label: "Le duo" },
  { id: "acte-2", label: "Fabrication" },
  { id: "acte-3", label: "Vision" },
  { id: "conclusion", label: "CTA" },
];

/**
 * Page « Notre Histoire » — expérience immersive plein écran, sans top bar ni
 * logo : un bouton retour en haut à gauche, un rail de progression à droite,
 * et les sections qui s'organisent au fil du scroll.
 */
export function NotreHistoire({ whatsapp }: { whatsapp: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = ids.indexOf(e.target.id);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#0a0a0c] text-white overflow-x-hidden antialiased">
      {/* Bouton retour vers le site */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md px-4 py-2 text-sm text-white/80 hover:text-white hover:border-white/35 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Retour</span>
      </Link>

      {/* Rail de progression (sections) */}
      <nav
        className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-4"
        aria-label="Progression de la page"
      >
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="group relative flex items-center" aria-label={s.label}>
            <span
              className={cn(
                "block rounded-full transition-all duration-500",
                i === active
                  ? "w-2.5 h-2.5 bg-[var(--neon-amber)] shadow-[0_0_10px_rgba(255,165,0,0.8)]"
                  : "w-1.5 h-1.5 bg-white/30 group-hover:bg-white/60"
              )}
            />
            <span
              className={cn(
                "absolute right-5 whitespace-nowrap text-xs font-medium transition-opacity duration-300",
                i === active ? "opacity-100 text-[var(--neon-gold)]" : "opacity-0 group-hover:opacity-100 text-white/60"
              )}
            >
              {s.label}
            </span>
          </a>
        ))}
      </nav>

      <IntroSection />
      <DualFocusSection />
      <FabricationSection />
      <AfricaMapSection />
      <CtaSection whatsapp={whatsapp} />
    </main>
  );
}
