import { createAdminClient } from "@/lib/supabase/admin";
import { ResellersListClient } from "./ResellersListClient";
import type { Reseller } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminResellersPage() {
  const admin = createAdminClient();
  const { data: resellers } = await admin
    .from("showcase_resellers")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (resellers || []) as Reseller[];

  // Commandes attribuées (pour afficher le CA / commissions par revendeur).
  const { data: orders } = await admin
    .from("showcase_orders")
    .select("reseller_id, total_amount, commission_fcfa, commission_status")
    .not("reseller_id", "is", null);

  const ordersByReseller = new Map<string, { count: number; revenue: number; earned: number }>();
  for (const o of (orders as any[]) || []) {
    const cur = ordersByReseller.get(o.reseller_id) || { count: 0, revenue: 0, earned: 0 };
    cur.count += 1;
    cur.revenue += Number(o.total_amount) || 0;
    if (o.commission_status === "paid") cur.earned += Number(o.commission_fcfa) || 0;
    ordersByReseller.set(o.reseller_id, cur);
  }

  // Clics par code ref (portée).
  const { data: clicks } = await admin
    .from("showcase_affiliate_clicks")
    .select("ref_code")
    .limit(50000);
  const clicksByRef = new Map<string, number>();
  for (const c of (clicks as any[]) || []) {
    clicksByRef.set(c.ref_code, (clicksByRef.get(c.ref_code) || 0) + 1);
  }

  const enriched = list.map((r) => ({
    ...r,
    stats: ordersByReseller.get(r.id) || { count: 0, revenue: 0, earned: 0 },
    clicks: r.ref_code ? clicksByRef.get(r.ref_code) ?? 0 : 0,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Revendeurs</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {list.length} revendeur{list.length !== 1 ? "s" : ""} · affiliés & points de vente
        </p>
      </div>
      <ResellersListClient resellers={enriched} />
    </div>
  );
}
