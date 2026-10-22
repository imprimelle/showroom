"use client";

import { useState } from "react";
import { Link2, Store, ArrowRight } from "lucide-react";
import { ResellerApplyModal } from "./ResellerApplyModal";
import type { ResellerType } from "@/types";

/**
 * Section « Choisissez votre collaboration » : deux cartes compactes.
 * Chaque carte a un bouton qui ouvre le formulaire de candidature dans un modal
 * bottom-sheet pré-rempli pour le parcours choisi.
 */
export function ResellerChoice() {
  const [modal, setModal] = useState<ResellerType | null>(null);

  const cards: {
    type: ResellerType;
    icon: React.ElementType;
    title: string;
    desc: string;
    cta: string;
    primary?: boolean;
  }[] = [
    {
      type: "affiliate",
      icon: Link2,
      title: "Devenir Affilié",
      desc: "Un lien unique, un code promo, et une commission de 8 à 15 % à chaque vente. Sans stock.",
      cta: "Devenir affilié",
    },
    {
      type: "store",
      icon: Store,
      title: "Point de vente agréé",
      desc: "Exposez nos produits dans votre boutique ou showroom. Commission 12–15 % ou remise B2B.",
      cta: "Devenir point de vente",
      primary: true,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.type}
              className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-6 flex flex-col"
            >
              <div className="w-11 h-11 rounded-2xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">{c.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{c.desc}</p>
              <button
                onClick={() => setModal(c.type)}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold min-h-[46px] px-6 text-sm transition-colors ${
                  c.primary
                    ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:bg-[#2A2A2A]"
                    : "border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                }`}
              >
                {c.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <ResellerApplyModal
        open={modal !== null}
        type={modal ?? "affiliate"}
        onClose={() => setModal(null)}
      />
    </>
  );
}
