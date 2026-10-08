export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Minuscules + suppression des accents (recherche insensible aux diacritiques). */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Prix minimum d'une liste de variantes, en ignorant les variantes sans prix (null). */
export function getMinPrice(variants?: { price: number | null }[]): number | null {
  if (!variants || variants.length === 0) return null;
  const prices = variants.filter((v) => v.price != null).map((v) => v.price as number);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/** Détecte si une URL pointe vers une vidéo (mp4/webm/mov/…). */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
}

/** Numéro WhatsApp de repli (surchargé via showcase_settings.contact.whatsapp). */
export const DEFAULT_WHATSAPP = "2250102656626";

/** Retourne le numéro WhatsApp normalisé (chiffres uniquement). */
export function normalizePhone(phone?: string | null): string {
  return (phone || DEFAULT_WHATSAPP).replace(/\D/g, "");
}

/** Formatage lisible d'un numéro (ex : 2250102656626 → +225 01 02 65 66 26). */
export function formatPhoneDisplay(phone?: string | null): string {
  const digits = normalizePhone(phone);
  if (!digits) return "";
  if (digits.length >= 11) {
    const country = digits.slice(0, 3);
    const local = digits.slice(3);
    return `+${country} ${local.replace(/(\d{2})(?=\d)/g, "$1 ")}`.trim();
  }
  return `+${digits}`;
}

/** URL wa.me prête à l'emploi. */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
}
