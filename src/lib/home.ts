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
  { title: "Livraison gratuite", desc: "Sur toute commande" },
  { title: "Garantie 2 ans", desc: "Sur tous nos produits" },
  { title: "Made in CI", desc: "Fabrication locale" },
  { title: "Paiement livraison", desc: "Espèces ou mobile money" },
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
