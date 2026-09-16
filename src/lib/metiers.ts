export interface Metier {
  slug: string;
  label: string; // libellé court (lien footer)
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string; // phrase d'accroche du hero
  family: string; // slug d'univers cible
  cta: string; // message WhatsApp pré-rempli
}

/**
 * Landing pages SEO « par métier ».
 * Chaque métier cible un univers et un besoin client précis.
 * Pour ajouter un métier : ajouter une entrée ici + lien dans le Footer.
 */
export const METIERS: Metier[] = [
  {
    slug: "enseigne-restaurant",
    label: "Enseignes restaurant",
    h1: "Enseignes lumineuses pour restaurants à Abidjan",
    metaTitle: "Enseigne lumineuse pour restaurant à Abidjan | Imprimelle CI",
    metaDescription:
      "Enseignes lumineuses sur mesure pour restaurants, maquis et fast-foods à Abidjan. Caissons, lettres 3D, néons. Devis gratuit sous 24h.",
    intro:
      "Attirez vos clients dès la rue avec une enseigne lumineuse visible de loin, adaptée aux restaurants, maquis et fast-foods.",
    family: "enseignes-signaletique",
    cta: "Bonjour, je souhaite une enseigne lumineuse pour mon restaurant",
  },
  {
    slug: "enseigne-boutique",
    label: "Enseignes boutique",
    h1: "Enseignes pour boutiques et commerces",
    metaTitle: "Enseigne pour boutique à Abidjan | Imprimelle CI",
    metaDescription:
      "Enseignes sur mesure pour boutiques et commerces : caissons lumineux, dibond, lettres 3D. Fabrication locale, installation incluse à Abidjan.",
    intro:
      "Donnez une identité forte à votre boutique avec une enseigne qui reflète votre marque et attire les passants.",
    family: "enseignes-signaletique",
    cta: "Bonjour, je souhaite une enseigne pour ma boutique",
  },
  {
    slug: "enseigne-salon-beaute",
    label: "Enseignes salon de beauté",
    h1: "Enseignes pour salons de beauté et instituts",
    metaTitle: "Enseigne pour salon de beauté à Abidjan | Imprimelle CI",
    metaDescription:
      "Enseignes lumineuses élégantes pour salons de beauté, instituts et spas à Abidjan. Néons, lettres 3D, enseignes sur mesure.",
    intro:
      "Une enseigne élégante et lumineuse pour mettre en valeur votre salon de beauté ou institut de soins.",
    family: "enseignes-signaletique",
    cta: "Bonjour, je souhaite une enseigne pour mon salon de beauté",
  },
  {
    slug: "enseigne-bureau",
    label: "Signalétique bureau",
    h1: "Enseignes et signalétique pour bureaux",
    metaTitle: "Enseigne et signalétique pour bureau à Abidjan | Imprimelle CI",
    metaDescription:
      "Enseignes et signalétique professionnelles pour bureaux et entreprises : plaques, totems, lettres 3D. Fabrication sur mesure à Abidjan.",
    intro:
      "Identifiez vos locaux avec une signalétique professionnelle : plaques de porte, totems d'accueil, enseignes de façade.",
    family: "enseignes-signaletique",
    cta: "Bonjour, je souhaite une enseigne ou signalétique pour mon bureau",
  },
  {
    slug: "enseigne-hotel",
    label: "Enseignes hôtel",
    h1: "Enseignes pour hôtels et réceptions",
    metaTitle: "Enseigne pour hôtel à Abidjan | Imprimelle CI",
    metaDescription:
      "Enseignes lumineuses haut de gamme pour hôtels, résidences et réceptions à Abidjan. Totems, lettres 3D, caissons lumineux.",
    intro:
      "Une enseigne prestigieuse pour accueillir vos clients : totems lumineux, lettres 3D et caissons haut de gamme.",
    family: "enseignes-signaletique",
    cta: "Bonjour, je souhaite une enseigne pour mon hôtel",
  },
  {
    slug: "mobilier-lumineux",
    label: "Mobilier lumineux",
    h1: "Mobilier lumineux et décorations",
    metaTitle: "Mobilier lumineux et décoration à Abidjan | Imprimelle CI",
    metaDescription:
      "Mobilier lumineux sur mesure : tables lumineuses, tables LED, décoration lumineuse. Fabrication locale, livraison à Abidjan.",
    intro:
      "Embellissez votre intérieur avec des tables lumineuses et des décorations LED fabriquées sur mesure.",
    family: "mobilier-decorations",
    cta: "Bonjour, je souhaite un devis pour du mobilier lumineux",
  },
];

export function getMetier(slug?: string): Metier | undefined {
  if (!slug) return undefined;
  return METIERS.find((m) => m.slug === slug);
}
