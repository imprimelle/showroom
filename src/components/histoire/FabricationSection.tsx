"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ACTE_2 } from "./content";
import { WireframeTable } from "./WireframeTable";
import { MirrorInfinity } from "./MirrorInfinity";
import { DayNightToggle } from "./DayNightToggle";
import { CncCutting } from "./CncCutting";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const STEP_VISUALS: Record<string, ReactNode> = {
  conception: <WireframeTable />,
  decoupe: <CncCutting />,
  miroir: <MirrorInfinity />,
  allumage: <DayNightToggle />,
};

/**
 * Section 3 — Acte 2 : « Du dessin 3D à l'assemblage lumineux ».
 * Le défilement (ScrollTrigger) révèle séquentiellement les 4 étapes de
 * fabrication ; chaque étape associe texte + visuel interactif.
 */
export function FabricationSection() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ACTE_2.steps.forEach((step, i) => {
        gsap.from(`[data-step="${step.id}"]`, {
          opacity: 0,
          y: 48,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: {
            trigger: `[data-step="${step.id}"]`,
            start: "top 68%",
            onEnter: () => setActive(i),
            onEnterBack: () => setActive(i),
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="acte-2"
      ref={root}
      aria-labelledby="acte-2-title"
      className="relative border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <header className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(255,165,0,0.7)]">
            {ACTE_2.kicker}
          </p>
          <h2
            id="acte-2-title"
            className="mt-3 font-display text-2xl md:text-4xl font-bold leading-tight"
          >
            {ACTE_2.title}
          </h2>
        </header>

        {/* Barre de progression des étapes */}
        <div className="hidden md:flex items-center gap-2 mb-16">
          {ACTE_2.steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
              <span
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors duration-300",
                  i <= active
                    ? "border-[var(--neon-amber)] text-[var(--neon-amber)] bg-[rgba(255,165,0,0.12)]"
                    : "border-white/15 text-white/40"
                )}
              >
                {i + 1}
              </span>
              {i < ACTE_2.steps.length - 1 && (
                <span
                  className={cn(
                    "flex-1 h-px transition-colors duration-500",
                    i < active ? "bg-[var(--neon-amber)]" : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-20 md:space-y-28">
          {ACTE_2.steps.map((step, i) => (
            <article
              key={step.id}
              data-step={step.id}
              className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center"
            >
              <div className={cn("order-2 lg:order-1", i % 2 === 1 && "lg:order-2")}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-5xl md:text-6xl font-black text-white/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold">{step.title}</h3>
                <p className="mt-4 text-white/75 leading-relaxed">{step.text}</p>
              </div>

              <div
                className={cn(
                  "order-1 lg:order-2 lg:sticky lg:top-32",
                  i % 2 === 1 && "lg:order-1"
                )}
              >
                <div className="relative aspect-square rounded-2xl border border-white/10 bg-[var(--histoire-ink)] overflow-hidden">
                  {STEP_VISUALS[step.id]}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
