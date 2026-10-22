import Link from "next/link";
import { Handshake, Link2, Store, Wallet, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";

/**
 * Section « Devenir revendeur » sur la page d'accueil.
 * Présente les deux canaux (affiliation + point de vente) et renvoie vers /revendeurs.
 */
export function ResellerHomeSection() {
  return (
    <section className="bg-[var(--color-bg-secondary)] border-y border-[var(--color-border-default)]">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          align="left"
          eyebrow="Programme partenaires"
          title="Devenir revendeur"
          subtitle="Recommandez nos produits en ligne ou exposez-les dans votre boutique."
          eyebrowKey="home.resellers.eyebrow"
          titleKey="home.resellers.title"
          subtitleKey="home.resellers.subtitle"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* Affiliation */}
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-6 flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)] flex items-center justify-center mb-4">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">Devenir Affilié</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Partagez votre lien unique et votre code promo. Touchez une commission à chaque vente,
              sans stock ni coût.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-text-primary)]">
              <li className="flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--color-accent-amber)]" /> Commission de 8 % à 15 %</li>
              <li className="flex items-center gap-2"><Link2 className="w-4 h-4 text-[var(--color-accent-amber)]" /> Lien <code className="text-xs bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">?ref=VOTRENOM</code></li>
            </ul>
            <Link href="/revendeurs" className="mt-auto pt-5 block">
              <Button variant="secondary" className="w-full">En savoir plus</Button>
            </Link>
          </div>

          {/* Point de vente */}
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-6 flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)] flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">Point de vente agréé</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Exposez nos enseignes et mobilier lumineux dans votre showroom ou boutique.
              Vos clients voient et touchent le produit.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-text-primary)]">
              <li className="flex items-center gap-2"><Handshake className="w-4 h-4 text-[var(--color-accent-amber)]" /> Showroom Exposeur · B2B · Corner</li>
              <li className="flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--color-accent-amber)]" /> Commission 12–15 % ou remise B2B 25–35 %</li>
            </ul>
            <Link href="/revendeurs#candidature" className="mt-auto pt-5 block">
              <Button variant="primary" className="w-full">Devenir partenaire <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
