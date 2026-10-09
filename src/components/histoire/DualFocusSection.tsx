"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PenTool, ClipboardCheck } from "lucide-react";
import { ACTE_1 } from "./content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 2 — Le duo : deux volets qui glissent depuis les côtés au scroll,
 * balayage lumineux au survol.
 */
export function DualFocusSection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".duo-head > *", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.from("[data-duo='eng']", {
        opacity: 0,
        x: -80,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 55%" },
      });
      gsap.from("[data-duo='gest']", {
        opacity: 0,
        x: 80,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 55%" },
      });
      gsap.from(".duo-footer", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: ".duo-footer", start: "top 88%" },
      });

      root.current?.querySelectorAll<HTMLElement>("[data-duo]").forEach((card) => {
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
    { icon: PenTool, accent: "var(--neon-amber)", key: "eng", ...ACTE_1.engineering },
    { icon: ClipboardCheck, accent: "var(--neon-cyan)", key: "gest", ...ACTE_1.gestion },
  ];

  return (
    <section
      id="acte-1"
      ref={root}
      className="relative min-h-screen flex flex-col justify-center px-6 py-24"
    >
      <div className="duo-head max-w-2xl mb-14">
        <p className="text-xs uppercase tracking-[0.35em] text-[rgba(255,165,0,0.7)]">{ACTE_1.kicker}</p>
        <h2 className="mt-4 font-display font-black leading-[1.02] tracking-tight text-[clamp(2rem,6vw,4rem)]">
          {ACTE_1.title}
        </h2>
        <p className="mt-4 text-white/65 text-base md:text-lg">{ACTE_1.intro}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 max-w-6xl">
        {panels.map((p) => {
          const Icon = p.icon;
          return (
            <article
              key={p.key}
              data-duo={p.key}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[var(--histoire-ink)] p-9 md:p-12 min-h-[260px] flex flex-col justify-between"
              style={{ boxShadow: `0 0 0 1px ${p.accent}1f, 0 30px 70px -40px ${p.accent}66` }}
            >
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
                style={{ background: p.accent }}
              />
              <span aria-hidden className="histoire-sweep" />

              <span
                className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl border"
                style={{ color: p.accent, borderColor: `${p.accent}55`, background: `${p.accent}14` }}
              >
                <Icon className="w-6 h-6" />
              </span>

              <div className="relative mt-10">
                <h3 className="font-display text-2xl md:text-3xl font-bold">{p.label}</h3>
                <p className="mt-3 text-white/65 text-base md:text-lg leading-relaxed">{p.line}</p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="duo-footer mt-10 max-w-2xl text-white/55 text-base md:text-lg">{ACTE_1.footer}</p>
    </section>
  );
}
