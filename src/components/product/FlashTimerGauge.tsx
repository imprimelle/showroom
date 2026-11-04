"use client";
import { useEffect, useState } from "react";

interface ParsedTime {
  h: number;
  m: number;
}

/** Parse « HH:MM » (24 h). null si invalide. */
function parseEndTime(endTime?: string | null): ParsedTime | null {
  const s = endTime?.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s || "");
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h >= 24 || min < 0 || min >= 60) return null;
  return { h, m: min };
}

const DAY_MS = 24 * 3600 * 1000;

/**
 * Jauge de temps de la vente flash : une barre de progression (style groupage,
 * dégradé multicolore + reflet va-et-vient) qui se vide à mesure que le temps
 * restant s'écoule, accompagnée du compte à rebours « HH:MM:SS ».
 * Le cycle se réinitialise chaque jour à l'heure de fin configurée.
 */
export function FlashTimerGauge({
  endTime,
  className,
}: {
  endTime?: string | null;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = parseEndTime(endTime) ?? { h: 23, m: 59 };
    const compute = () => {
      const now = new Date();
      const t = new Date(now);
      t.setHours(target.h, target.m, 0, 0);
      if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
      setRemaining(t.getTime() - now.getTime());
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, "0");
  // Jauge « remplie à l'approche de la fin » : plus il reste peu de temps,
  // plus la barre est remplie (spécifique à la vente flash, inverse du groupage).
  const fraction = remaining == null ? 0 : Math.max(0, Math.min(1, 1 - remaining / DAY_MS));
  const total = remaining == null ? 0 : Math.max(0, Math.floor(remaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/25">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${fraction * 100}%`,
            background: "linear-gradient(90deg, #FFA500, #F97316, #F59E0B, #22C55E, #0EA5E9)",
          }}
        />
        <span className="groupage-sheen absolute inset-y-0 left-0 w-1/4 rounded-full bg-white/50 blur-[3px]" />
      </div>
      <span className="shrink-0 font-mono text-sm font-bold text-white tabular-nums">
        {remaining == null ? "--:--:--" : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </span>
    </div>
  );
}
