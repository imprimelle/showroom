"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA, cn } from "@/lib/utils";

interface CommissionRow {
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
  reseller_name: string;
}

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  earned: "Acquise",
  paid: "Versée",
  cancelled: "Annulée",
};

const COMMISSION_STATUS_BADGE: Record<string, string> = {
  pending: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  earned: "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]",
  paid: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  cancelled: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
};

export function CommissionsListClient({
  commissions,
  totals,
}: {
  commissions: CommissionRow[];
  totals: { pending_fcfa: number; earned_fcfa: number; paid_fcfa: number };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "earned" | "paid" | "cancelled">("all");

  const filtered = commissions.filter((c) =>
    filter === "all" ? true : (c.commission_status || "pending") === filter
  );

  const setStatus = async (orderId: string, status: string) => {
    setBusy(orderId);
    try {
      await fetch(`/api/admin/commissions/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">En attente</p>
          <p className="font-mono text-xl font-bold text-[var(--color-accent-amber)]">{formatFCFA(totals.pending_fcfa)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">Acquises (à verser)</p>
          <p className="font-mono text-xl font-bold text-[var(--color-accent-blue)]">{formatFCFA(totals.earned_fcfa)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">Versées</p>
          <p className="font-mono text-xl font-bold text-[var(--color-success)]">{formatFCFA(totals.paid_fcfa)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--color-border-default)] p-1 w-fit">
        {(["all", "pending", "earned", "paid", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            )}
          >
            {f === "all" ? "Toutes" : COMMISSION_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-tertiary)]">Aucune commission pour ce filtre.</p>
      )}

      <div className="space-y-2">
        {filtered.map((c) => {
          const status = c.commission_status || "pending";
          return (
            <div key={c.id} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {c.reseller_name}{" "}
                    <span className="font-normal text-[var(--color-text-tertiary)]">· #{c.id.slice(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {c.customer_name} · {new Date(c.created_at).toLocaleDateString("fr-FR")} · commande {c.status || "—"} · paiement {c.payment_status || "—"}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", COMMISSION_STATUS_BADGE[status])}>
                  {COMMISSION_STATUS_LABELS[status] || status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-default)] pt-2">
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                  <span>CA : <strong className="text-[var(--color-text-primary)]">{formatFCFA(c.total_amount)}</strong></span>
                  {c.promo_discount_fcfa ? <span>Remise : −{formatFCFA(c.promo_discount_fcfa)}</span> : null}
                  <span>Taux : <strong className="text-[var(--color-text-primary)]">{c.commission_rate ?? "—"}%</strong></span>
                  <span>Commission : <strong className="text-[var(--color-accent-amber)]">{formatFCFA(c.commission_fcfa || 0)}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  {status === "pending" && (
                    <button
                      onClick={() => setStatus(c.id, "earned")}
                      disabled={busy === c.id}
                      className="rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
                    >
                      Marquer acquise
                    </button>
                  )}
                  {(status === "pending" || status === "earned") && (
                    <button
                      onClick={() => setStatus(c.id, "paid")}
                      disabled={busy === c.id}
                      className="rounded-lg bg-[var(--color-success)] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Marquer versée
                    </button>
                  )}
                  {(status === "pending" || status === "earned") && (
                    <button
                      onClick={() => setStatus(c.id, "cancelled")}
                      disabled={busy === c.id}
                      className="rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
