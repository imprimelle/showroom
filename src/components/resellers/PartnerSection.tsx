import Link from "next/link";
import { Link2, Store, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import StoresMap from "./StoresMap";
import { getPublicStores, getAffiliateCount, AFFILIATE_BASE_COUNT } from "@/lib/resellers";

/**
 * Section unifiée « Partenaires » (fusionne « Devenir partenaire » + « Où nous trouver ») :
 *   - Carte « Devenir affilié » avec compteur d'affiliés (base + réel).
 *   - Carte « Point de vente agréé ».
 *   - Carte des points de vente publiés (Leaflet).
 * Les deux cartes renvoient vers la section correspondante de /revendeurs (ancre).
 */
export async function PartnerSection() {
  const [stores, affiliateCount] = await Promise.all([getPublicStores(), getAffiliateCount()]);
  const totalAffiliates = AFFILIATE_BASE_COUNT + affiliateCount;

  return (
    <section className="border-y border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <SectionHeader
          align="left"
          eyebrow="Partenaires"
          title="Devenir partenaire"
          subtitle="Recommandez nos produits en ligne ou exposez-les dans votre boutique."
          eyebrowKey="home.partners.eyebrow"
          titleKey="home.partners.title"
          subtitleKey="home.partners.subtitle"
        />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Affilié */}
          <Link
            href="/revendeurs#affiliation"
            className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 transition-all hover:border-[var(--color-border-strong)] hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]">
              <Link2 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold text-[var(--color-text-primary)]">
                Devenir affilié
              </span>
              <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">
                Commission jusqu&apos;à 15 % sur chaque vente
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-center">
              <span className="font-display text-2xl font-extrabold leading-none text-[var(--color-accent-orange)]">
                +{totalAffiliates}
              </span>
              <span className="mt-1 text-[10px] font-medium text-[var(--color-text-tertiary)]">affiliés</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-text-primary)]" />
          </Link>

          {/* Point de vente agréé */}
          <Link
            href="/revendeurs#point-de-vente"
            className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 transition-all hover:border-[var(--color-border-strong)] hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]">
              <Store className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold text-[var(--color-text-primary)]">
                Point de vente agréé
              </span>
              <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">
                Exposez nos produits dans votre boutique
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-text-primary)]" />
          </Link>
        </div>

        {/* Carte des points de vente publiés */}
        {stores.length > 0 && (
          <div className="mt-6">
            <StoresMap stores={stores} />
          </div>
        )}
      </div>
    </section>
  );
}
