"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Étape 2.4 — L'allumage final (toggle Jour / Nuit).
 * Devanture de restaurant / salon passant de l'état « éteint » de jour à
 * « lumineux » de nuit, via un interrupteur à glissière (accessible au pouce).
 */
export function DayNightToggle() {
  const [night, setNight] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Scènes superposées (crossfade jour ↔ nuit) */}
      <div className="relative flex-1 overflow-hidden">
        <Scene
          type="day"
          className="absolute inset-0 transition-opacity duration-[1200ms]"
          style={{ opacity: night ? 0 : 1 }}
        />
        <Scene
          type="night"
          className="absolute inset-0 transition-opacity duration-[1200ms]"
          style={{ opacity: night ? 1 : 0 }}
        />
      </div>

      {/* Interrupteur Jour / Nuit */}
      <div className="shrink-0 px-6 pb-6 pt-2 flex items-center justify-center gap-3">
        <span className={cn("flex items-center gap-1.5 text-sm", !night ? "text-[var(--neon-gold)]" : "text-white/40")}>
          <Sun className="w-4 h-4" /> Jour
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={night}
          aria-label="Basculer entre le jour et la nuit"
          onClick={() => setNight((v) => !v)}
          className={cn(
            "relative w-16 h-9 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-amber)]",
            night ? "bg-[rgba(255,165,0,0.25)] border border-[var(--neon-amber)]" : "bg-white/10 border border-white/15"
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300",
              night
                ? "translate-x-7 bg-[var(--neon-amber)] text-black shadow-[0_0_14px_rgba(255,165,0,0.8)]"
                : "translate-x-0 bg-white/70 text-[#0a0a0c]"
            )}
          >
            {night ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </span>
        </button>
        <span className={cn("flex items-center gap-1.5 text-sm", night ? "text-[var(--neon-amber)]" : "text-white/40")}>
          <Moon className="w-4 h-4" /> Nuit
        </span>
      </div>
    </div>
  );
}

function Scene({ type, className, style }: { type: "day" | "night"; className?: string; style?: React.CSSProperties }) {
  const night = type === "night";
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${type}`} x1="0" y1="0" x2="0" y2="1">
          {night ? (
            <>
              <stop offset="0%" stopColor="#0b1030" />
              <stop offset="100%" stopColor="#1b2147" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#6fb3ea" />
              <stop offset="100%" stopColor="#cde6f7" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`facade-${type}`} x1="0" y1="0" x2="0" y2="1">
          {night ? (
            <>
              <stop offset="0%" stopColor="#1a1a22" />
              <stop offset="100%" stopColor="#12121a" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#f3e3d3" />
              <stop offset="100%" stopColor="#e6d2bd" />
            </>
          )}
        </linearGradient>
        <filter id={`neon-${type}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ciel */}
      <rect x="0" y="0" width="400" height="180" fill={`url(#sky-${type})`} />
      {night ? (
        <>
          {[[40, 40], [120, 70], [200, 30], [300, 60], [360, 90], [90, 110], [250, 95], [340, 30]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" opacity="0.9">
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <circle cx="330" cy="60" r="16" fill="#f5e9c8" opacity="0.9" />
        </>
      ) : (
        <circle cx="330" cy="60" r="22" fill="#ffe08a" />
      )}

      {/* Façade */}
      <rect x="0" y="180" width="400" height="220" fill={`url(#facade-${type})`} />

      {/* Enseigne IMPRIMELLE */}
      <g filter={night ? `url(#neon-${type})` : undefined}>
        <text
          x="200"
          y="220"
          textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight="800"
          fontSize="34"
          letterSpacing="2"
          fill={night ? "#ffa500" : "#3a2c1c"}
        >
          IMPRIMELLE
        </text>
      </g>

      {/* Auvent (rayures) */}
      <g>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={40 + i * 40}
            y={238}
            width="40"
            height="30"
            fill={i % 2 === 0 ? (night ? "#7a4d14" : "#ff8c00") : night ? "#3a2a12" : "#fff3e0"}
          />
        ))}
      </g>

      {/* Vitrine avec table lumineuse */}
      <rect x="70" y="280" width="180" height="90" rx="6" fill={night ? "#2a2016" : "#9bd0f2"} stroke={night ? "#ffa500" : "#6b4f2a"} strokeWidth="2" />
      <rect x="90" y="310" width="70" height="44" rx="3" fill={night ? "#ffb733" : "#7a5a36"} />
      {night && <rect x="90" y="310" width="70" height="44" rx="3" fill="#ffb733" opacity="0.4" filter={`url(#neon-${type})`} />}

      {/* Porte */}
      <rect x="270" y="280" width="70" height="90" rx="6" fill={night ? "#1c1c26" : "#8a5a2e"} stroke="#00000022" />
      <circle cx="328" cy="325" r="3" fill={night ? "#ffd27a" : "#4a2f18"} />

      {/* Lampadaire */}
      <g>
        <rect x="46" y="250" width="6" height="120" fill="#2b2b31" />
        <path d="M 36 250 Q 49 236 62 250" fill="none" stroke="#2b2b31" strokeWidth="4" />
        <circle cx="49" cy="252" r="6" fill={night ? "#ffd27a" : "#3a3a42"} />
        {night && (
          <circle cx="49" cy="252" r="20" fill="#ffd27a" opacity="0.25">
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    </svg>
  );
}
