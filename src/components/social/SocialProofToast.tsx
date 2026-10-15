"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { imgProxyUrl } from "@/lib/images";
import type { SocialProofEntry } from "@/types";

interface SocialProofProduct {
  name: string;
  image_url: string | null;
  slug: string;
  has_groupage: boolean;
}

interface SocialProofToastProps {
  enabled: boolean;
  entries: SocialProofEntry[];
  products: SocialProofProduct[];
  /** Délai (s) avant la 1re notification lors d'une première visite. */
  firstDelaySeconds: number;
  /** Intervalle minimum (minutes) entre deux notifications. */
  minMinutes: number;
  /** Intervalle maximum (minutes) entre deux notifications. */
  maxMinutes: number;
  /** Durée d'affichage d'une notification (s). */
  displaySeconds: number;
}

type ToastAction = "commande" | "groupage";

interface ActiveToast {
  entry: SocialProofEntry;
  product: SocialProofProduct;
  action: ToastAction;
}

/** Clé localStorage marquant qu'une première visite a déjà eu lieu. */
const FIRST_VISIT_KEY = "showroom_sp_first_visit";

/**
 * Preuve sociale : notifications « [Nom] ([drapeau]) vient de commander [produit] »
 * ou « … a rejoint le groupage [produit] », à intervalles aléatoires configurables.
 * La 1re notification d'une première visite apparaît après `firstDelaySeconds`.
 * Le clic ouvre la fiche produit (groupage pré-sélectionné si éligible).
 */
export function SocialProofToast({
  enabled,
  entries,
  products,
  firstDelaySeconds,
  minMinutes,
  maxMinutes,
  displaySeconds,
}: SocialProofToastProps) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const realEventsRef = useRef<ActiveToast[]>([]);

  // Récupère les commandes réelles récentes (preuve sociale authentique) et les
  // apparie aux produits publiés (pour l'image + le lien de la fiche).
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch("/api/social-proof")
      .then((r) => r.json())
      .then((d) => {
        if (!active || !Array.isArray(d?.orders)) return;
        const events: ActiveToast[] = [];
        for (const o of d.orders) {
          const product = products.find((p) => p.name === o.product_name);
          if (!product) continue;
          events.push({
            entry: { name: o.name, country: o.country, flag: o.flag },
            product,
            action: "commande",
          });
        }
        realEventsRef.current = events;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled, products]);

  useEffect(() => {
    if (!enabled || entries.length === 0 || products.length === 0) return;

    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    // Détection première visite (localStorage — persiste par navigateur).
    let isFirstVisit = false;
    try {
      isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);
      localStorage.setItem(FIRST_VISIT_KEY, "1");
    } catch {
      /* localStorage indisponible */
    }

    const randomDelayMs = () => {
      const min = Math.max(1, minMinutes);
      const max = Math.max(min, maxMinutes);
      return (min + Math.floor(Math.random() * (max - min + 1))) * 60_000;
    };

    const showNext = (first: boolean) => {
      if (cancelled) return;
      const delay = first ? firstDelaySeconds * 1000 : randomDelayMs();
      showTimer = setTimeout(() => {
        if (cancelled) return;
        // Priorise une commande réelle si disponible (60 % des cas).
        if (realEventsRef.current.length > 0 && Math.random() < 0.6) {
          const ev = realEventsRef.current[Math.floor(Math.random() * realEventsRef.current.length)];
          setToast(ev);
        } else {
          const product = products[Math.floor(Math.random() * products.length)];
          const entry = entries[Math.floor(Math.random() * entries.length)];
          // Message groupage uniquement pour les produits éligibles (50 %).
          const action: ToastAction =
            product.has_groupage && Math.random() < 0.5 ? "groupage" : "commande";
          setToast({ entry, product, action });
        }
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setToast(null);
          showNext(false);
        }, displaySeconds * 1000);
      }, delay);
    };

    showNext(isFirstVisit);

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [enabled, entries, products, firstDelaySeconds, minMinutes, maxMinutes, displaySeconds]);

  const actionText = toast?.action === "groupage" ? "a rejoint le groupage" : "vient de commander";
  const href = toast
    ? toast.action === "groupage"
      ? `/collection/${toast.product.slug}?groupage=1`
      : `/collection/${toast.product.slug}`
    : "#";

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 z-[70] flex justify-center px-3 pt-2"
          style={{ top: "var(--topbar-height)" }}
        >
          <a
            href={href}
            className="flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-xl transition-opacity hover:opacity-95"
          >
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
                {actionText} « {toast.product.name} »
              </p>
            </div>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
