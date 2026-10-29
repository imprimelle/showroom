/**
 * Aides pour l'affichage et l'appel du numéro de téléphone de la barre du haut.
 * Le numéro est configuré SANS préfixe international (ex : « 0102656626 »).
 * L'affichage est local (sans +225) ; à l'appel, +225 est ajouté uniquement si
 * l'utilisateur est détecté à l'étranger (géolocalisation par IP).
 */

/** Préfixe international de la Côte d'Ivoire (chiffres, sans « + »). */
export const CI_COUNTRY_CODE = "225";

/** Réduit à des chiffres uniquement. */
function digitsOnly(phone?: string | null): string {
  return (phone || "").replace(/\D/g, "");
}

/** Numéro local (sans le préfixe 225), quelle que soit la forme fournie. */
export function localPhoneDigits(phone?: string | null): string {
  const digits = digitsOnly(phone);
  // 12 chiffres commençant par 225 → on retire le préfixe pays.
  if (digits.length === 12 && digits.startsWith(CI_COUNTRY_CODE)) {
    return digits.slice(CI_COUNTRY_CODE.length);
  }
  return digits;
}

/** Format lisible local : « 01 02 65 66 26 » (sans +225). */
export function formatLocalPhone(phone?: string | null): string {
  const local = localPhoneDigits(phone);
  if (!local) return "";
  return local.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** URL `tel:` — sans +225 en Côte d'Ivoire, avec +225 à l'étranger. */
export function buildCallHref(phone: string | null | undefined, abroad: boolean): string {
  const local = localPhoneDigits(phone);
  return abroad ? `tel:+${CI_COUNTRY_CODE}${local}` : `tel:${local}`;
}

/** Récupère un JSON via fetch avec un délai maximal (abandonne proprement). */
async function fetchJson(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Détecte le code pays de l'utilisateur via son IP (géolocalisation côté client).
 * Renvoie le code ISO 3166-1 alpha-2 (ex : « CI »), ou null si indétectable.
 */
export async function detectCallerCountryCode(): Promise<string | null> {
  const endpoints = [
    "https://ipwho.is/",
    "https://ipapi.co/json/",
    "https://freeipapi.com/api/json/",
  ];
  for (const url of endpoints) {
    const data = await fetchJson(url, 4000);
    if (!data) continue;
    const cc = data?.country_code || data?.countryCode || data?.country_code_iso2 || null;
    if (cc) return String(cc).toUpperCase();
  }
  return null;
}

/** Vrai si l'appelant est hors de Côte d'Ivoire (→ ajouter +225 à l'appel). */
export async function detectCallerAbroad(): Promise<boolean> {
  const cc = await detectCallerCountryCode();
  if (!cc) return false; // défaut : traité comme local (Côte d'Ivoire)
  return cc !== "CI";
}
