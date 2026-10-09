"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CONCLUSION } from "./content";
import { getWhatsAppUrl } from "@/lib/utils";
import { quoteMessage } from "@/lib/whatsapp";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 5 — Conclusion : bloc de conversion avec « Voir le catalogue » en
 * bas de page (vers /collection) et « Démarrer mon projet » (WhatsApp).
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
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="conclusion" ref={root} className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(800px 560px at 50% 70%, rgba(255,165,0,0.18), transparent 70%)" }}
      />

      <p className="cta-reveal relative text-xs uppercase tracking-[0.35em] text-[rgba(255,165,0,0.7)]">
        05 — À vous
      </p>
      <h2 className="cta-reveal relative mt-4 font-display font-black leading-[1.02] tracking-tight text-[clamp(2.5rem,8vw,6rem)] histoire-neon-text">
        {CONCLUSION.title}
      </h2>
      <p className="cta-reveal relative mt-6 max-w-xl text-base md:text-lg text-white/70">{CONCLUSION.line}</p>
      <p className="cta-reveal relative mt-6 font-display text-lg md:text-xl text-white/85">{CONCLUSION.welcome}</p>
      <p className="cta-reveal relative mt-2 text-sm md:text-base tracking-wide text-white/60">{CONCLUSION.tagline}</p>

      <div className="cta-reveal relative mt-12 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/collection"
          className="histoire-neon-btn inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-semibold text-base md:text-lg min-h-[56px]"
        >
          {CONCLUSION.catalog}
          <ArrowRight className="w-5 h-5" />
        </Link>
        <a
          href={getWhatsAppUrl(whatsapp, quoteMessage("Projet sur-mesure"))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 font-medium text-white/85 hover:text-white hover:border-white/40 transition-colors min-h-[56px]"
        >
          {CONCLUSION.project}
          <ArrowUpRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
