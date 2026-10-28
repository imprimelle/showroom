"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { Package } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  confirmed: "Confirmée",
  in_progress: "En fabrication",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
  contacted: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  confirmed: "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]",
  in_progress: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  delivered: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  cancelled: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
};

export default function CommandesPage() {
  const [orders, setOrders] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/member/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Mes commandes</h1>

      {!orders ? (
        <p className="mt-4 text-sm text-[var(--color-text-tertiary)]">Chargement…</p>
      ) : orders.length === 0 ? (
        <div className="mt-8 text-center py-16">
          <Package className="w-10 h-10 text-[var(--color-text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)]">Aucune commande pour le moment.</p>
          <Link href="/collection" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent-blue)] hover:underline">
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const total = o.total_with_shipping ?? o.total_amount ?? 0;
            return (
              <li key={o.id} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Commande #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[o.status] || ""}`}>
                    {STATUS_LABELS[o.status] || o.status || "—"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  {" · "}
                  {items.map((i: any) => i.product_name).join(", ") || "—"}
                </p>
                <p className="mt-2 text-sm font-mono font-bold text-[var(--color-text-primary)]">{formatFCFA(total)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
