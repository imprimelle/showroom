import type { Highlight } from "@/types";

/**
 * Normalisation des points forts (`showcase.highlights`).
 *
 * Compatible avec l'ancien format (tableau de chaînes) et le nouveau
 * (tableau d'objets `{ title, icon, text }`). Chaque chaîne héritée devient
 * `{ title: chaîne, icon: auto, text: "" }`.
 *
 * Module volontairement SANS dépendance `lucide-react` : il peut être importé
 * côté serveur (route API admin) sans alourdir le bundle.
 */

/** Déduit une clé d'icône à partir du texte (mots-clés). */
export function autoHighlightIcon(text: string): string {
  const t = text.toLowerCase();
  if (/(led|éclairage|lumineu|lumière|neon|retro|ampoule|led)/.test(t)) return "zap";
  if (/(soleil|solaire|luminosité|luminosite)/.test(t)) return "sun";
  if (/(couleur|finition|design|moderne|epure|épuré|soigne|esthéti|esthéti|teinte)/.test(t)) return "palette";
  if (/(verre|aluminium|acier|bois|structure|materiau|matière|matière|métal|metal)/.test(t)) return "layers";
  if (/(dimension|taille|mesure|sur-mesure|sur mesure|personnali)/.test(t)) return "ruler";
  if (/(garantie)/.test(t)) return "shield";
  if (/(etanche|étanche|ip\d|exterieur|extérieur|intemper|résistan|resistan|pluie)/.test(t)) return "droplets";
  if (/(eco|éco|écologique|ecologique|durable|recycl|environnement)/.test(t)) return "leaf";
  if (/(fabrication|local|fabriqué|fabrique|atelier|ivoire|abidjan)/.test(t)) return "factory";
  if (/(install|montage|pose|service|entretien|répar|repar)/.test(t)) return "wrench";
  if (/(livraison|livré|livre|transport|expédi|expedi)/.test(t)) return "truck";
  if (/(délai|delai|rapide|jour|semaine|24h|48h)/.test(t)) return "clock";
  if (/(confort|ergonom|bien-être|bien-etre|confortable)/.test(t)) return "heart";
  if (/(qualité|qualite|premium|haut de gamme)/.test(t)) return "star";
  return "sparkles";
}

/** Assainit une entrée « point fort » quelconque en objet `Highlight` (ou null). */
function coerceHighlight(raw: unknown): Highlight | null {
  if (typeof raw === "string") {
    const title = raw.trim();
    if (!title) return null;
    return { title, icon: autoHighlightIcon(title), text: "" };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Partial<Highlight>;
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) return null;
    return {
      title,
      icon: typeof obj.icon === "string" && obj.icon.trim() ? obj.icon.trim() : autoHighlightIcon(title),
      text: typeof obj.text === "string" ? obj.text.trim() : "",
    };
  }
  return null;
}

/** Normalise `showcase.highlights` (ancien `string[]` ou nouveau `Highlight[]`). */
export function normalizeHighlights(raw: unknown): Highlight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(coerceHighlight)
    .filter((h): h is Highlight => h !== null);
}

/** Assainit un tableau d'objets highlights reçu de l'admin avant écriture en DB. */
export function sanitizeHighlights(raw: unknown): Highlight[] {
  return normalizeHighlights(raw).map((h) => ({
    title: h.title,
    icon: h.icon,
    text: h.text,
  }));
}
