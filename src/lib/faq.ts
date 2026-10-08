import type { FaqPill } from "@/types";

/**
 * FAQ de la fiche produit : deux sources distinctes.
 *  - `faq` (accordéon) : éditable PAR produit (showcase.faq).
 *  - `faq_pills` (bottom sheet) : éditable GLOBALEMENT (Réglages → FAQ produit).
 */

/** Pilules FAQ (bottom sheet) affichées par défaut si aucun réglage global n'est défini. */
export const DEFAULT_FAQ_PILLS: FaqPill[] = [
  {
    id: "livraison",
    label: "Livraison",
    content:
      "Nous livrons partout en Côte d'Ivoire. La livraison est gratuite et l'installation est incluse à Abidjan. Délai : 7 à 10 jours ouvrés.",
  },
  {
    id: "retours",
    label: "Retours",
    content:
      "Produit fabriqué sur mesure. En cas de défaut de fabrication, nous le remplaçons ou le réparons gratuitement sous garantie.",
  },
  {
    id: "materiaux",
    label: "Matériaux",
    content:
      "Matériaux de qualité : verre trempé, aluminium, LED haute luminosité. Chaque produit est fabriqué localement à Abidjan.",
  },
  {
    id: "garantie",
    label: "Garantie",
    content: "Garantie 2 ans pièces et main d'œuvre sur tous nos produits.",
  },
  {
    id: "dimensions",
    label: "Dimensions",
    content:
      "Toutes les dimensions sont sur mesure. Choisissez votre taille ou contactez-nous pour du sur-mesure.",
  },
  {
    id: "paiement",
    label: "Paiement",
    content:
      "Paiement à la livraison en espèces ou par mobile money (Orange Money, Wave).",
  },
];

/** FAQ générique (accordéon) affichée quand `showcase.faq` est vide. */
export const DEFAULT_FAQ: { q: string; a: string }[] = [
  {
    q: "Quels sont les délais de fabrication ?",
    a: "7 à 10 jours ouvrés selon le produit et la complexité de votre projet.",
  },
  {
    q: "Puis-je personnaliser ce produit ?",
    a: "Oui, tous nos produits sont fabriqués sur mesure : dimensions, couleurs, logo et finitions. Envoyez-nous votre projet sur WhatsApp pour un devis.",
  },
  {
    q: "La livraison et l'installation sont-elles incluses ?",
    a: "Nous livrons partout en Côte d'Ivoire et l'installation est incluse à Abidjan.",
  },
  {
    q: "Quelle garantie est offerte ?",
    a: "Tous nos produits sont garantis 2 ans, pièces et main d'œuvre.",
  },
];

/** Résout les pilules FAQ : réglages globaux sinon valeurs par défaut. */
export function resolveFaqPills(pills: unknown): FaqPill[] {
  if (Array.isArray(pills) && pills.length > 0) {
    return pills
      .filter(
        (p): p is FaqPill =>
          !!p && typeof p === "object" && typeof (p as FaqPill).label === "string" && !!(p as FaqPill).label.trim()
      )
      .map((p) => ({
        id: typeof p.id === "string" && p.id ? p.id : String(p.label),
        label: p.label.trim(),
        content: typeof p.content === "string" ? p.content : "",
      }));
  }
  return DEFAULT_FAQ_PILLS;
}
