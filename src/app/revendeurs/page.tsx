import type { Metadata } from "next";
import { getShowcaseSettings } from "@/lib/settings";
import { ResellerChoice } from "@/components/resellers/ResellerChoice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isVideoUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Devenir revendeur — Affiliation & points de vente",
  description:
    "Devenez affilié Imprimelle ou point de vente agréé : enseignes lumineuses et mobilier lumineux sur mesure. Commissions jusqu'à 15 %, lien d'affiliation unique, code promo.",
};

const COMPARATOR: { critere: string; affiliation: string; showroom: string; b2b: string }[] = [
  { critere: "Cible", affiliation: "Influenceurs, créateurs, apporteurs web", showroom: "Showrooms déco, salons VIP, architectes", b2b: "Boutiques de mobilier, distributeurs" },
  { critere: "Investissement de départ", affiliation: "0 FCFA", showroom: "Coût de la pièce d'exposition", b2b: "Achat de stock" },
  { critere: "Marge / commission", affiliation: "8 à 15 %", showroom: "12 à 15 %", b2b: "Remise 25 à 35 %" },
  { critere: "Livraison & stock", affiliation: "Gérés par Imprimelle", showroom: "Gérés par Imprimelle", b2b: "Gérés par le revendeur" },
  { critere: "Bénéfice principal", affiliation: "Portée & scalabilité", showroom: "Réassurance & expérience", b2b: "Volume de vente direct" },
];

export default async function RevendeursPage() {
  const settings = await getShowcaseSettings();
  const resellers = settings.resellers;
  const videoUrl = resellers?.hero_video_url;
  const hasVideo = !!videoUrl && isVideoUrl(videoUrl);

  const heroTitle = resellers?.hero_title || "Rejoignez le réseau Imprimelle";
  const heroSubtitle =
    resellers?.hero_subtitle ||
    "Deux façons de collaborer : devenez Affilié pour recommander nos produits en ligne, ou Point de vente agréé pour les exposer physiquement.";

  return (
    <div className="pb-20">
      {/* ===== Hero (vidéo éditable via Réglages → Revendeurs) ===== */}
      <section className="relative w-full overflow-hidden bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)]">
        {hasVideo ? (
          <div className="relative aspect-[3/4] md:aspect-auto md:h-[62vh] md:min-h-[420px]">
            <video
              src={videoUrl}
              poster={resellers?.hero_poster || undefined}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="max-w-7xl mx-auto px-4 pb-10 md:pb-14">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-amber)] font-semibold drop-shadow-sm">
                  Programme partenaires
                </p>
                <h1 className="font-display text-3xl md:text-5xl font-bold text-white mt-3 max-w-3xl drop-shadow-sm">
                  {heroTitle}
                </h1>
                <p className="mt-4 text-base md:text-lg text-white/85 max-w-2xl">{heroSubtitle}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-amber)] font-semibold">
              Programme partenaires
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] mt-3 max-w-3xl">
              {heroTitle}
            </h1>
            <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl">
              {heroSubtitle}
            </p>
          </div>
        )}
      </section>

      {/* ===== Choisissez votre collaboration (cartes compactes + modal) ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          align="left"
          eyebrow="Deux modèles"
          title="Choisissez votre collaboration"
          subtitle="Digital ou physique — à vous de choisir ce qui correspond le mieux à votre activité."
        />
        <ResellerChoice />
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
    </div>
  );
}
