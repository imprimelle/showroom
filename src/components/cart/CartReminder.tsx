"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { useCartStore } from "@/stores/cart";

const DISMISS_KEY = "showroom_cart_reminder_dismissed";

/**
 * Rappel de panier en attente : si le visiteur revient avec des articles
 * (panier persistant) sans être déjà sur le panier/checkout, affiche une
 * bulle discrète après quelques secondes. Une seule fois par session.
 */
export function CartReminder() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    if (pathname.startsWith("/panier") || pathname.startsWith("/checkout")) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setShow(true), 3500);
    return () => clearTimeout(t);
  }, [items.length, pathname]);

  const dismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
        >
          <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-4 py-3 shadow-xl">
            <ShoppingCart className="h-5 w-5 shrink-0 text-[var(--color-accent-amber)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {count} article{count > 1 ? "s" : ""} en attente
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">Votre panier a été conservé.</p>
            </div>
            <Link
              href="/panier"
              className="shrink-0 rounded-full bg-[var(--color-text-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg-primary)]"
            >
              Voir
            </Link>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              className="shrink-0 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
