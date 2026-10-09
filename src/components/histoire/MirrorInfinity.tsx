"use client";

import { useEffect, useRef } from "react";

/**
 * Étape 2.3 — La magie optique : miroir infini.
 * Canvas 2D qui simule la réflexion en profondeur (anneaux concentriques
 * lumineux qui s'enfoncent vers un point de fuite). L'effet réagit au curseur
 * (desktop) et oscille doucement sinon (mobile / absence de souris).
 */
export function MirrorInfinity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    const start = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let w = 0;
      let h = 0;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      const resize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        w = rect?.width || 480;
        h = rect?.height || 480;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      // Parallaxe : suivi du curseur sur le parent (desktop), sinon oscillation.
      let px = 0;
      let py = 0;
      const parent = canvas.parentElement;
      const onPointer = (e: PointerEvent) => {
        const rect = parent?.getBoundingClientRect();
        if (!rect) return;
        px = (e.clientX - rect.left) / rect.width - 0.5;
        py = (e.clientY - rect.top) / rect.height - 0.5;
      };
      parent?.addEventListener("pointermove", onPointer);

      const RINGS = 16;
      let t = 0;

      const draw = () => {
        if (disposed) return;
        t += 0.016;

        // Centre décalé par la parallaxe (borné) + légère oscillation d'ambiance
        const sway = Math.sin(t * 0.6) * 0.04;
        const cx = w / 2 + px * 46;
        const cy = h / 2 + py * 46 + sway * 20;

        // Fond
        ctx.fillStyle = "#0a0a0c";
        ctx.fillRect(0, 0, w, h);

        const maxR = Math.min(w, h) * 0.48;
        const pulse = 0.8 + 0.2 * Math.sin(t * 2.2);

        // Anneaux concentriques (de l'extérieur vers le centre lumineux)
        for (let i = RINGS; i >= 0; i--) {
          const k = i / RINGS; // 1 (extérieur) → 0 (centre)
          const r = maxR * (0.12 + 0.88 * k * k);
          const alpha = (1 - k) * 0.85 * pulse;
          const width = 1.5 + (1 - k) * 3.5;

          ctx.beginPath();
          ctx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.16);
          ctx.strokeStyle = `rgba(255, ${140 + Math.floor(80 * (1 - k))}, ${20 + Math.floor(40 * (1 - k))}, ${alpha})`;
          ctx.lineWidth = width;
          ctx.shadowColor = "rgba(255,165,0,0.9)";
          ctx.shadowBlur = (1 - k) * 26;
          ctx.stroke();
        }

        // Noyau lumineux central
        const core = maxR * 0.1;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, core);
        g.addColorStop(0, "rgba(255, 210, 130, 0.95)");
        g.addColorStop(0.5, "rgba(255, 165, 0, 0.55)");
        g.addColorStop(1, "rgba(255, 165, 0, 0)");
        ctx.fillStyle = g;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx, cy, core, 0, Math.PI * 2);
        ctx.fill();

        raf = requestAnimationFrame(draw);
      };

      raf = requestAnimationFrame(draw);

      const onResize = () => resize();
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        parent?.removeEventListener("pointermove", onPointer);
      };
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();
        start();
      },
      { rootMargin: "200px" }
    );
    observer.observe(canvas);

    return () => {
      disposed = true;
      observer.disconnect();
      cleanup?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}
