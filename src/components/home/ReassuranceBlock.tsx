/**
 * Bloc « Preuve sociale + Réassurance » de la page d'accueil :
 *   1. Stat de preuve sociale animé (ex. « +1240 ») + libellé
 *      (« Business & Particulier »), puis titre (« Nous ont fait confiance »).
 *   2. Slider de logos clients (marquee CSS, défilement infini) — image uploadée
 *      via l'admin, sinon nom de l'entreprise en toutes lettres.
 *   3. Rangée de réassurance (3 items) avec icônes orange texturées.
 *
 * Contenu piloté par les réglages admin (`home.social_proof_stat`,
 * `home.social_proof_label`, `home.reassurance_title`, `home.logos`,
 * `home.reassurance`). Les icônes sont fixes et mappées par position
 * (1 = camion, 2 = usine, 3 = bouclier).
 */

import type { ReactNode } from "react";
import type { ClientLogo } from "@/types";
import { SocialProofStat } from "./SocialProofStat";

/* ---------------------------------------------------------------------------
 * Icônes de réassurance — badges orange texturés (dégradé + pois + relief)
 * ------------------------------------------------------------------------- */

function OrangeBadge({ patternId, children }: { patternId: string; children: ReactNode }) {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm md:h-14 md:w-14">
      {/* Fond dégradé orange */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #FFC34D 0%, #FF9A1F 45%, #F5790A 100%)" }}
      />
      {/* Texture : pois blancs translucides en diagonale */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 20 20">
        <defs>
          <pattern id={patternId} width="5.5" height="5.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx="1.6" cy="1.6" r="1.1" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="20" height="20" fill={`url(#${patternId})`} />
      </svg>
      {/* Relief : liseré interne clair */}
      <span aria-hidden className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30" />
      <span className="relative text-white drop-shadow-sm">{children}</span>
    </span>
  );
}

const TruckIcon = (
  <svg viewBox="0 0 48 48" fill="none" className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true">
    <path d="M2 15a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v17H2z" fill="currentColor" />
    <path
      d="M24 18.5h3.9a2 2 0 0 1 1.6.8l4.7 6.1a2 2 0 0 1 .4 1.2V30a2 2 0 0 1-2 2h-8.6z"
      fill="currentColor"
      opacity="0.82"
    />
    <circle cx="10" cy="35" r="4" fill="#F5790A" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="34" cy="35" r="4" fill="#F5790A" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="10" cy="35" r="1.4" fill="currentColor" />
    <circle cx="34" cy="35" r="1.4" fill="currentColor" />
    <path d="M2 40h44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FactoryIcon = (
  <svg viewBox="0 0 48 48" fill="none" className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true">
    <path d="M9 40V26h8v14" fill="currentColor" />
    <path d="M17 40V21h14v19" fill="currentColor" />
    <path d="M31 40V27h8v13" fill="currentColor" />
    <path d="M5 40h38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Toits / cheminée */}
    <path d="M20 21v-5h5v5" fill="currentColor" opacity="0.82" />
    <path d="M21 14.5c-.6-.8-1.2-1.4-2.2-1.9M23 13c-.4-.5-.8-.9-1.3-1.3" stroke="#F5790A" strokeWidth="1.4" strokeLinecap="round" />
    {/* Fenêtres */}
    <rect x="12" y="29" width="3" height="4" rx="0.5" fill="#F5790A" />
    <rect x="22" y="25" width="4" height="5" rx="0.5" fill="#F5790A" />
    <rect x="33" y="30" width="3" height="4" rx="0.5" fill="#F5790A" />
  </svg>
);

const ShieldIcon = (
  <svg viewBox="0 0 48 48" fill="none" className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true">
    <path d="M24 3l15 5.5V21c0 11.5-6.5 18.5-15 24C15.5 39.5 9 32.5 9 21V8.5z" fill="currentColor" />
    {/* Texture intérieure : hachures diagonales */}
    <path d="M13 21.5 22.5 31l13-15" stroke="#F5790A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ILLUSTRATIONS: ReactNode[] = [
  <OrangeBadge key="truck" patternId="reass-dots-truck">{TruckIcon}</OrangeBadge>,
  <OrangeBadge key="factory" patternId="reass-dots-factory">{FactoryIcon}</OrangeBadge>,
  <OrangeBadge key="shield" patternId="reass-dots-shield">{ShieldIcon}</OrangeBadge>,
];

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

        {/* 3. Rangée réassurance (une seule ligne) */}
        <div className="mt-7 flex flex-row items-stretch justify-between gap-3 border-t border-[var(--color-border-default)] pt-6">
          {resolvedItems.map((item, i) => (
            <div key={i} className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
              {ILLUSTRATIONS[i % ILLUSTRATIONS.length]}
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                {item.subtitle && (
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">{item.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
