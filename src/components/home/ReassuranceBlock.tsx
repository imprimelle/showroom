/**
 * Bloc de réassurance — bande orange avec 3 icônes + texte blanc.
 * Rendu à l'intérieur d'un conteneur parent (pas de wrapper section propre) :
 * il s'insère directement dans la section « Top produits », juste au-dessus du
 * bouton « Voir tout le catalogue ».
 *
 * Icônes fixes mappées par position (1 = camion, 2 = usine, 3 = bouclier).
 * Contenu piloté par `home.reassurance`.
 */

import type { ReactNode } from "react";

const TruckIcon = (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 md:h-8 md:w-8"
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
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 md:h-8 md:w-8"
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
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 md:h-8 md:w-8"
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

export function ReassuranceBlock({ items }: { items?: ReassuranceItem[] }) {
  const resolvedItems: ReassuranceItem[] =
    items && items.length > 0
      ? items
      : [
          { title: "Livraison", subtitle: "Partout" },
          { title: "Made in 🇨🇮", subtitle: "Fabrication locale" },
          { title: "Garantie", subtitle: "2 ans" },
        ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF9A1F] to-[#F5790A] px-4 py-5 md:px-6 md:py-6">
      <div className="flex flex-row items-stretch justify-between gap-3">
        {resolvedItems.map((item, i) => (
          <div key={i} className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
            <span className="shrink-0 text-white">{ILLUSTRATIONS[i % ILLUSTRATIONS.length]}</span>
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
  );
}
