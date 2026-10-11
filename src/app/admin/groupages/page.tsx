import { createAdminClient } from "@/lib/supabase/admin";
import { GroupagesListClient } from "./GroupagesListClient";

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

  // Noms de produits.
  const productIds = [...new Set(list.map((g) => g.product_id))];
  const { data: products } = productIds.length
    ? await admin.from("products").select("id, name, slug").in("id", productIds)
    : { data: [] };
  const nameById = new Map<string, string>(
    ((products as any[]) || []).map((p) => [p.id, p.name])
  );

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
