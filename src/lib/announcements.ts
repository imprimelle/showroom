import type { AnnouncementMessage, ShowcaseSettings } from "@/types";

/**
 * Bandeau d'annonce défilant (top bar au-dessus de la nav).
 * Messages verticaux, texte ambre, avec mini-markdown :
 *   *gras*            → gras (chiffres / promos)
 *   _souligné_        → souligné
 *   [libellé](href)   → lien souligné (URL | /chemin | slug produit → /collection/{slug})
 */

/** Messages par défaut (affichés tant qu'aucune config admin n'existe). */
export const DEFAULT_ANNOUNCEMENT_MESSAGES: AnnouncementMessage[] = [
  { id: "m1", text: "Jusqu'à *-35%* sur les groupages", duration_ms: null },
  {
    id: "m2",
    text: "Black friday 🔥 : *2* Table cubix led acheté *1* commode de lit offerte",
    duration_ms: null,
  },
  { id: "m3", text: "Trouvez le *cadeau parfait* à moindre coût", duration_ms: null },
  { id: "m4", text: "Fièrement Ivoirien", duration_ms: null },
];

/** Période d'affichage par défaut (ms) d'un message. */
export const DEFAULT_ANNOUNCEMENT_PERIOD_MS = 4000;

/** Durée minimale acceptée (ms) pour une période / durée de message. */
const MIN_DURATION_MS = 500;

/** Config résolue du bandeau d'annonce (avec replis sur les défauts). */
export interface AnnouncementConfig {
  enabled: boolean;
  periodMs: number;
  messages: AnnouncementMessage[];
}

/** Résout la config du bandeau (replis sur les valeurs par défaut). */
export function resolveAnnouncement(
  config?: ShowcaseSettings["announcement"]
): AnnouncementConfig {
  const c = config || {};
  const messages = Array.isArray(c.messages)
    ? c.messages.filter((m) => m.text && m.text.trim())
    : DEFAULT_ANNOUNCEMENT_MESSAGES;
  return {
    enabled: c.enabled !== false,
    periodMs:
      typeof c.period_ms === "number" && c.period_ms >= MIN_DURATION_MS
        ? c.period_ms
        : DEFAULT_ANNOUNCEMENT_PERIOD_MS,
    messages,
  };
}

/** Durée d'affichage d'un message (override ou période globale). */
export function announcementMessageDuration(
  message: AnnouncementMessage,
  periodMs: number
): number {
  const d = message.duration_ms;
  return typeof d === "number" && d >= MIN_DURATION_MS ? d : periodMs;
}

/** Résout le href d'un lien inline : URL, chemin interne, ou slug produit. */
export function resolveAnnouncementHref(href: string): string {
  const h = href.trim();
  if (/^https?:\/\//i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return `/collection/${h}`;
}

/** Segment d'un texte de bandeau (issu du tokenizer). */
export type AnnouncementSegment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "underline"; content: string }
  | { type: "link"; content: string; href: string };

/**
 * Découpe un texte en segments typés (gras / souligné / lien / texte brut).
 * Ordre de priorité : gras, puis souligné, puis lien `[libellé](href)`.
 */
const TOKEN_REGEX = /(\*[^*]+\*)|(_[^_]+_)|(\[([^\]]+)\]\(([^)]+)\))/g;

export function tokenizeAnnouncement(text: string): AnnouncementSegment[] {
  const segments: AnnouncementSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((m = TOKEN_REGEX.exec(text))) {
    if (m.index > last) segments.push({ type: "text", content: text.slice(last, m.index) });
    if (m[1]) segments.push({ type: "bold", content: m[1].slice(1, -1) });
    else if (m[2]) segments.push({ type: "underline", content: m[2].slice(1, -1) });
    else if (m[3]) segments.push({ type: "link", content: m[4], href: m[5] });
    last = TOKEN_REGEX.lastIndex;
  }
  if (last < text.length) segments.push({ type: "text", content: text.slice(last) });
  return segments;
}
