import type { PaymentMethod, OnlinePaymentMethod } from "@/types";

/** Moyens de paiement en ligne (FedaPay) — catalogue global avec statut « live ». */
export interface OnlineMethodDef {
  id: OnlinePaymentMethod;
  label: string;
  live: boolean;
}

/** Défauts (repli) : aucune méthode n'est encore live sur FedaPay tant que non activée. */
export const DEFAULT_ONLINE_METHODS: OnlineMethodDef[] = [
  { id: "orange", label: "Orange Money", live: false },
  { id: "mtn", label: "MTN MoMo", live: false },
  { id: "wave", label: "Wave", live: false },
  { id: "card", label: "Visa / Mastercard", live: false },
];

export const ONLINE_METHODS: OnlinePaymentMethod[] = ["orange", "mtn", "wave", "card"];

export const ONLINE_METHOD_LABELS: Record<OnlinePaymentMethod, string> = {
  orange: "Orange Money",
  mtn: "MTN MoMo",
  wave: "Wave",
  card: "Visa / Mastercard",
};

/** Libellés de toutes les méthodes de paiement (checkout + admin). */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  orange: "Orange Money",
  mtn: "MTN MoMo",
  wave: "Wave",
  card: "Carte bancaire",
  cod: "Cash à la livraison",
  talk_first: "Nous parler avant de payer",
};

/** Une méthode est-elle « en ligne » (passe par FedaPay) ? */
export function isOnlinePayment(method?: string | null): boolean {
  return !!method && (ONLINE_METHODS as string[]).includes(method);
}

/** Libellés des statuts de paiement (affichage admin + confirmation). */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente de paiement",
  paid: "Payée",
  failed: "Échec",
  cancelled: "Annulée",
};

export function paymentStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return PAYMENT_STATUS_LABELS[status] || status;
}

/** Libellé de méthode de paiement, avec repli sur la valeur brute. */
export function paymentMethodLabel(method?: string | null): string {
  if (!method) return "—";
  return (PAYMENT_METHOD_LABELS as Record<string, string>)[method] || method;
}
