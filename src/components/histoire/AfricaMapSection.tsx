"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABIDJAN, AFRICA_COUNTRIES, ACTE_3, type AfricaCountry } from "./content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 4 — Acte 3 : « Rayonner depuis Abidjan sur toute l'Afrique ».
 * Carte vectorielle SVG interactive d'Afrique de l'Ouest : des impulsions
 * lumineuses partent d'Abidjan pour connecter les capitales de la sous-région ;
 * au survol d'un pays, un pop-up affiche les créations exportées.
 */
export function AfricaMapSection() {
  const root = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<AfricaCountry | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".africa-reveal", {
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

  const handleMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <section
      id="acte-3"
      ref={root}
      aria-labelledby="acte-3-title"
      className="relative border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <header className="max-w-3xl mb-12">
          <p className="africa-reveal text-xs uppercase tracking-[0.3em] text-[rgba(255,165,0,0.7)]">
            {ACTE_3.kicker}
          </p>
          <h2
            id="acte-3-title"
            className="africa-reveal mt-3 font-display text-2xl md:text-4xl font-bold leading-tight"
          >
            {ACTE_3.title}
          </h2>
          <p className="africa-reveal mt-5 text-base md:text-lg text-white/75 leading-relaxed">
            {ACTE_3.lead}
          </p>
        </header>

        <div className="africa-reveal relative rounded-2xl border border-white/10 bg-[var(--histoire-ink)] overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 820 560"
            className="w-full h-auto"
            onMouseMove={handleMove}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Grille de fond subtile */}
            <defs>
              <pattern id="africa-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="820" height="560" fill="url(#africa-grid)" />

            {/* Connexions Abidjan → capitales */}
            {AFRICA_COUNTRIES.map((c) => {
              const midX = (ABIDJAN.x + c.x) / 2;
              const midY = Math.min(ABIDJAN.y, c.y) - 60;
              return (
                <path
                  key={`link-${c.id}`}
                  d={`M ${ABIDJAN.x} ${ABIDJAN.y} Q ${midX} ${midY} ${c.x} ${c.y}`}
                  fill="none"
                  stroke="rgba(255,165,0,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="5 7"
                  opacity={hovered?.id === c.id ? 0.9 : 0.5}
                  style={{ transition: "opacity .3s ease" }}
                >
                  <animate attributeName="stroke-dashoffset" from="24" to="0" dur="2.4s" repeatCount="indefinite" />
                </path>
              );
            })}

            {/* Pays (polygones stylisés) */}
            {AFRICA_COUNTRIES.map((c) => (
              <g key={c.id}>
                <polygon
                  points={c.points}
                  fill={hovered?.id === c.id ? "rgba(255,165,0,0.22)" : "rgba(255,255,255,0.05)"}
                  stroke={hovered?.id === c.id ? "rgba(255,165,0,0.7)" : "rgba(255,255,255,0.16)"}
                  strokeWidth="1.5"
                  style={{ transition: "fill .3s ease, stroke .3s ease" }}
                  onMouseEnter={() => setHovered(c)}
                >
                  <title>{`${c.name} — ${c.exports}`}</title>
                </polygon>
                <text
                  x={c.x}
                  y={c.y + 26}
                  textAnchor="middle"
                  fontSize="13"
                  fill="rgba(255,255,255,0.55)"
                  fontFamily="'Inter', sans-serif"
                  pointerEvents="none"
                >
                  {c.name}
                </text>
              </g>
            ))}

            {/* Capitales : impulsions lumineuses */}
            {AFRICA_COUNTRIES.map((c, i) => (
              <g key={`cap-${c.id}`}>
                <circle className="histoire-ring" cx={c.x} cy={c.y} r="7" fill="none" stroke="#ffa500" strokeWidth="1.5" style={{ animationDelay: `${i * 0.4}s` }} />
                <circle cx={c.x} cy={c.y} r="3.5" fill="#ffb733" />
              </g>
            ))}

            {/* Abidjan — siège */}
            <g>
              <circle className="histoire-ring" cx={ABIDJAN.x} cy={ABIDJAN.y} r="9" fill="none" stroke="#ffa500" strokeWidth="2" />
              <circle cx={ABIDJAN.x} cy={ABIDJAN.y} r="6" fill="#ffa500" />
              <text x={ABIDJAN.x} y={ABIDJAN.y - 18} textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffc24b" fontFamily="'Inter', sans-serif">
                Abidjan
              </text>
              <text x={ABIDJAN.x} y={ABIDJAN.y + 34} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)" fontFamily="'Inter', sans-serif">
                Siège &amp; manufacture
              </text>
            </g>
          </svg>

          {/* Pop-up au survol d'un pays */}
          {hovered && (
            <div
              className="pointer-events-none absolute z-10 max-w-[240px] rounded-xl border border-[rgba(255,165,0,0.4)] bg-[#0a0a0c]/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -110%)",
              }}
            >
              <p className="text-sm font-semibold text-[var(--neon-gold)]">
                {hovered.capital} — {hovered.name}
              </p>
              <p className="mt-1 text-xs text-white/70 leading-snug">{hovered.exports}</p>
            </div>
          )}
        </div>

        <p className="africa-reveal mt-8 text-white/75 leading-relaxed max-w-3xl">{ACTE_3.body}</p>
        <p className="africa-reveal mt-4 font-display text-lg md:text-xl font-semibold histoire-neon-text">
          {ACTE_3.belief}
        </p>
      </div>
    </section>
  );
}
