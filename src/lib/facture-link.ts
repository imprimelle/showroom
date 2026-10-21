import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pont Showroom → FactureBuilder AssoAI.
 *
 * Matérialise une commande showroom (`showcase_orders`) en **facture** dans la table
 * `messages` (le format documentaire d'AssoAI). Une fois créée, la facture apparaît
 * automatiquement dans la sidebar du FactureBuilder et peut être convertie en commande
 * via le toggle existant (dérivation déterministe Facture→Commande).
 *
 * Choix « Option C optimisée » :
 *  - numéro de facture pré-alloué via `next_document_number('facture')` (évite la
 *    collision du trigger `trg_messages_deflag` sur les numéros vides) ;
 *  - marqueur `metadata.source = "showroom"` + `showroom_order_id` (badge sidebar + traçabilité) ;
 *  - `details` = articles uniquement (pas de ligne « livraison » fantôme qui deviendrait
 *    un item de commande puis une fausse enseigne au CDC) ;
 *  - `total` = `total_amount` (articles) ; frais de port conservés en metadata.
 */

export interface ShowroomOrderItem {
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price_fcfa: number;
  subtotal_fcfa: number;
  groupage?: boolean;
  image_url?: string | null;
}

export interface ShowroomOrderForFacture {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  items: ShowroomOrderItem[];
  totalAmount: number;
  notes?: string | null;
  paymentMethod: string;
  paymentStatus?: string | null;
  shippingCountry?: string | null;
  shippingFeeFcfa: number;
  totalWithShipping: number;
  depositFcfa?: number | null;
  balanceFcfa?: number | null;
}

export interface FactureLinkResult {
  factureMessageId: string;
  factureNumero: string;
}

/** Réserve un numéro de facture via le RPC partagé (même compteur qu'AssoAI). */
async function nextFactureNumber(admin: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await admin.rpc("next_document_number", {
      p_doc_type: "facture",
    });
    if (!error && data != null && String(data).trim() !== "") {
      return String(data);
    }
  } catch (e) {
    console.warn("next_document_number (facture) failed:", e);
  }
  return `F-${Date.now().toString().slice(-6)}`;
}

/**
 * Crée une facture AssoAI à partir d'une commande showroom.
 * Best-effort : en cas d'échec, on propage l'erreur — l'appelant décide (la commande
 * showroom reste valide même si le pont échoue).
 */
export async function createFactureFromShowroomOrder(
  admin: SupabaseClient,
  order: ShowroomOrderForFacture
): Promise<FactureLinkResult> {
  const factureNumero = await nextFactureNumber(admin);

  const details = order.items.map((it) => ({
    id: crypto.randomUUID(),
    description: `${it.product_name}${
      it.variant_label ? ` — ${it.variant_label}` : ""
    }${it.groupage ? " (Groupage)" : ""}`,
    quantite: it.quantity,
    prixUnitaire: it.unit_price_fcfa,
    sous_total: it.subtotal_fcfa,
    ...(it.image_url ? { image_url: it.image_url } : {}),
  }));

  const adresse = [order.customerAddress]
    .filter((s) => s && s.trim() !== "")
    .join(", ");

  const factureData = {
    factureNumero,
    dateEmission: new Date().toISOString().split("T")[0],
    statut: "Brouillon" as const,
    client: {
      nom: order.customerName,
      adresse,
      telephone: order.customerPhone,
    },
    details,
    total: order.totalAmount,
    version: 1,
    is_latest: true,
  };

  const metadata: Record<string, unknown> = {
    displayName: "Facture",
    availableActions: ["save", "download"],
    mode: "editable",
    source: "showroom",
    showroom_order_id: order.orderId,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus ?? null,
    shipping_country: order.shippingCountry ?? null,
    shipping_fee_fcfa: order.shippingFeeFcfa,
    total_with_shipping: order.totalWithShipping,
  };
  if (order.customerEmail) metadata.customer_email = order.customerEmail;
  if (order.depositFcfa != null) metadata.deposit_fcfa = order.depositFcfa;
  if (order.balanceFcfa != null) metadata.balance_fcfa = order.balanceFcfa;
  if (order.notes) metadata.notes = order.notes;

  const messageId = crypto.randomUUID();

  const { error } = await admin.from("messages").insert({
    id: messageId,
    session_id: `facture-${messageId}`,
    user_id: "showroom",
    content: `Facture — ${factureNumero}`,
    sender: "system",
    timestamp: new Date().toISOString(),
    template_type: "facture",
    template_data: {
      data: factureData,
      metadata,
    },
  });

  if (error) throw error;

  return { factureMessageId: messageId, factureNumero };
}
