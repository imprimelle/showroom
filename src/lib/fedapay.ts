/**
 * Client FedaPay — paiement en ligne (mobile money, Wave, carte bancaire).
 * Monnaie : FCFA (XOF), montants en entier.
 * Référence : https://docs.fedapay.com — vérifié sur le SDK officiel fedapay-node.
 */

const PRODUCTION_BASE = "https://api.fedapay.com/v1";
const SANDBOX_BASE = "https://sandbox-api.fedapay.com/v1";

function apiBase(): string {
  const override = process.env.FEDAPAY_API_BASE;
  if (override) return override.replace(/\/+$/, "");
  const env = (process.env.FEDAPAY_ENV || "sandbox").toLowerCase();
  return env === "live" || env === "production" ? PRODUCTION_BASE : SANDBOX_BASE;
}

function apiKey(): string {
  return process.env.FEDAPAY_API_KEY || "";
}

export interface FedaPayCustomer {
  firstname: string;
  lastname: string;
  email?: string | null;
  /** Numéro de téléphone (chiffres uniquement, sans « + »). */
  phone?: string | null;
  /** Code pays ISO alpha-2 du numéro (défaut CI). */
  phone_country?: string | null;
}

export interface FedaPayTransaction {
  id: number | string;
  token: string;
  url: string;
  amount?: number;
  status?: string;
}

export interface CreateFedaPayParams {
  description: string;
  /** Montant entier en FCFA (XOF). */
  amount: number;
  /** URL absolue de retour (callback) après paiement. */
  callback_url: string;
  customer?: FedaPayCustomer;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("FEDAPAY_API_KEY non configurée");
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(`FedaPay ${res.status}: ${text.slice(0, 300)}`);
  }
  return data as T;
}

/** Crée une transaction et renvoie l'URL de paiement hébergée + le token. */
export async function createFedaPayTransaction(
  params: CreateFedaPayParams
): Promise<FedaPayTransaction> {
  const body: Record<string, unknown> = {
    description: params.description,
    amount: params.amount,
    currency: { iso: "XOF" },
    callback_url: params.callback_url,
  };

  if (params.customer) {
    const c = params.customer;
    body.customer = {
      firstname: c.firstname,
      lastname: c.lastname,
      email: c.email || null,
      phone_number: c.phone
        ? { number: c.phone.replace(/^\+/, ""), country: (c.phone_country || "CI").toUpperCase() }
        : null,
    };
  }

  const tx = (await request("/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  })) as any;

  let token = typeof tx?.token === "string" ? tx.token : null;
  let url = typeof tx?.url === "string" ? tx.url : null;

  // La création peut ne pas renvoyer le token/url : on les génère explicitement.
  if ((!token || !url) && tx?.id != null) {
    const tok = (await request(`/transactions/${tx.id}/token`, {
      method: "POST",
      body: "{}",
    })) as any;
    token = typeof tok?.token === "string" ? tok.token : token;
    url = typeof tok?.url === "string" ? tok.url : url;
  }

  if (!token) throw new Error("FedaPay : token de transaction manquant");
  if (!url) url = `https://process.fedapay.com/${token}`;

  return { id: tx.id, token, url, amount: tx.amount, status: tx.status };
}

/** Statuts considérés comme « payé » (source : `Transaction.wasPaid()` du SDK officiel). */
const PAID_STATUS = new Set([
  "approved",
  "transferred",
  "refunded",
  "approved_partially_refunded",
  "transferred_partially_refunded",
]);

export function isFedaPayPaid(status?: string | null): boolean {
  return !!status && PAID_STATUS.has(String(status).toLowerCase());
}

/** Récupère le statut d'une transaction (réinterrogation de référence après retour client). */
export async function getFedaPayTransaction(
  id: number | string
): Promise<FedaPayTransaction> {
  const tx = (await request(`/transactions/${id}`)) as any;
  return {
    id: tx.id,
    token: tx.token || "",
    url: tx.url || "",
    amount: tx.amount,
    status: tx.status,
  };
}
