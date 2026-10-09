"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { CONCLUSION } from "./content";
import { getWhatsAppUrl } from "@/lib/utils";
import { quoteMessage } from "@/lib/whatsapp";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 5 — Conclusion : « Allumez votre projet » (Call-To-Action).
 * Bloc de conversion avec bouton néon à fort impact visuel (redirection WhatsApp
 * pré-remplie, via le helper centralisé `quoteMessage`).
 */
export function CtaSection({ whatsapp }: { whatsapp: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cta-reveal", {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      aria-labelledby="cta-title"
      className="relative border-t border-white/5 overflow-hidden"
    >
      {/* Halo de conclusion */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(700px 500px at 50% 100%, rgba(255,165,0,0.16), transparent 70%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
        <p className="cta-reveal text-xs uppercase tracking-[0.3em] text-[rgba(255,165,0,0.7)]">
          {CONCLUSION.kicker}
        </p>
        <h2
          id="cta-title"
          className="cta-reveal mt-3 font-display text-3xl md:text-5xl font-bold leading-tight histoire-neon-text"
        >
          {CONCLUSION.title}
        </h2>

        <p className="cta-reveal mt-6 text-base md:text-lg text-white/80 leading-relaxed">
          {CONCLUSION.body}
        </p>

        <p className="cta-reveal mt-8 font-display text-xl md:text-2xl font-semibold">
          {CONCLUSION.welcome}
        </p>
        <p className="cta-reveal mt-2 text-sm md:text-base tracking-wide text-white/70">
          {CONCLUSION.tagline}
        </p>

        <div className="cta-reveal mt-10">
          <a
            href={getWhatsAppUrl(whatsapp, quoteMessage("Projet sur-mesure"))}
            target="_blank"
            rel="noopener noreferrer"
            className="histoire-neon-btn inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-semibold text-base md:text-lg min-h-[56px]"
          >
            {CONCLUSION.cta}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
