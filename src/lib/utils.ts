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

/** Prix minimum d'une liste de variantes, en ignorant les variantes sans prix (null). */
export function getMinPrice(variants?: { price: number | null }[]): number | null {
  if (!variants || variants.length === 0) return null;
  const prices = variants.filter((v) => v.price != null).map((v) => v.price as number);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/** Numéro WhatsApp de repli (surchargé via showcase_settings.contact.whatsapp). */
export const DEFAULT_WHATSAPP = "2250102656626";

/** Retourne le numéro WhatsApp normalisé (chiffres uniquement). */
export function normalizePhone(phone?: string | null): string {
  return (phone || DEFAULT_WHATSAPP).replace(/\D/g, "");
}

/** URL wa.me prête à l'emploi. */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
}
