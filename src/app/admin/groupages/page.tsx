import { createAdminClient } from "@/lib/supabase/admin";
import { GroupagesListClient } from "./GroupagesListClient";
import { GROUPAGE_MAX_DURATION_DAYS, groupageAgeDays, groupageDaysRemaining } from "@/lib/groupage";

export const dynamic = "force-dynamic";

interface OrderRow {
  id: string;
  customer_name: string;
  total_amount: number;
  deposit_fcfa: number | null;
  balance_fcfa: number | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  groupage_id: string;
}

export default async function AdminGroupagesPage() {
  const admin = createAdminClient();

  const { data: groupages } = await admin
    .from("showcase_groupages")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (groupages || []) as any[];

  // Produits (nom + durée de vie max configurée par produit).
  const productIds = [...new Set(list.map((g) => g.product_id))];
  const { data: products } = productIds.length
    ? await admin.from("products").select("id, name, slug, showcase").in("id", productIds)
    : { data: [] };
  const nameById = new Map<string, string>(
    ((products as any[]) || []).map((p) => [p.id, p.name])
  );
  const maxDurationById = new Map<string, number>(
    ((products as any[]) || []).map((p) => [
      p.id,
      typeof p.showcase?.groupage?.max_duration_days === "number" &&
        p.showcase.groupage.max_duration_days > 0
        ? Math.round(p.showcase.groupage.max_duration_days)
        : GROUPAGE_MAX_DURATION_DAYS,
    ])
  );

  // Auto-complétion : les tours ouverts au-delà de leur durée max sont marqués « complétés ».
  const now = new Date();
  const staleOpen = list.filter(
    (g) =>
      g.status === "open" &&
      groupageAgeDays(g.created_at) >= (maxDurationById.get(g.product_id) ?? GROUPAGE_MAX_DURATION_DAYS)
  );
  if (staleOpen.length > 0) {
    await admin
      .from("showcase_groupages")
      .update({ status: "closed", closed_at: now.toISOString() })
      .in("id", staleOpen.map((g) => g.id));
    for (const g of staleOpen) {
      g.status = "closed";
      g.closed_at = now.toISOString();
    }
  }

  // Commandes liées.
  const groupageIds = list.map((g) => g.id);
  const { data: orders } = groupageIds.length
    ? await admin
        .from("showcase_orders")
        .select(
          "id, customer_name, total_amount, deposit_fcfa, balance_fcfa, status, payment_status, created_at, groupage_id"
        )
        .in("groupage_id", groupageIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const ordersByGroupage = new Map<string, OrderRow[]>();
  for (const o of (orders as OrderRow[]) || []) {
    if (!ordersByGroupage.has(o.groupage_id)) ordersByGroupage.set(o.groupage_id, []);
    ordersByGroupage.get(o.groupage_id)!.push(o);
  }

  const enriched = list.map((g) => ({
    ...g,
    product_name: nameById.get(g.product_id) || "Produit supprimé",
    remaining: Math.max(0, g.max_places - g.places_taken),
    shares_count: g.shares_count ?? 0,
    days_remaining:
      g.status === "open"
        ? groupageDaysRemaining(
            g.created_at,
            maxDurationById.get(g.product_id) ?? GROUPAGE_MAX_DURATION_DAYS
          )
        : 0,
    orders: ordersByGroupage.get(g.id) || [],
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Groupages</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {enriched.length} groupage{enriched.length !== 1 ? "s" : ""}
        </p>
      </div>
      <GroupagesListClient groupages={enriched} />
    </div>
  );
}
