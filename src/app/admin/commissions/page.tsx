import { createAdminClient } from "@/lib/supabase/admin";
import { CommissionsListClient } from "./CommissionsListClient";

export const dynamic = "force-dynamic";

interface CommissionOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  promo_discount_fcfa: number | null;
  commission_rate: number | null;
  commission_fcfa: number | null;
  commission_status: string | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  reseller_id: string;
}

export default async function AdminCommissionsPage() {
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("showcase_orders")
    .select(
      "id, customer_name, total_amount, promo_discount_fcfa, commission_rate, commission_fcfa, commission_status, payment_status, status, created_at, reseller_id"
    )
    .not("reseller_id", "is", null)
    .order("created_at", { ascending: false });

  const commissions = (orders || []) as CommissionOrder[];

  // Nom des revendeurs pour l'affichage.
  const resellerIds = [...new Set(commissions.map((c) => c.reseller_id))];
  const { data: resellers } = resellerIds.length
    ? await admin.from("showcase_resellers").select("id, name, type").in("id", resellerIds)
    : { data: [] };
  const nameById = new Map<string, string>(((resellers as any[]) || []).map((r) => [r.id, r.name]));

  const enriched = commissions.map((c) => ({
    ...c,
    reseller_name: nameById.get(c.reseller_id) || "Revendeur supprimé",
  }));

  // Agrégats.
  const totals = { pending_fcfa: 0, earned_fcfa: 0, paid_fcfa: 0 };
  for (const c of enriched) {
    const amount = Number(c.commission_fcfa) || 0;
    if (c.commission_status === "paid") totals.paid_fcfa += amount;
    else if (c.commission_status === "earned") totals.earned_fcfa += amount;
    else totals.pending_fcfa += amount;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Commissions</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {enriched.length} commande{enriched.length !== 1 ? "s" : ""} attribuée{enriched.length !== 1 ? "s" : ""} à un revendeur
        </p>
      </div>
      <CommissionsListClient commissions={enriched} totals={totals} />
    </div>
  );
}
