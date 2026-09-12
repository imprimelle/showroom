import { createAdminClient } from "@/lib/supabase/admin";
import { Package, ClipboardList, Clock, TrendingUp, Banknote } from "lucide-react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const admin = createAdminClient();

  const [ordersMonth, pendingOrders, ordersToday, productsCount] = await Promise.all([
    admin.from("showcase_orders").select("id", { count: "exact", head: true }).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    admin.from("showcase_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("showcase_orders").select("id", { count: "exact", head: true }).gte("created_at", new Date().toISOString().split("T")[0]),
    admin.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);

  const { data: recentOrders } = await admin
    .from("showcase_orders")
    .select("id, customer_name, customer_phone, total_amount, status, items, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Revenue over last 30 days
  const since30 = new Date();
  since30.setHours(0, 0, 0, 0);
  since30.setDate(since30.getDate() - 29);

  const { data: orders30 } = await admin
    .from("showcase_orders")
    .select("total_amount, status, created_at")
    .gte("created_at", since30.toISOString());

  const days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(since30);
    d.setDate(since30.getDate() + i);
    days.push({ date: d.toISOString().slice(0, 10), total: 0 });
  }
  const byDay = new Map(days.map((d) => [d.date, 0]));
  for (const o of orders30 || []) {
    if (o.status === "cancelled") continue;
    const date = (o.created_at || "").slice(0, 10);
    if (byDay.has(date)) byDay.set(date, byDay.get(date)! + (o.total_amount || 0));
  }
  const revenueByDay = days.map((d) => ({ date: d.date, total: byDay.get(d.date) || 0 }));
  const revenue30 = revenueByDay.reduce((sum, d) => sum + d.total, 0);

  return {
    ordersMonth: ordersMonth.count || 0,
    pendingOrders: pendingOrders.count || 0,
    ordersToday: ordersToday.count || 0,
    productsCount: productsCount.count || 0,
    recentOrders: recentOrders || [],
    revenue30,
    revenueByDay,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Commandes ce mois", value: stats.ordersMonth, icon: ClipboardList, color: "border-l-[var(--color-accent-blue)]" },
    { label: "En attente", value: stats.pendingOrders, icon: Clock, color: "border-l-[var(--color-warning)]" },
    { label: "Aujourd'hui", value: stats.ordersToday, icon: TrendingUp, color: "border-l-[var(--color-success)]" },
    { label: "Produits publiés", value: stats.productsCount, icon: Package, color: "border-l-[var(--color-accent-amber)]" },
  ];

  const statusLabels: Record<string, string> = {
    new: "Nouveau", contacted: "Contacté", confirmed: "Confirmé",
    in_progress: "En cours", delivered: "Livré", cancelled: "Annulé",
  };

  const maxRevenue = Math.max(1, ...stats.revenueByDay.map((d) => d.total));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className={`p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)] border-l-[3px] ${card.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-tertiary)]">{card.label}</span>
              <card.icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1 font-mono">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Chiffre d&apos;affaires</h2>
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
            <Banknote className="w-4 h-4" /> 30 derniers jours
          </span>
        </div>
        <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mb-4">{formatFCFA(stats.revenue30)}</p>

        <div className="flex items-end gap-[3px] h-32">
          {stats.revenueByDay.map((d) => (
            <div
              key={d.date}
              title={`${d.date} — ${formatFCFA(d.total)}`}
              className="flex-1 rounded-t transition-opacity hover:opacity-70"
              style={{
                height: `${Math.max(3, Math.round((d.total / maxRevenue) * 100))}%`,
                backgroundColor: d.total > 0 ? "var(--color-accent-amber)" : "var(--color-bg-tertiary)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Commandes récentes</h2>
          <Link href="/admin/commandes" className="text-sm text-[var(--color-accent-blue)] hover:underline">Voir tout</Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)] py-8 text-center">Aucune commande pour le moment</p>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order: any) => (
              <Link
                key={order.id}
                href={`/admin/commandes/${order.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {order.customer_name} · {(order.items as any[])?.[0]?.product_name || "Commande"}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-bold">{order.total_amount.toLocaleString()} FCFA</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
