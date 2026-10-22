import type { Metadata } from "next";
import { getPublicStores } from "@/lib/resellers";
import { ResellerApplyForm } from "@/components/resellers/ResellerApplyForm";
import StoresMap from "@/components/resellers/StoresMap";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MapPin, Link2, Store, Users, Wallet, Truck, Megaphone, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Devenir revendeur — Affiliation & points de vente",
  description:
    "Devenez affilié Imprimelle ou point de vente agréé : enseignes lumineuses et mobilier lumineux sur mesure. Commissions jusqu'à 15 %, lien d'affiliation unique, code promo.",
};

const AFFILIATE_TIERS = [
  { level: "Standard", rate: "8 %", cond: "Tout nouvel affilié inscrit" },
  { level: "Performance", rate: "10 %", cond: "≥ 3 ventes ou 1 000 000 FCFA / mois" },
  { level: "VIP / Partenaire", rate: "12–15 %", cond: "Prescripteurs réguliers & grands apporteurs" },
];

const STORE_MODELS = [
  {
    icon: Store,
    title: "Showroom Exposeur",
    tag: "Recommandé",
    desc: "Déposez 1 à 3 pièces phares dans votre lieu à fort passage. Vous exposez, présentez le catalogue et prenez la commande — nous livrons le client final.",
    commission: "12–15 % par commande",
  },
  {
    icon: Truck,
    title: "Achat-Revente B2B",
    tag: "Distributeur",
    desc: "Achetez du stock et revendez en direct. Remise B2B sur le prix public conseillé, avec une commande minimale initiale.",
    commission: "Remise 25–35 % sur PPC",
  },
  {
    icon: Sparkles,
    title: "Corner / Espace dédié",
    tag: "Grande enseigne",
    desc: "Aménagement d'un présentoir complet au sein d'une grande enseigne partenaire.",
    commission: "Sur mesure",
  },
];

const COMPARATOR: { critere: string; affiliation: string; showroom: string; b2b: string }[] = [
  { critere: "Cible", affiliation: "Influenceurs, créateurs, apporteurs web", showroom: "Showrooms déco, salons VIP, architectes", b2b: "Boutiques de mobilier, distributeurs" },
  { critere: "Investissement de départ", affiliation: "0 FCFA", showroom: "Coût de la pièce d'exposition", b2b: "Achat de stock" },
  { critere: "Marge / commission", affiliation: "8 à 15 %", showroom: "12 à 15 %", b2b: "Remise 25 à 35 %" },
  { critere: "Livraison & stock", affiliation: "Gérés par Imprimelle", showroom: "Gérés par Imprimelle", b2b: "Gérés par le revendeur" },
  { critere: "Bénéfice principal", affiliation: "Portée & scalabilité", showroom: "Réassurance & expérience", b2b: "Volume de vente direct" },
];

export default async function RevendeursPage() {
  const stores = await getPublicStores();

  return (
    <div className="pb-20">
      {/* ===== Hero ===== */}
      <section className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)]">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-amber)] font-semibold">
            Programme partenaires
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] mt-3 max-w-3xl">
            Rejoignez le réseau Imprimelle
          </h1>
          <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl">
            Deux façons de collaborer : devenez <strong className="text-[var(--color-text-primary)]">Affilié</strong> pour
            recommander nos produits en ligne, ou <strong className="text-[var(--color-text-primary)]">Point de vente
            agréé</strong> pour les exposer physiquement.
          </p>
        </div>
      </section>

      {/* ===== Deux options ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          align="left"
          eyebrow="Deux modèles"
          title="Choisissez votre collaboration"
          subtitle="Digital ou physique — à vous de choisir ce qui correspond le mieux à votre activité."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* Affiliation */}
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-6 flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)] flex items-center justify-center mb-4">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Devenir Affilié</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Recommandez Imprimelle à votre communauté et touchez une commission à chaque vente.
              Sans stock, sans coût fixe.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-primary)]">
              <li className="flex gap-2"><Megaphone className="w-4 h-4 text-[var(--color-accent-amber)] shrink-0 mt-0.5" /> Lien d&apos;affiliation unique <code className="text-xs bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">?ref=VOTRENOM</code></li>
              <li className="flex gap-2"><Wallet className="w-4 h-4 text-[var(--color-accent-amber)] shrink-0 mt-0.5" /> Code promo personnalisé (ex. −5 %) pour votre communauté</li>
              <li className="flex gap-2"><Users className="w-4 h-4 text-[var(--color-accent-amber)] shrink-0 mt-0.5" /> Commission de 8 % à 15 % selon votre niveau</li>
            </ul>
            <div className="mt-5 rounded-xl bg-[var(--color-bg-secondary)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">Grille de commission</p>
              <ul className="space-y-1.5">
                {AFFILIATE_TIERS.map((t) => (
                  <li key={t.level} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">{t.level} · <span className="text-[var(--color-text-tertiary)]">{t.cond}</span></span>
                    <span className="font-mono font-bold text-[var(--color-accent-amber)]">{t.rate}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Point de vente */}
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-6 flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)] flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Point de vente agréé</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Ancrez Imprimelle localement : vos clients voient et touchent le produit. Trois modèles
              de partenariat physique.
            </p>
            <ul className="mt-4 space-y-3">
              {STORE_MODELS.map((m) => (
                <li key={m.title} className="rounded-xl border border-[var(--color-border-default)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                      <m.icon className="w-4 h-4 text-[var(--color-accent-amber)]" /> {m.title}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full">{m.tag}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">{m.desc}</p>
                  <p className="mt-1.5 text-xs font-semibold text-[var(--color-accent-amber)]">{m.commission}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== Tableau comparatif ===== */}
      <section className="bg-[var(--color-bg-secondary)] border-y border-[var(--color-border-default)]">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <SectionHeader align="left" eyebrow="Comparer" title="Affiliation ou point de vente ?" subtitle="Le récapitulatif pour vous aider à décider." />
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-[var(--color-text-tertiary)] border-b border-[var(--color-border-strong)]">
                  <th className="py-3 pr-4 font-semibold">Critère</th>
                  <th className="py-3 pr-4 font-semibold">Affiliation</th>
                  <th className="py-3 pr-4 font-semibold">Showroom Exposeur</th>
                  <th className="py-3 font-semibold">Achat-Revente B2B</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATOR.map((row) => (
                  <tr key={row.critere} className="border-b border-[var(--color-border-default)]">
                    <td className="py-3 pr-4 font-semibold text-[var(--color-text-primary)]">{row.critere}</td>
                    <td className="py-3 pr-4 text-[var(--color-text-secondary)]">{row.affiliation}</td>
                    <td className="py-3 pr-4 text-[var(--color-text-secondary)]">{row.showroom}</td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{row.b2b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Carte des points de vente ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          align="left"
          eyebrow="Où nous trouver"
          title="Nos points de vente partenaires"
          subtitle="Retrouvez nos produits dans les boutiques et showrooms partenaires."
        />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {stores.length > 0 ? (
              <StoresMap stores={stores} />
            ) : (
              <div className="h-[360px] md:h-[440px] w-full rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center text-center px-6">
                <MapPin className="w-10 h-10 text-[var(--color-accent-amber)] mb-3" />
                <p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                  Devenez le premier point de vente partenaire
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-sm">
                  Aucun point de vente pour le moment. C&apos;est l&apos;occasion idéale d&apos;être le premier à
                  exposer nos produits.
                </p>
                <a href="#candidature" className="mt-4">
                  <Button variant="primary" size="sm">Devenir partenaire</Button>
                </a>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-3">
              {stores.length > 0 ? `${stores.length} point${stores.length > 1 ? "s" : ""} de vente` : "Aucun point de vente"}
            </h3>
            {stores.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                La carte affichera les boutiques partenaires dès qu&apos;elles seront agréées.
              </p>
            ) : (
              <ul className="space-y-3">
                {stores.map((s) => (
                  <li key={s.id} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-3">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.name}</p>
                    {s.city && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{s.city}{s.address ? ` — ${s.address}` : ""}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ===== Candidature ===== */}
      <section id="candidature" className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)]">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <SectionHeader
            align="center"
            eyebrow="Candidature"
            title="Rejoignez-nous"
            subtitle="Remplissez le formulaire, notre équipe vous recontacte rapidement."
          />
          <div className="mt-6">
            <ResellerApplyForm />
          </div>
        </div>
      </section>
    </div>
  );
}
