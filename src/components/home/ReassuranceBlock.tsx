/**
 * Bloc « Preuve sociale + Réassurance » de la page d'accueil :
 *   1. Stat de preuve sociale animé (ex. « +1240 ») + libellé
 *      (« Business & Particulier »), puis titre (« Nous ont fait confiance »).
 *   2. Slider de logos clients (marquee CSS, défilement infini) — image uploadée
 *      via l'admin, sinon nom de l'entreprise en toutes lettres.
 *   3. Rangée de réassurance (3 items) sur fond orange : icônes blanches,
 *      texte blanc (titre en gras, sous-titre en graisse normale).
 *
 * Contenu piloté par les réglages admin (`home.social_proof_stat`,
 * `home.social_proof_label`, `home.reassurance_title`, `home.logos`,
 * `home.reassurance`). Les icônes sont fixes et mappées par position
 * (1 = camion, 2 = usine, 3 = bouclier).
 */

import type { ReactNode } from "react";
import type { ClientLogo } from "@/types";
import { SocialProofStat } from "./SocialProofStat";

const TruckIcon = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 md:h-7 md:w-7"
    aria-hidden="true"
  >
    <path d="M2 15h22v16H2z" />
    <path d="M24 19h5l6 7v5H24z" />
    <circle cx="10" cy="34" r="3.5" />
    <circle cx="34" cy="34" r="3.5" />
    <path d="M2 38h44" />
  </svg>
);

const FactoryIcon = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 md:h-7 md:w-7"
    aria-hidden="true"
  >
    <path d="M5 40h38" />
    <path d="M9 40V28h9v12" />
    <path d="M18 40V22h14v18" />
    <path d="M32 40V28h7v12" />
    <path d="M21 22v-5h5v5" />
    <path d="M22 15c-1.5-.5-2.5-1.8-4-2" />
    <path d="M23 12c-1-.4-2-1.4-3-1.4" />
    <path d="M13 31h3v4h-3z" />
    <path d="M22 29h5v6h-5z" />
    <path d="M33 31h3v4h-3z" />
  </svg>
);

const ShieldIcon = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 md:h-7 md:w-7"
    aria-hidden="true"
  >
    <path d="M24 3l15 5.5V21c0 11.5-6.5 18.5-15 24C15.5 39.5 9 32.5 9 21V8.5z" />
    <path d="M17 24l5 5 9-10" />
  </svg>
);

const ILLUSTRATIONS: ReactNode[] = [TruckIcon, FactoryIcon, ShieldIcon];

export interface ReassuranceItem {
  title: string;
  subtitle?: string | null;
}

export function ReassuranceBlock({
  stat = "+1240",
  label = "Business & Particulier",
  title = "Nous ont fait confiance",
  items,
  logos,
}: {
  stat?: string;
  label?: string;
  title?: string;
  items?: ReassuranceItem[];
  logos?: ClientLogo[];
}) {
  const resolvedItems: ReassuranceItem[] =
    items && items.length > 0
      ? items
      : [
          { title: "Livraison", subtitle: "Partout" },
          { title: "Made in 🇨🇮", subtitle: "Fabrication locale" },
          { title: "Garantie", subtitle: "2 ans" },
        ];
  const resolvedLogos = (logos && logos.length > 0 ? logos : []).filter((l) => l.name || l.logo_url);

  return (
    <section className="border-y border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {/* 1. Preuve sociale : stat animé + titre */}
        <div className="flex flex-col items-center text-center">
          <SocialProofStat value={stat} label={label} />
          <h2 className="mt-2 font-display text-xl font-bold text-[var(--color-text-primary)] md:text-2xl">
            {title}
          </h2>
        </div>

        {/* 2. Slider de logos (marquee) */}
        {resolvedLogos.length > 0 && (
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="logo-marquee flex w-max items-center">
              {[...resolvedLogos, ...resolvedLogos].map((logo, i) => (
                <span
                  key={i}
                  className="flex h-12 items-center gap-2.5 whitespace-nowrap px-8 text-[var(--color-text-tertiary)]"
                >
                  {logo.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.logo_url}
                      alt={logo.name}
                      className="h-8 w-auto max-w-[140px] object-contain opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-9"
                    />
                  ) : (
                    <span className="text-base font-bold tracking-wide text-[var(--color-text-secondary)] md:text-lg">
                      {logo.name}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. Rangée réassurance — bande orange, icônes + texte blancs */}
        <div className="mt-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF9A1F] to-[#F5790A] px-4 py-5 md:px-6 md:py-6">
          <div className="flex flex-row items-stretch justify-between gap-3">
            {resolvedItems.map((item, i) => (
              <div key={i} className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
                <span className="shrink-0 text-white">
                  {ILLUSTRATIONS[i % ILLUSTRATIONS.length]}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-white">{item.title}</h3>
                  {item.subtitle && (
                    <p className="truncate text-xs font-normal text-white/90">{item.subtitle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
