import type { SocialProofEntry } from "@/types";

/**
 * Preuve sociale (« X vient de commander »).
 * Liste par pays : Côte d'Ivoire (15), puis 15 pays × 5 = 90 couples.
 * Le drapeau est stocké directement dans l'entrée (emoji) pour un rendu immédiat.
 */
const RAW: [country: string, flag: string, names: string[]][] = [
  [
    "Côte d'Ivoire",
    "🇨🇮",
    [
      "Emanuel Loukou",
      "Aya Kouassi",
      "Jean-Marc Yao",
      "Fatou Koné",
      "Serge N'Guessan",
      "Mariam Traoré",
      "Didier Kouadio",
      "Awa Diabaté",
      "Boris Assamoi",
      "Sandrine Dago",
      "Yves Kouamé",
      "Clarisse Bamba",
      "Rodrigue N'Dri",
      "Estelle Gnamien",
      "Franck Ouattara",
    ],
  ],
  ["Mali", "🇲🇱", ["Moussa Traoré", "Aminata Diallo", "Boubacar Keïta", "Salif Cissé", "Kadiatou Doumbia"]],
  ["Burkina Faso", "🇧🇫", ["Issouf Ouédraogo", "Aïcha Sawadogo", "Lassina Kaboré", "Fatimata Zongo", "Ibrahim Compaoré"]],
  ["Guinée", "🇬🇳", ["Mamadou Barry", "Aïssatou Diallo", "Ousmane Camara", "Kadiatou Sylla", "Ibrahima Soumah"]],
  ["Liberia", "🇱🇷", ["Emmanuel Johnson", "Ruth Kollie", "Samuel Weah", "Mercy Kamara", "Joseph Toe"]],
  ["Togo", "🇹🇬", ["Kossi Agbeko", "Akouvi Mensah", "Yao Amegan", "Afi Kpodar", "Kodjo Adjei"]],
  ["Bénin", "🇧🇯", ["Sènan Houngbédji", "Chantal Adjovi", "Franck Dossou", "Estelle Gbèho", "Romaric Agossa"]],
  ["Sénégal", "🇸🇳", ["Mamadou Ndiaye", "Awa Diop", "Ousmane Sarr", "Fatou Niang", "Ibrahima Fall"]],
  ["Cameroun", "🇨🇲", ["Jean-Paul Nkoulou", "Clarisse Mbarga", "Boris Nganou", "Esther Tchoupo", "Yannick Onana"]],
  ["Congo Brazzaville", "🇨🇬", ["Ulrich Mavoungou", "Grâce Nkodia", "Parfait Bantsimba", "Dorcas Moukala", "Chris Ondongo"]],
  ["Congo Kinshasa", "🇨🇩", ["Emmanuel Kasongo", "Naomie Mbuyi", "Patrick Ilunga", "Sarah Mukendi", "David Ngoy"]],
  ["Gabon", "🇬🇦", ["Steeve Ndong", "Aïda Moussavou", "Loïc Obame", "Mélanie Nzamba", "Arnaud Mvé"]],
  ["Canada", "🇨🇦", ["Marc Tremblay", "Sophie Gagnon", "David Côté", "Julie Bergeron", "Mathieu Roy"]],
  ["France", "🇫🇷", ["Lucas Martin", "Camille Bernard", "Hugo Dubois", "Manon Petit", "Thomas Moreau"]],
  ["Allemagne", "🇩🇪", ["Lukas Müller", "Anna Schmidt", "Felix Weber", "Lena Fischer", "Jonas Wagner"]],
  ["États-Unis", "🇺🇸", ["James Carter", "Emily Parker", "Michael Johnson", "Olivia Brown", "David Wilson"]],
];

/** Liste complète (aplatie) : 90 couples { name, country, flag }. */
export const DEFAULT_SOCIAL_PROOF_ENTRIES: SocialProofEntry[] = RAW.flatMap(
  ([country, flag, names]) => names.map((name) => ({ name, country, flag }))
);

/** Pays → drapeau (pour reconstruire le drapeau depuis le pays saisi dans l'admin). */
export const COUNTRY_FLAGS: Record<string, string> = Object.fromEntries(
  RAW.map(([country, flag]) => [country, flag])
);

/** Pays connus (pour l'auto-complétion / sélecteur admin). */
export const SOCIAL_PROOF_COUNTRIES: string[] = RAW.map(([country]) => country);

/**
 * Résout les entrées à afficher : celles de la config si non vides,
 * sinon la liste par défaut.
 */
export function resolveSocialProofEntries(
  config?: { enabled?: boolean; entries?: SocialProofEntry[] }
): SocialProofEntry[] {
  const list = config?.entries;
  return Array.isArray(list) && list.length > 0 ? list : DEFAULT_SOCIAL_PROOF_ENTRIES;
}

/**
 * Parse un texte « Nom, Pays » (une ligne par entrée) → entrées.
 * Le drapeau est déduit du pays (repli 🌍 si inconnu).
 */
export function parseSocialProofEntries(text: string): SocialProofEntry[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(",").map((s) => s.trim());
      const country = rest.join(", ").trim();
      return {
        name: name || "",
        country: country || "",
        flag: COUNTRY_FLAGS[country] ?? "🌍",
      };
    })
    .filter((e) => e.name);
}

/** Sérialise des entrées → texte « Nom, Pays » (une ligne par entrée) pour l'admin. */
export function serializeSocialProofEntries(entries: SocialProofEntry[]): string {
  return (entries || []).map((e) => `${e.name}, ${e.country}`).join("\n");
}
