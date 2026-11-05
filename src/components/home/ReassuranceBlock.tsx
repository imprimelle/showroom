/**
 * Bloc de réassurance persuasif — 3 parties superposées :
 *   1. Titre « Ils nous ont fait confiance »
 *   2. Slider de logos d'entreprise (marquee CSS, défilement infini)
 *   3. Grille 3×1 d'illustrations (pas d'icônes) avec titre + sous-titre
 *
 * NB : les logos ci-dessous sont des PLACEHOLDERS génériques. Remplacer
 * `LOGOS` par les vrais logos clients (nom + éventuelle image) avant mise en prod.
 */

import type { ReactNode } from "react";

const LOGOS = [
  "AFRILUX",
  "NOVATECH",
  "AZUR GROUP",
  "MAISON & CO",
  "SUNRISE",
  "BRIGHTSIGN",
  "VISION PRO",
  "LOCAL ART",
];

const TruckIllustration = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-10 w-10"
    aria-hidden="true"
  >
    <path d="M2 15h22v16H2z" />
    <path d="M24 19h5l6 7v5H24z" />
    <circle cx="10" cy="34" r="3.5" />
    <circle cx="34" cy="34" r="3.5" />
    <path d="M2 38h44" />
  </svg>
);

const FactoryIllustration = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-10 w-10"
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

const ShieldIllustration = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-10 w-10"
    aria-hidden="true"
  >
    <path d="M24 3l15 5.5V21c0 11.5-6.5 18.5-15 24C15.5 39.5 9 32.5 9 21V8.5z" />
    <path d="M17 24l5 5 9-10" />
  </svg>
);

const ITEMS: { title: string; subtitle: string | null; illustration: ReactNode }[] = [
  { title: "Livraison", subtitle: "Partout", illustration: TruckIllustration },
  { title: "Made in 🇨🇮", subtitle: "Fabrication locale", illustration: FactoryIllustration },
  { title: "Garantie 2 ans", subtitle: null, illustration: ShieldIllustration },
];

export function ReassuranceBlock() {
  return (
    <section className="border-y border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        {/* 1. Titre */}
        <h2 className="text-center font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
          Ils nous ont fait confiance
        </h2>

        {/* 2. Slider de logos (marquee) */}
        <div className="relative mt-6 overflow-hidden">
          <div className="logo-marquee flex w-max items-center">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={i}
                className="flex items-center gap-2.5 whitespace-nowrap px-7 text-[var(--color-text-tertiary)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-strong)] text-[10px] font-bold text-[var(--color-text-secondary)]">
                  {name.charAt(0)}
                </span>
                <span className="text-sm font-semibold tracking-wide">{name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 3. Grille réassurance 3×1 (illustrations, discrètes) */}
        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-[var(--color-border-default)] pt-6 sm:grid-cols-3 sm:gap-4">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 justify-start sm:justify-center"
            >
              <span className="shrink-0 text-[var(--color-text-tertiary)]">
                {item.illustration}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{item.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
