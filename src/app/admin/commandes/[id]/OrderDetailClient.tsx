"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatFCFA } from "@/lib/utils";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import type { OrderStatus } from "@/types";

const statusTransitions: Record<string, { label: string; next: OrderStatus }[]> = {
  new: [{ label: "Marquer comme contactée", next: "contacted" }, { label: "Annuler", next: "cancelled" }],
  contacted: [{ label: "Confirmer", next: "confirmed" }, { label: "Annuler", next: "cancelled" }],
  confirmed: [{ label: "Lancer la fabrication", next: "in_progress" }],
  in_progress: [{ label: "Marquer comme livrée", next: "delivered" }],
  delivered: [],
  cancelled: [],
};

export function OrderDetailClient({ order }: { order: any }) {
  const router = useRouter();
  const [notes, setNotes] = useState(order.notes || "");
  const [saving, setSaving] = useState(false);

  const updateStatus = async (nextStatus: OrderStatus) => {
    await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
  };

  const transitions = statusTransitions[order.status] || [];
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="max-w-2xl">
      <Link href="/admin/commandes" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Commandes
      </Link>

      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">
        <span className="font-mono text-lg text-[var(--color-text-tertiary)]">{order.id.slice(0, 8).toUpperCase()}</span>
      </h1>

      {/* Status */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={order.status as any}>{order.status}</Badge>
        </div>
        {transitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <Button key={t.next} variant={t.next === "cancelled" ? "danger" : "primary"} size="sm" onClick={() => updateStatus(t.next)}>
                {t.label}
              </Button>
            ))}
          </div>
        )}
      </section>

      {/* Customer */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Client</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-[var(--color-text-tertiary)]">Nom</dt><dd className="text-[var(--color-text-primary)]">{order.customer_name}</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--color-text-tertiary)]">Téléphone</dt><dd className="text-[var(--color-text-primary)]">
            {order.customer_phone}
            <a href={`tel:${order.customer_phone}`} className="ml-2 text-[var(--color-accent-blue)]"><Phone className="w-3.5 h-3.5 inline" /></a>
            <a href={`https://wa.me/${order.customer_phone.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-[#25D366]"><MessageCircle className="w-3.5 h-3.5 inline" /></a>
          </dd></div>
          <div className="flex justify-between"><dt className="text-[var(--color-text-tertiary)]">Ville</dt><dd className="text-[var(--color-text-primary)]">{order.customer_city}</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--color-text-tertiary)]">Adresse</dt><dd className="text-[var(--color-text-primary)] text-right max-w-[250px]">{order.customer_address}</dd></div>
          {order.customer_email && <div className="flex justify-between"><dt className="text-[var(--color-text-tertiary)]">Email</dt><dd className="text-[var(--color-text-primary)]">{order.customer_email}</dd></div>}
        </dl>
      </section>

      {/* Items */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Commande</h2>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm py-1.5 border-b border-[var(--color-border-default)] last:border-0">
            <div>
              <span className="text-[var(--color-text-primary)]">{item.product_name}</span>
              <span className="text-[var(--color-text-tertiary)] ml-2">{item.variant_label} × {item.quantity}</span>
            </div>
            <span className="font-mono text-[var(--color-text-primary)]">{formatFCFA(item.subtotal_fcfa || item.unit_price_fcfa * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-[var(--color-border-default)]">
          <span>Total</span>
          <span className="font-mono">{formatFCFA(order.total_amount)}</span>
        </div>
      </section>

      {/* Paiement & livraison */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Paiement & livraison</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-tertiary)]">Méthode</dt>
            <dd className="text-[var(--color-text-primary)]">
              {paymentMethodLabel(order.payment_method)}
            </dd>
          </div>
          {order.payment_method && order.payment_method !== "cod" && (
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">Statut paiement</dt>
              <dd className="text-[var(--color-text-primary)]">
                <Badge variant={order.payment_status === "paid" ? "success" : order.payment_status === "failed" ? "danger" : "neutral"}>
                  {paymentStatusLabel(order.payment_status)}
                </Badge>
              </dd>
            </div>
          )}
          {order.payment_reference && (
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">Réf. FedaPay</dt>
              <dd className="text-[var(--color-text-primary)] font-mono text-xs">{String(order.payment_reference)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-tertiary)]">Pays</dt>
            <dd className="text-[var(--color-text-primary)]">{order.shipping_country || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-tertiary)]">Frais de port</dt>
            <dd className="text-[var(--color-text-primary)] font-mono">{formatFCFA(order.shipping_fee_fcfa ?? 0)}</dd>
          </div>
          {order.total_with_shipping != null && (
            <div className="flex justify-between font-semibold">
              <dt className="text-[var(--color-text-primary)]">Total TTC (avec livraison)</dt>
              <dd className="text-[var(--color-text-primary)] font-mono">{formatFCFA(order.total_with_shipping)}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] resize-none focus:outline-none focus:border-[var(--color-accent-blue)]"
          placeholder="Notes sur la commande..."
        />
        <Button variant="secondary" size="sm" onClick={saveNotes} disabled={saving} className="mt-2">
          <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "..." : "Enregistrer"}
        </Button>
      </section>

      {/* Meta */}
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Créée le {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
