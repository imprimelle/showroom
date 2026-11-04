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

/**
 * Compte à rebours quotidien « HH:MM:SS » jusqu'à l'heure de fin configurée.
 * Se renouvelle automatiquement chaque jour (vente flash « chaque jour »).
 * Rendu côté client uniquement (le premier rendu affiche un placeholder pour
 * éviter tout écart d'hydratation serveur/client).
 */
export function FlashCountdown({
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

  if (remaining == null) {
    return <span className={className}>--:--:--</span>;
  }

  const total = Math.max(0, Math.floor(remaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className={className}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
