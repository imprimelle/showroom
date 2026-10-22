"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ResellerApplyForm } from "./ResellerApplyForm";
import type { ResellerType } from "@/types";

/**
 * Modal bottom-sheet : ouvre le formulaire de candidature depuis le bas.
 * `type` pré-sélectionne le parcours (affilié / point de vente) selon la carte cliquée.
 */
export function ResellerApplyModal({
  open,
  type,
  onClose,
}: {
  open: boolean;
  type: ResellerType;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={type === "store" ? "Candidature point de vente" : "Candidature affilié"}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-250 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`relative w-full md:max-w-xl bg-[var(--color-bg-primary)] rounded-t-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto overscroll-contain transition-transform duration-250 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Poignée + titre + fermeture */}
        <div className="sticky top-0 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-default)] px-5 py-4 z-10">
          <div className="mx-auto w-10 h-1 rounded-full bg-[var(--color-border-strong)] mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
              {type === "store" ? "Devenir point de vente agréé" : "Devenir affilié"}
            </h3>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 -mr-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <ResellerApplyForm initialType={type} onDone={onClose} />
        </div>
      </div>
    </div>
  );
}
