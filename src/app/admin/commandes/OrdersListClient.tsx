"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatFCFA, cn } from "@/lib/utils";
import type { ShowcaseOrder } from "@/types";

const statusFilters = ["all", "new", "contacted", "confirmed", "in_progress", "delivered", "cancelled"] as const;
const statusLabels: Record<string, string> = {
  all: "Toutes", new: "Nouvelles", contacted: "Contactées", confirmed: "Confirmées",
  in_progress: "En cours", delivered: "Livrées", cancelled: "Annulées",
};

export function OrdersListClient({ orders }: { orders: ShowcaseOrder[] }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {statusFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === f ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-default)]"
            )}
          >
            {statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((order) => (
          <Link key={order.id} href={`/admin/commandes/${order.id}`} className="block p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:border-[var(--color-border-strong)] transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--color-text-tertiary)]">{order.id.slice(0, 8).toUpperCase()}</span>
                <Badge variant={order.status as any}>{statusLabels[order.status]}</Badge>
              </div>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{order.customer_name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{order.customer_phone} · {order.customer_city}</p>
            <p className="text-sm font-bold font-mono text-[var(--color-text-primary)] mt-1">{formatFCFA(order.total_amount)}</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--color-text-tertiary)] text-sm">Aucune commande trouvée</div>
        )}
      </div>
    </div>
  );
}
