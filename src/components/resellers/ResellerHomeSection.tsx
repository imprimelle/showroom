import Link from "next/link";
import { Link2, Store, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Section « Devenir partenaire » sur la page d'accueil — compacte.
 * Deux cartes horizontales (icône + titre + accroche + flèche) renvoyant vers /revendeurs.
 */
export function ResellerHomeSection() {
  return (
    <section className="bg-[var(--color-bg-secondary)] border-y border-[var(--color-border-default)]">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <SectionHeader
          align="left"
          eyebrow="Programme partenaires"
          title="Devenir partenaire"
          subtitle="Recommandez ou exposez nos produits."
          eyebrowKey="home.resellers.eyebrow"
          titleKey="home.resellers.title"
          subtitleKey="home.resellers.subtitle"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Affiliation */}
          <Link
            href="/revendeurs"
            className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]">
              <Link2 className="h-5 w-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display text-base font-bold text-[var(--color-text-primary)]">
                Devenir affilié
              </span>
              <span className="block mt-0.5 text-sm text-[var(--color-text-secondary)]">
                Commission jusqu&apos;à 15 % sur chaque vente
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-text-primary)]" />
          </Link>

          {/* Point de vente */}
          <Link
            href="/revendeurs"
            className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]">
              <Store className="h-5 w-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display text-base font-bold text-[var(--color-text-primary)]">
                Point de vente agréé
              </span>
              <span className="block mt-0.5 text-sm text-[var(--color-text-secondary)]">
                Exposez nos produits dans votre boutique
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-text-primary)]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
