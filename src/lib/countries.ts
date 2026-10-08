/**
 * Liste de pays pour le sélecteur « Pays de livraison » du checkout.
 * `code` = ISO 3166-1 alpha-2. « ZZ » = autre pays (code réservé, non attribué).
 */

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Bénin" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "GN", name: "Guinée" },
  { code: "CM", name: "Cameroun" },
  { code: "CF", name: "Centrafrique" },
  { code: "TD", name: "Tchad" },
  { code: "CG", name: "Congo" },
  { code: "GA", name: "Gabon" },
  { code: "GQ", name: "Guinée équatoriale" },
  { code: "CD", name: "RD Congo" },
  { code: "GH", name: "Ghana" },
  { code: "NG", name: "Nigeria" },
  { code: "MA", name: "Maroc" },
  { code: "DZ", name: "Algérie" },
  { code: "TN", name: "Tunisie" },
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "LU", name: "Luxembourg" },
  { code: "CA", name: "Canada" },
  { code: "US", name: "États-Unis" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Pays-Bas" },
  { code: "ZZ", name: "Autre pays" },
];

export function countryName(code?: string | null): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name || code;
}
