import { createAdminClient } from "@/lib/supabase/admin";
import { OrdersListClient } from "./OrdersListClient";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  confirmed: "Confirmé",
  in_progress: "En cours",
  delivered: "Livré",
  cancelled: "Annulé",
};

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("showcase_orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Commandes</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{orders?.length || 0} commande{orders?.length !== 1 ? "s" : ""}</p>
      </div>
      <OrdersListClient orders={orders || []} />
    </div>
  );
}
