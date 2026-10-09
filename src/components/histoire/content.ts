// ============================================================================
// « Notre Histoire » — Source unique des textes (exacts, CCT) + données carte.
// Les textes sont rendus en HTML brut côté serveur (SEO) : ne jamais les
// remplacer par des images ou du contenu généré uniquement via Canvas/WebGL.
// ============================================================================

export const HISTOIRE_TITLE = "De l'Esquisse à l'Éclat : L'Histoire d'Imprimelle";

// --- Section 1 · Intro — L'interrupteur -------------------------------------
export const INTRO = {
  off: "Au départ, tout commence dans l'obscurité d'un atelier. Une idée. La volonté de prouver qu'en Côte d'Ivoire, nous pouvons concevoir ce qui fait briller les plus beaux espaces.",
  onLead: "Puis, la lumière fut.",
  onBody:
    "Aujourd'hui, nous sommes Imprimelle : la manufacture ivoirienne d'innovation lumineuse. De la célèbre Table Centrale Cacao LED aux enseignes 3D monumentales en passant par le mobilier à miroir infini, nous ne façonnons pas seulement la matière : nous domptons la lumière pour transformer vos intérieurs et vos façades.",
};

// --- Section 2 · Acte 1 — Deux regards, une seule ambition ------------------
export const ACTE_1 = {
  kicker: "Acte 1 — Le volet humain",
  title: "Deux regards, une seule ambition",
  intro:
    "Derrière la précision des découpes CNC, l'assemblage des modules LED et la brillance de l'acrylique, il y a avant tout une aventure de couple et une complémentarité sans faille.",
  engineering: {
    label: "Ingénierie & Design",
    text: "D'un côté, la passion de l'ingénierie, du design d'intérieur, de la technologie et de la fabrication locale.",
  },
  gestion: {
    label: "Rigueur & Gestion Client",
    text: "De l'autre, la rigueur de mon épouse, son œil affûté pour l'esthétique et sa gestion structurée qui transforme chaque commande en une expérience client d'exception.",
  },
  team: "Entourés d'une équipe de jeunes artisans et techniciens ivoiriens passionnés, nous partageons tous la même conviction : le Made in Côte d'Ivoire possède le potentiel d'imposer ses propres standards de luxe et d'innovation.",
};

// --- Section 3 · Acte 2 — Du dessin 3D à l'assemblage lumineux --------------
export interface FabStep {
  id: "conception" | "decoupe" | "miroir" | "allumage";
  title: string;
  text: string;
}

export const ACTE_2 = {
  kicker: "Acte 2 — Le volet produit",
  title: "Du dessin 3D à l'assemblage lumineux",
  steps: [
    {
      id: "conception",
      title: "La Conception & Modélisation 3D",
      text: "Rien n'est laissé au hasard. Chaque structure de table, chaque logo d'enseigne ou cadre mural est modélisé au millimètre près.",
    },
    {
      id: "decoupe",
      title: "L'Artisanat de la Découpe Numérique",
      text: "Nos machines façonnent le bois, l'Alucobond et l'acrylique avec une netteté chirurgicale.",
    },
    {
      id: "miroir",
      title: "La Magie Optique & Électronique (Miroir Infini)",
      text: "Intégration de nos néons LED haute durabilité, effets de réflexion en profondeur (miroir infini) et systèmes électriques sécurisés pour résister au temps et à l'usage.",
    },
    {
      id: "allumage",
      title: "L'Allumage Final (Toggle Jour / Nuit)",
      text: "Qu'il s'agisse de sublimer un salon privé avec une table lumineuse ou d'illuminer l'entrée d'un restaurant à Cocody, Zone 4 ou Marcory, la première mise sous tension est toujours un moment de magie.",
    },
  ] as FabStep[],
};

// --- Section 4 · Acte 3 — Rayonner depuis Abidjan ---------------------------
export const ACTE_3 = {
  kicker: "Acte 3 — La vision",
  title: "Rayonner depuis Abidjan sur toute l'Afrique",
  lead: "Ce que nous construisons ici, à Abidjan, n'est que le point de départ d'une industrie que nous voulons grande.",
  body: "De la Côte d'Ivoire au Cameroun, du Sénégal au Burkina, du Mali à la Guinée, nous expédions nos créations pour montrer qu'une marque africaine peut concevoir du mobilier technologique, du design d'exception et de la signalétique de classe internationale.",
  belief: "Nous croyons en une Afrique industrielle, moderne et créative.",
};

// --- Section 5 · Conclusion — CTA -------------------------------------------
export const CONCLUSION = {
  kicker: "Conclusion",
  title: "Allumez votre projet",
  body: "Que vous soyez un particulier souhaitant apporter une touche futuriste et chaleureuse à votre domicile, ou un entrepreneur désireux d'imposer son image de marque dès le premier regard : vous n'achetez pas seulement un meuble ou une enseigne. Vous faites le choix du savoir-faire local, de l'audace et de la passion.",
  welcome: "Bienvenue chez Imprimelle.",
  tagline: "Façonné à Abidjan. Conçu pour illuminer l'Afrique.",
  cta: "Démarrer mon projet sur-mesure",
};

// --- Carte Afrique (données simplifiées, projection stylisée) ---------------
export interface AfricaCountry {
  id: string;
  name: string;
  capital: string;
  /** Position projetée de la capitale dans le viewBox SVG (0 0 820 560). */
  x: number;
  y: number;
  /** Polygone approximatif du pays (coordonnées projetées). */
  points: string;
  /** Créations exportées (affichées au survol). */
  exports: string;
}

export const ABIDJAN = { x: 359, y: 468 };

export const AFRICA_COUNTRIES: AfricaCountry[] = [
  {
    id: "ci",
    name: "Côte d'Ivoire",
    capital: "Abidjan",
    x: 359,
    y: 468,
    points: "300,420 362,408 402,450 386,502 332,506 300,470",
    exports: "Siège & manufacture — tables Cacao LED, enseignes 3D, mobilier à miroir infini.",
  },
  {
    id: "sn",
    name: "Sénégal",
    capital: "Dakar",
    x: 15,
    y: 204,
    points: "6,188 58,183 70,230 40,246 10,234",
    exports: "Enseignes de restaurants & hôtels, totems lumineux.",
  },
  {
    id: "ml",
    name: "Mali",
    capital: "Bamako",
    x: 256,
    y: 263,
    points: "150,220 262,200 402,214 422,290 330,330 220,320 150,282",
    exports: "Lettres 3D & caissons lumineux pour commerces.",
  },
  {
    id: "bf",
    name: "Burkina Faso",
    capital: "Ouagadougou",
    x: 423,
    y: 269,
    points: "398,250 470,254 480,300 422,312 396,290",
    exports: "Signalétique d'entreprises, panneaux LED.",
  },
  {
    id: "gn",
    name: "Guinée",
    capital: "Conakry",
    x: 110,
    y: 350,
    points: "70,300 132,290 152,352 112,382 80,362",
    exports: "Enseignes néon & mobilier lumineux.",
  },
  {
    id: "gh",
    name: "Ghana",
    capital: "Accra",
    x: 456,
    y: 459,
    points: "400,450 472,444 490,480 440,496 406,480",
    exports: "Façades lumineuses & signalétique commerciale.",
  },
  {
    id: "cm",
    name: "Cameroun",
    capital: "Yaoundé",
    x: 756,
    y: 507,
    points: "700,470 770,464 782,520 720,526 700,496",
    exports: "Façades lumineuses, tables & décors sur mesure.",
  },
];
