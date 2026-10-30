import { formatFCFA } from "./utils";

/** Domaine canonique de production (utilisé dans les liens produit des messages WhatsApp). */
export const SITE_URL = "https://imprimelle.com";

/** URL publique d'une fiche produit à partir de son slug. */
export function productUrl(slug?: string | null): string | null {
  if (!slug) return null;
  return `${SITE_URL}/collection/${slug}`;
}

/** URL d'une fiche produit en mode groupage présélectionné. */
export function groupageProductUrl(slug?: string | null): string | null {
  const url = productUrl(slug);
  return url ? `${url}?groupage=1` : null;
}

/**
 * Message WhatsApp court après commande (flux « nous parler avant de payer »).
 * Volontairement minimal : le détail complet (articles, total, moyen de paiement)
 * part déjà au vendeur via la notification bridge `new_order` (WHATSAPP_QUEUE_URL).
 */
export function buildOrderMessage(orderId: string): string {
  return `Cc 👋🏽, J'ai passé cette commande sur votre site N° ${orderId}`;
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

/** Message de partage d'un groupage (bouton « Partager »). */
export function buildGroupageShareMessage(opts: {
  productName: string;
  url?: string | null;
  reductionFcfa?: number;
  groupPriceFcfa?: number | null;
}): string {
  const lines: string[] = ["🔥 Groupage Imprimelle !", ""];
  const saving =
    opts.reductionFcfa != null && opts.reductionFcfa > 0
      ? ` économisez ${formatFCFA(opts.reductionFcfa)}`
      : "";
  lines.push(`Rejoignez le groupage « ${opts.productName} » et${saving} sur ce produit.`);
  if (opts.groupPriceFcfa != null) {
    lines.push(`💰 Prix groupé : ${formatFCFA(opts.groupPriceFcfa)}.`);
  }
  lines.push("Plus on est nombreux, plus vite c'est livré 🚀");
  if (opts.url) lines.push(`👉 ${opts.url}`);
  return lines.join("\n");
}

/** URL de partage WhatsApp (sans destinataire → l'utilisateur choisit son contact). */
export function waShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
