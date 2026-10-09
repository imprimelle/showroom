// ============================================================================
// « Notre Histoire » — Source unique des textes (concis) + données carte.
// Les textes sont rendus en HTML brut côté serveur (SEO).
// ============================================================================

export const HISTOIRE_TITLE = "De l'esquisse à l'éclat";

// --- Section 1 · Intro ------------------------------------------------------
export const INTRO = {
  eyebrow: "Imprimelle · Manufacture ivoirienne",
  line: "Nous domptons la lumière pour transformer vos intérieurs et vos façades.",
  scrollHint: "Faites défiler",
};

// --- Section 2 · Acte 1 — Le duo -------------------------------------------
export const ACTE_1 = {
  kicker: "01 — Le duo",
  title: "Deux regards, une ambition",
  engineering: {
    label: "Ingénierie & design",
    line: "La passion de la technologie et de la fabrication locale.",
  },
  gestion: {
    label: "Rigueur & esthétique",
    line: "Un œil affûté, une gestion qui sublime chaque commande.",
  },
  footer: "Made in Côte d'Ivoire, porté par une équipe d'artisans ivoiriens passionnés.",
};

// --- Section 3 · Acte 2 — La fabrication ------------------------------------
export interface FabStep {
  id: "conception" | "decoupe" | "miroir" | "allumage";
  title: string;
  line: string;
}

export const ACTE_2 = {
  kicker: "02 — La fabrication",
  title: "De la 3D à l'allumage",
  steps: [
    { id: "conception", title: "Conception 3D", line: "Modélisé au millimètre." },
    { id: "decoupe", title: "Découpe CNC", line: "Bois, Alucobond, acrylique." },
    { id: "miroir", title: "Miroir infini", line: "Néon LED, profondeur optique." },
    { id: "allumage", title: "Allumage", line: "Jour ou nuit, toujours magique." },
  ] as FabStep[],
};

// --- Section 4 · Acte 3 — La vision ----------------------------------------
export const ACTE_3 = {
  kicker: "03 — La vision",
  title: "Rayonner depuis Abidjan",
  line: "De la Côte d'Ivoire au Cameroun, du Sénégal à la Guinée.",
  belief: "Une Afrique industrielle, moderne et créative.",
};

// --- Section 5 · Conclusion -------------------------------------------------
export const CONCLUSION = {
  title: "Allumez votre projet",
  line: "Façonné à Abidjan. Conçu pour illuminer l'Afrique.",
  catalog: "Voir le catalogue",
  project: "Démarrer mon projet",
};

// --- Carte Afrique (données simplifiées, projection stylisée) ---------------
export interface AfricaCountry {
  id: string;
  name: string;
  capital: string;
  x: number;
  y: number;
  points: string;
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
    exports: "Siège & manufacture — tables Cacao LED, enseignes 3D, miroirs infinis.",
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
