"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import { INTRO, HISTOIRE_TITLE } from "./content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 1 — Intro plein écran : titre cinétique qui s'assemble mot à mot,
 * ligne concise, halo parallaxe au scroll, indication de défilement.
 */
export function IntroSection() {
  const root = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(".intro-eyebrow", { opacity: 0, y: 16, duration: 0.7, ease: "power2.out" })
        .from(".intro-word", { opacity: 0, y: 70, duration: 0.95, stagger: 0.1, ease: "power4.out" }, "-=0.35")
        .from(".intro-line", { opacity: 0, y: 24, duration: 0.7, ease: "power2.out" }, "-=0.5")
        .from(".intro-scroll", { opacity: 0, duration: 0.6 }, "-=0.2");

      // Parallaxe du halo d'ambiance
      gsap.to(glowRef.current, {
        yPercent: 35,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const words = HISTOIRE_TITLE.split(" ");

  return (
    <section
      id="intro"
      ref={root}
      className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 text-center overflow-hidden"
    >
      <div
        ref={glowRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(900px 520px at 50% 45%, rgba(255,165,0,0.15), transparent 65%)" }}
      />

      <p className="intro-eyebrow relative text-[11px] md:text-xs uppercase tracking-[0.4em] text-[rgba(255,165,0,0.75)]">
        {INTRO.eyebrow}
      </p>

      <h1 className="relative mt-6 font-display font-black leading-[0.95] tracking-tight text-[clamp(2.75rem,11vw,8.5rem)]">
        {words.map((w, i) => (
          <span key={i} className="intro-word inline-block histoire-neon-text">
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </h1>

      <p className="intro-line relative mt-8 max-w-md text-base md:text-lg text-white/70 leading-relaxed">
        {INTRO.line}
      </p>

      <div className="intro-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[11px] uppercase tracking-[0.3em]">{INTRO.scrollHint}</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
}
