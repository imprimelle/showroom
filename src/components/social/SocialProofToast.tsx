"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { imgProxyUrl } from "@/lib/images";
import type { SocialProofEntry } from "@/types";

interface SocialProofToastProps {
  enabled: boolean;
  entries: SocialProofEntry[];
  products: { name: string; image_url: string | null }[];
}

/** Délais aléatoires possibles (minutes) entre deux notifications. */
const DELAYS_MIN = [2, 4, 8];
/** Durée d'affichage d'une notification avant disparition. */
const DISPLAY_MS = 5000;

interface ActiveToast {
  entry: SocialProofEntry;
  product: { name: string; image_url: string | null };
}

/**
 * Preuve sociale : à intervalle aléatoire (2 / 4 / 8 min), affiche une
 * notification « [Nom] ([drapeau]) vient de commander [produit] » en haut,
 * par-dessus la barre sticky. Disparaît automatiquement après quelques secondes.
 */
export function SocialProofToast({ enabled, entries, products }: SocialProofToastProps) {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  useEffect(() => {
    if (!enabled || entries.length === 0 || products.length === 0) return;

    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showNext = () => {
      if (cancelled) return;
      const delay = DELAYS_MIN[Math.floor(Math.random() * DELAYS_MIN.length)] * 60_000;
      showTimer = setTimeout(() => {
        if (cancelled) return;
        const entry = entries[Math.floor(Math.random() * entries.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        setToast({ entry, product });
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setToast(null);
          showNext();
        }, DISPLAY_MS);
      }, delay);
    };

    showNext();

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [enabled, entries, products]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-2 pointer-events-none"
        >
          <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-xl">
            {toast.product.image_url ? (
              <img
                src={imgProxyUrl(toast.product.image_url, 80, 107)}
                alt=""
                className="h-11 aspect-[4/3] shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="h-11 aspect-[4/3] shrink-0 rounded-md bg-[var(--color-bg-tertiary)]" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
                {toast.entry.flag} {toast.entry.name} · {toast.entry.country}
              </p>
              <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                vient de commander « {toast.product.name} »
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
