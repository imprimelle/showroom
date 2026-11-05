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

export const DEFAULT_REASSURANCE: { title: string; desc: string }[] = [
  { title: "Livraison", desc: "Partout" },
  { title: "Made in 🇨🇮", desc: "Fabrication locale" },
  { title: "Garantie", desc: "2 ans" },
];

/** Titre du bloc de réassurance (au-dessus du slider de logos). */
export const DEFAULT_REASSURANCE_TITLE = "Ils nous ont fait confiance";

/** Logos d'entreprise du slider « Ils nous ont fait confiance » (placeholders). */
export const DEFAULT_LOGOS: string[] = [
  "AFRILUX",
  "NOVATECH",
  "AZUR GROUP",
  "MAISON & CO",
  "SUNRISE",
  "BRIGHTSIGN",
  "VISION PRO",
  "LOCAL ART",
];

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
