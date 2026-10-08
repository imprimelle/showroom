import { formatFCFA } from "./utils";

/** Domaine canonique de production (utilisé dans les liens produit des messages WhatsApp). */
export const SITE_URL = "https://imprimelle.com";

/** URL publique d'une fiche produit à partir de son slug. */
export function productUrl(slug?: string | null): string | null {
  if (!slug) return null;
  return `${SITE_URL}/collection/${slug}`;
}

/** Phrase de fin de message selon le moyen de paiement choisi. */
export function paymentMethodNote(method?: string | null): string {
  switch (method) {
    case "cod":
      return "Je paierai à la livraison.";
    case "talk_first":
      return "Je souhaite être contacté(e) avant de finaliser le paiement.";
    case "wave":
      return "J'ai payé via Wave.";
    case "orange":
      return "J'ai payé via Orange Money.";
    case "mtn":
      return "J'ai payé via MTN MoMo.";
    case "card":
      return "J'ai payé par carte bancaire.";
    default:
      return "";
  }
}

export interface OrderMessageItem {
  name: string;
  variant?: string | null;
  quantity: number;
  url?: string | null;
  options?: { label: string; price: number }[];
}

/**
 * Message WhatsApp pré-rempli après commande (flux « nous parler avant de payer »).
 * Bien structuré : liste des produits (avec lien), options/personnalisation,
 * n° de commande, total, puis indication du moyen de paiement.
 */
export function buildOrderMessage(opts: {
  items: OrderMessageItem[];
  orderId: string;
  totalFcfa: number;
  paymentMethod?: string | null;
}): string {
  const lines: string[] = ["Bonjour 👋, je viens de passer une commande sur votre site.", ""];

  opts.items.forEach((item, idx) => {
    const variant = item.variant ? ` — ${item.variant}` : "";
    lines.push(`${idx + 1}) ${item.name}${variant} ×${item.quantity}`);
    if (item.url) lines.push(`   🔗 ${item.url}`);
    const opts = (item.options || []).filter((o) => o.label);
    if (opts.length > 0) {
      const optsStr = opts
        .map((o) => `${o.label}${o.price > 0 ? ` (+${formatFCFA(o.price)})` : ""}`)
        .join(", ");
      lines.push(`   ⚙️ Personnalisation : ${optsStr}`);
    }
    lines.push("");
  });

  lines.push(`📦 N° de commande : ${opts.orderId}`);
  lines.push(`💰 Total : ${formatFCFA(opts.totalFcfa)}`);

  const note = paymentMethodNote(opts.paymentMethod);
  if (note) lines.push("", `💳 ${note}`);

  return lines.join("\n");
}

/** Message d'intérêt pour une fiche produit (bouton « Demander un devis » / « Parler à un conseiller »). */
export function productInquiryMessage(opts: {
  name: string;
  variant?: string | null;
  priceFcfa?: number | null;
  url?: string | null;
  options?: { label: string; price: number }[];
}): string {
  const lines: string[] = ["Bonjour 👋, je suis intéressé(e) par ce produit :", ""];
  const variant = opts.variant ? ` — ${opts.variant}` : "";
  lines.push(`• ${opts.name}${variant}`);
  if (opts.priceFcfa != null) lines.push(`Prix : ${formatFCFA(opts.priceFcfa)}`);
  if (opts.url) lines.push(`🔗 ${opts.url}`);
  const optsList = (opts.options || []).filter((o) => o.label);
  if (optsList.length > 0) {
    lines.push(`⚙️ Personnalisation : ${optsList.map((o) => o.label).join(", ")}`);
  }
  lines.push("", "Pouvez-vous m'envoyer plus d'informations / un devis ?");
  return lines.join("\n");
}

/** Message de demande de devis générique (home, catégorie…). */
export function quoteMessage(context?: string | null): string {
  const lines: string[] = ["Bonjour 👋, je souhaite obtenir un devis."];
  if (context) lines.push(`Objet : ${context}`);
  lines.push("Merci de me recontacter.");
  return lines.join("\n");
}

/** Message générique (menu, FAB). */
export function generalInquiryMessage(context?: string | null): string {
  const lines: string[] = ["Bonjour 👋, je souhaite en savoir plus sur vos produits et services."];
  if (context) lines.push(`Contexte : ${context}`);
  lines.push("Merci de me recontacter.");
  return lines.join("\n");
}
