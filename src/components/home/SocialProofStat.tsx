"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compteur de preuve sociale (ex. « +1240 ») : compte de 0 jusqu'à la valeur
 * quand le bloc entre dans le viewport (IntersectionObserver), avec un
 * easing easeOutCubic. Le préfixe non numérique (ex. « + ») est conservé,
 * le nombre est formaté en fr-FR (espace des milliers).
 */
function parseStat(raw: string): { prefix: string; value: number; suffix: string } {
  const m = raw.match(/([^0-9]*)([0-9][0-9\s\u00a0]*)(.*)/);
  if (!m) return { prefix: "", value: 0, suffix: raw };
  const digits = m[2].replace(/[\s\u00a0]/g, "");
  const value = parseInt(digits, 10);
  return { prefix: m[1], value: Number.isFinite(value) ? value : 0, suffix: m[3] };
}

export function SocialProofStat({ value, label }: { value: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  const { prefix, value: target, suffix } = parseStat(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || target <= 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const ease = (t: number) => 1 - Math.pow(1 - t, 3);
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            setDisplay(Math.round(ease(p) * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="flex items-baseline gap-2.5">
      <span className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-accent-orange)]">
        {prefix}
        {display.toLocaleString("fr-FR")}
        {suffix}
      </span>
      {label ? (
        <span className="text-base md:text-lg font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
