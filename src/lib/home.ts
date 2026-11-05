/**
 * Valeurs par défaut des sections textuelles de la page d'accueil.
 * Source de vérité partagée entre :
 *  - le front (`src/app/page.tsx`) comme repli quand `showcase_settings.home` est vide ;
 *  - l'admin (`src/app/admin/reglages/page.tsx`) comme pré-remplissage,
 *    afin d'afficher le contenu actuellement visible (et non des champs vides).
 *
 * Les icônes restent fixes et ne sont pas éditables (réassurance : lucide,
 * étapes : émojis) — seul le couple titre/description est éditable.
 */

import type { ClientLogo } from "@/types";

export const DEFAULT_REASSURANCE: { title: string; desc: string }[] = [
  { title: "Livraison", desc: "Partout" },
  { title: "Made in 🇨🇮", desc: "Fabrication locale" },
  { title: "Garantie", desc: "2 ans" },
];

/** Titre du bloc preuve sociale (au-dessus du slider de logos). */
export const DEFAULT_REASSURANCE_TITLE = "à travers 5 pays !";

/** Stat de preuve sociale (chiffre en gras, animé à l'apparition). */
export const DEFAULT_SOCIAL_PROOF_STAT = "+1240";

/** Libellé affiché à côté du stat de preuve sociale. */
export const DEFAULT_SOCIAL_PROOF_LABEL = "Clients satisfaits";

/** Logos clients du slider « Nous ont fait confiance » (nom + logo optionnel). */
export const DEFAULT_LOGOS: ClientLogo[] = [
  { name: "Enotel Beach", logo_url: null },
  { name: "Hôtel Tiama", logo_url: null },
  { name: "L'Arc Abidjan", logo_url: null },
  { name: "Motown", logo_url: null },
  { name: "Seafood Paradise", logo_url: null },
  { name: "Virtus", logo_url: null },
  { name: "Skinny Club", logo_url: null },
  { name: "NSIA", logo_url: null },
  { name: "ITC", logo_url: null },
];

/**
 * Normalise `home.logos` vers `ClientLogo[]`, en tolérant l'ancien format
 * `string[]` (noms seuls) présent dans les réglages existants.
 */
export function normalizeLogos(raw: unknown): ClientLogo[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((l) =>
      typeof l === "string"
        ? { name: l, logo_url: null as string | null }
        : { name: (l as ClientLogo)?.name || "", logo_url: (l as ClientLogo)?.logo_url ?? null }
    )
    .filter((l) => l.name || l.logo_url);
}

export const DEFAULT_STEPS: { title: string; desc: string }[] = [
  { title: "Choisissez", desc: "Parcourez le catalogue et sélectionnez votre produit" },
  { title: "Commandez", desc: "4 champs suffisent pour passer commande en 2 minutes" },
  { title: "Confirmation", desc: "Notre équipe vous appelle sous 24h pour confirmer" },
  { title: "Livraison", desc: "Fabrication 7-10 jours, installation incluse à Abidjan" },
];

export const DEFAULT_CTA = {
  title: "Un projet spécifique ?",
  desc: "Envoyez-nous vos dimensions et votre logo — devis gratuit sous 24h, sans engagement.",
};

export const DEFAULT_FLASH_SALE = {
  enabled: true,
  title: "VENTE FLASH",
  button_href: "/ventes-flash",
  end_time: "23:59",
};
