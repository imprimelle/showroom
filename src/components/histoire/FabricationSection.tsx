"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ACTE_2 } from "./content";
import { WireframeTable } from "./WireframeTable";
import { MirrorInfinity } from "./MirrorInfinity";
import { DayNightToggle } from "./DayNightToggle";
import { CncCutting } from "./CncCutting";

gsap.registerPlugin(ScrollTrigger);

const STEP_VISUALS: Record<string, ReactNode> = {
  conception: <WireframeTable />,
  decoupe: <CncCutting />,
  miroir: <MirrorInfinity />,
  allumage: <DayNightToggle />,
};

/**
 * Section 3 — La fabrication : défilement horizontal « pinned » sur desktop
 * (le scroll fait défiler les 4 étapes latéralement), empilement vertical sur
 * mobile avec révélation au scroll.
 */
export function FabricationSection() {
  const root = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".fab-head > *", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const track = trackRef.current;
        const pin = pinRef.current;
        if (!track || !pin) return;
        const getAmount = () => track.scrollWidth - window.innerWidth;
        gsap.to(track, {
          x: () => -getAmount(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => "+=" + getAmount(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      });

      mm.add("(max-width: 1023px)", () => {
        gsap.from(".fab-panel", {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: { trigger: trackRef.current, start: "top 78%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="acte-2" ref={root} className="relative">
      <div className="fab-head max-w-2xl px-6 pt-24 pb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-[rgba(255,165,0,0.7)]">{ACTE_2.kicker}</p>
        <h2 className="mt-4 font-display font-black leading-[1.02] tracking-tight text-[clamp(2rem,6vw,4rem)]">
          {ACTE_2.title}
        </h2>
      </div>

      <div ref={pinRef} className="lg:h-screen lg:overflow-hidden">
        <div ref={trackRef} className="flex flex-col lg:flex-row lg:h-full">
          {ACTE_2.steps.map((step, i) => (
            <div
              key={step.id}
              className="fab-panel relative lg:w-screen lg:h-full lg:shrink-0 flex items-center px-6 py-16 lg:py-0"
            >
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full max-w-6xl mx-auto">
                <div className="max-w-xl">
                  <span className="font-display font-black leading-none text-[clamp(4rem,9vw,7.5rem)] text-white/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 font-display font-bold text-[clamp(1.75rem,4vw,3rem)] leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-white/60 text-lg">{step.line}</p>
                </div>

                <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl border border-white/10 bg-[var(--histoire-ink)] overflow-hidden">
                  {STEP_VISUALS[step.id]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
