"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PenTool, ClipboardCheck, Users } from "lucide-react";
import { ACTE_1 } from "./content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 2 — Acte 1 : « Deux regards, une seule ambition » (le volet humain).
 * Deux volets interactifs côte à côte (Ingénierie/Design vs Rigueur/Gestion),
 * avec balayage lumineux (Light Sweep) au survol et révélation au scroll.
 */
export function DualFocusSection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".acte1-reveal", {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });

      // Balayage lumineux au survol de chaque volet
      root.current?.querySelectorAll<HTMLElement>("[data-dual]").forEach((card) => {
        const sweep = card.querySelector<HTMLElement>(".histoire-sweep");
        if (!sweep) return;
        card.addEventListener("mouseenter", () => {
          gsap.fromTo(
            sweep,
            { xPercent: -220, opacity: 0.8 },
            { xPercent: 240, opacity: 0, duration: 1.1, ease: "power2.out" }
          );
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const panels = [
    {
      icon: PenTool,
      accent: "var(--neon-amber)",
      label: ACTE_1.engineering.label,
      text: ACTE_1.engineering.text,
    },
    {
      icon: ClipboardCheck,
      accent: "var(--neon-cyan)",
      label: ACTE_1.gestion.label,
      text: ACTE_1.gestion.text,
    },
  ];

  return (
    <section
      id="acte-1"
      ref={root}
      aria-labelledby="acte-1-title"
      className="relative max-w-6xl mx-auto px-6 py-20 md:py-28"
    >
      <header className="acte1-reveal max-w-3xl mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-[rgba(255,165,0,0.7)]">
          {ACTE_1.kicker}
        </p>
        <h2
          id="acte-1-title"
          className="mt-3 font-display text-2xl md:text-4xl font-bold leading-tight"
        >
          {ACTE_1.title}
        </h2>
        <p className="mt-5 text-base md:text-lg text-white/75 leading-relaxed">
          {ACTE_1.intro}
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {panels.map((p) => {
          const Icon = p.icon;
          return (
            <article
              key={p.label}
              data-dual
              className="acte1-reveal group relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--histoire-ink)] p-8 md:p-10"
              style={{ boxShadow: `0 0 0 1px ${p.accent}22, 0 24px 60px -30px ${p.accent}55` }}
            >
              {/* Halo coloré */}
              <div
                aria-hidden
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: p.accent }}
              />
              {/* Balayage lumineux */}
              <span aria-hidden className="histoire-sweep" />

              <span
                className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl border"
                style={{ color: p.accent, borderColor: `${p.accent}55`, background: `${p.accent}14` }}
              >
                <Icon className="w-7 h-7" />
              </span>

              <h3 className="relative mt-6 font-display text-xl md:text-2xl font-bold">
                {p.label}
              </h3>
              <p className="relative mt-3 text-white/75 leading-relaxed">{p.text}</p>
            </article>
          );
        })}
      </div>

      <div className="acte1-reveal mt-10 flex items-start gap-4 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 md:p-8">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(255,165,0,0.15)] text-[var(--neon-amber)] shrink-0">
          <Users className="w-5 h-5" />
        </span>
        <p className="text-white/80 leading-relaxed">{ACTE_1.team}</p>
      </div>
    </section>
  );
}
