"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Power, ChevronDown } from "lucide-react";
import { INTRO, HISTOIRE_TITLE } from "./content";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 1 — « L'Interrupteur » (mode sombre absolu).
 * Un clic sur l'interrupteur néon ou un premier scroll déclenche la séquence
 * d'allumage GSAP : grésillement visuel, micro-vibration mobile, révélation du
 * texte d'intro, transition du fond vers un noir nuancé.
 */
export function IntroSection() {
  const [lit, setLit] = useState(false);
  const litRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const offRef = useRef<HTMLParagraphElement>(null);
  const onRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const reducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ignite = useCallback(() => {
    if (litRef.current) return;
    litRef.current = true;
    setLit(true);

    try {
      if (navigator.vibrate) navigator.vibrate(50);
    } catch {
      /* vibration non supportée (desktop) */
    }

    if (reducedMotion()) {
      gsap.set(offRef.current, { opacity: 0 });
      gsap.set(onRef.current, { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline();
    // Grésillement du bouton (flicker rapide) puis stabilisation.
    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }
    )
      .to(offRef.current, { opacity: 0, y: -18, duration: 0.5, ease: "power2.in" }, 0.1)
      .fromTo(
        onRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" },
        0.45
      );
  }, []);

  // Premier scroll (wheel / touch) = allumage si pas déjà déclenché.
  useEffect(() => {
    const onGesture = () => ignite();
    window.addEventListener("wheel", onGesture, { passive: true });
    window.addEventListener("touchmove", onGesture, { passive: true });
    return () => {
      window.removeEventListener("wheel", onGesture);
      window.removeEventListener("touchmove", onGesture);
    };
  }, [ignite]);

  return (
    <section
      ref={sectionRef}
      aria-label="L'interrupteur"
      className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 text-center overflow-hidden"
    >
      {/* Halo d'ambiance qui s'intensifie à l'allumage */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 transition-opacity duration-[1400ms] pointer-events-none",
          lit ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(900px 520px at 50% 42%, rgba(255,165,0,0.14), transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Interrupteur néon */}
        <button
          type="button"
          onClick={ignite}
          aria-label={lit ? "Lumière allumée" : "Allumer la lumière"}
          aria-pressed={lit}
          className={cn(
            "group relative inline-flex items-center justify-center w-24 h-24 rounded-full border transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-amber)]",
            lit
              ? "border-[var(--neon-amber)] bg-[rgba(255,165,0,0.12)] shadow-[0_0_40px_6px_rgba(255,165,0,0.5)]"
              : "border-[rgba(255,165,0,0.4)] bg-transparent histoire-switch-idle"
          )}
        >
          <Power
            className={cn(
              "w-9 h-9 transition-all duration-500",
              lit
                ? "text-[var(--neon-amber)] drop-shadow-[0_0_8px_rgba(255,165,0,0.9)]"
                : "text-[rgba(255,165,0,0.55)]"
            )}
          />
          <span className="absolute inset-0 rounded-full border border-transparent group-hover:border-[rgba(255,165,0,0.3)] transition-colors" />
        </button>

        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[rgba(255,165,0,0.7)]">
          L&apos;histoire d&apos;Imprimelle
        </p>

        <h1
          ref={titleRef}
          className={cn(
            "mt-4 font-display text-3xl md:text-5xl font-bold leading-tight",
            lit && "histoire-neon-text"
          )}
        >
          {HISTOIRE_TITLE}
        </h1>

        {/* État éteint */}
        <p
          ref={offRef}
          className="mt-6 text-base md:text-lg text-white/60 leading-relaxed"
        >
          {INTRO.off}
        </p>

        {/* État allumé (révélé à l'allumage) */}
        <div ref={onRef} className="opacity-0">
          <p className="mt-6 font-display text-xl md:text-2xl font-semibold histoire-neon-text">
            {INTRO.onLead}
          </p>
          <p className="mt-4 text-base md:text-lg text-white/85 leading-relaxed">
            {INTRO.onBody}
          </p>
        </div>
      </div>

      {/* Indication de scroll */}
      {lit && (
        <button
          type="button"
          onClick={() =>
            document.getElementById("acte-1")?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Faire défiler"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/80 transition-colors animate-bounce"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}
    </section>
  );
}
