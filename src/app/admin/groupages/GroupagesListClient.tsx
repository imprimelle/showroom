"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Lock } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";

interface OrderRef {
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

interface GroupageRow {
  id: string;
  product_id: string;
  product_name: string;
  round: number;
  status: "open" | "full" | "closed";
  max_places: number;
  places_taken: number;
  reduction_fcfa: number;
  group_price_fcfa: number;
  deposit_fcfa: number | null;
  created_at: string;
  closed_at: string | null;
  remaining: number;
  shares_count: number;
  days_remaining: number;
  orders: OrderRef[];
}

const STATUS_LABELS: Record<string, string> = {
  open: "En cours",
  full: "Complet",
  closed: "Clôturé",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  full: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  closed: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
};

export function GroupagesListClient({ groupages }: { groupages: GroupageRow[] }) {
  const router = useRouter();
  const [closing, setClosing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const closeGroupage = async (id: string) => {
    setClosing(id);
    try {
      const res = await fetch(`/api/admin/groupages/${id}`, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setClosing(null);
    }
  };

  if (groupages.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-tertiary)]">
        Aucun groupage pour le moment. Activez le groupage sur un produit (onglet Variantes → Groupage) pour qu&apos;il apparaisse ici.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groupages.map((g) => {
        const pct = Math.min(100, (g.places_taken / g.max_places) * 100);
        const canClose = g.status === "open";
        const isExpanded = expanded === g.id;
        return (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
            {/* En-tête */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{g.product_name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Tour n°{g.round} ·{" "}
                  {g.deposit_fcfa != null
                    ? `${formatFCFA(g.deposit_fcfa)} d&apos;acompte`
                    : "paiement total"}{" "}
                  · créé le {new Date(g.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_BADGE[g.status])}>
                  {STATUS_LABELS[g.status] || g.status}
                </span>
                {canClose && (
                  <button
                    type="button"
                    onClick={() => closeGroupage(g.id)}
                    disabled={closing === g.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {closing === g.id ? "…" : "Clôturer"}
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-3">
              {/* Jauge */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    <Users className="mr-1 inline h-4 w-4" />
                    {g.places_taken} / {g.max_places} places
                  </span>
                  <span className="font-semibold text-[var(--color-accent-amber)]">{g.remaining} restantes</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border-strong)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent-amber)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Prix */}
              <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  Prix groupé : <span className="font-mono font-semibold text-[var(--color-text-primary)]">{formatFCFA(g.group_price_fcfa)}</span>
                </span>
                {g.reduction_fcfa > 0 && (
                  <span className="text-[var(--color-text-secondary)]">
                    Réduction : <span className="font-mono font-semibold text-[var(--color-success)]">−{formatFCFA(g.reduction_fcfa)}</span>
                  </span>
                )}
                <span className="text-[var(--color-text-secondary)]">
                  Commandes : <span className="font-semibold text-[var(--color-text-primary)]">{g.orders.length}</span>
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  Partages : <span className="font-semibold text-[var(--color-text-primary)]">{g.shares_count}</span>
                </span>
                {g.status === "open" && (
                  <span className="text-[var(--color-text-secondary)]">
                    Délai restant : <span className="font-semibold text-[var(--color-accent-amber)]">{g.days_remaining} j</span>
                  </span>
                )}
              </div>

              {/* Commandes liées */}
              {g.orders.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : g.id)}
                    className="text-xs font-medium text-[var(--color-accent-blue)]"
                  >
                    {isExpanded ? "Masquer" : "Voir"} les commandes liées ({g.orders.length})
                  </button>
                  {isExpanded && (
                    <ul className="mt-2 space-y-2">
                      {g.orders.map((o) => (
                        <li key={o.id} className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[var(--color-text-primary)]">#{o.id.slice(0, 8).toUpperCase()}</span>
                            <span className="text-[var(--color-text-secondary)]">{o.customer_name}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[var(--color-text-tertiary)]">
                            <span>Total : {formatFCFA(o.total_amount)}</span>
                            {o.deposit_fcfa != null && <span>Acompte : {formatFCFA(o.deposit_fcfa)}</span>}
                            {o.balance_fcfa != null && <span>Solde : {formatFCFA(o.balance_fcfa)}</span>}
                            <span>Statut : {o.status || "—"}</span>
                            <span>Paiement : {o.payment_status || "—"}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
