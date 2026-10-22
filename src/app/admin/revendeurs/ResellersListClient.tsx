"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Store, Check, X, MapPin } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";
import type { Reseller } from "@/types";

interface ResellerRow extends Reseller {
  stats: { count: number; revenue: number; earned: number };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  suspended: "Suspendu",
  rejected: "Rejeté",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  active: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  suspended: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
  rejected: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
};

const LEVEL_LABELS: Record<string, string> = {
  standard: "Standard",
  performance: "Performance",
  vip: "VIP",
};

export function ResellersListClient({ resellers }: { resellers: ResellerRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "affiliate" | "store">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "affiliate" as "affiliate" | "store",
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    ref_code: "",
    promo_code: "",
    promo_discount_percent: "5",
    commission_rate: "8",
  });
  const [formError, setFormError] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const filtered = resellers.filter((r) => (filter === "all" ? true : r.type === filter));

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/resellers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const approveAffiliate = async (r: ResellerRow) => {
    // Active + génère un code ref à partir du nom si absent.
    const refCode = r.ref_code || r.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    const promoCode = r.promo_code || `${refCode}5`;
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/resellers/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", ref_code: refCode, promo_code: promoCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Erreur lors de l'approbation.");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const togglePublish = async (r: ResellerRow) => {
    setBusy(r.id);
    try {
      await fetch(`/api/admin/resellers/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !r.is_published }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const createReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormBusy(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          status: "active",
          name: form.name,
          contact_name: form.contact_name,
          email: form.email,
          phone: form.phone,
          ref_code: form.ref_code || null,
          promo_code: form.promo_code || null,
          promo_discount_percent: form.promo_discount_percent ? Number(form.promo_discount_percent) : null,
          commission_rate: Number(form.commission_rate) || 8,
          level: "standard",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.error || "Erreur lors de la création.");
      } else {
        setShowForm(false);
        setForm({ type: "affiliate", name: "", contact_name: "", email: "", phone: "", ref_code: "", promo_code: "", promo_discount_percent: "5", commission_rate: "8" });
        router.refresh();
      }
    } finally {
      setFormBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres + bouton créer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-[var(--color-border-default)] p-1">
          {(["all", "affiliate", "store"] as const).map((f) => (
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
              {f === "all" ? "Tous" : f === "affiliate" ? "Affiliés" : "Points de vente"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
        >
          + Nouveau revendeur
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={createReseller} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Créer un revendeur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "affiliate" | "store" })}
              className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm"
            >
              <option value="affiliate">Affilié</option>
              <option value="store">Point de vente</option>
            </select>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nom / commerce" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
            <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
            {form.type === "affiliate" && (
              <>
                <input value={form.ref_code} onChange={(e) => setForm({ ...form, ref_code: e.target.value.toUpperCase() })} placeholder="Code ref (ex. SOPHIE)" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
                <input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} placeholder="Code promo (ex. SOPHIE5)" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
                <input value={form.promo_discount_percent} onChange={(e) => setForm({ ...form, promo_discount_percent: e.target.value })} placeholder="Remise promo %" inputMode="numeric" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
                <input value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} placeholder="Commission %" inputMode="numeric" className="h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm" />
              </>
            )}
          </div>
          {formError && <p className="mt-3 text-sm text-[var(--color-error)]">{formError}</p>}
          <button type="submit" disabled={formBusy} className="mt-4 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] px-4 py-2 text-sm font-medium disabled:opacity-50">
            {formBusy ? "…" : "Créer"}
          </button>
        </form>
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Aucun revendeur. Les candidatures du site apparaîtront ici, ou créez-en un manuellement.
        </p>
      )}

      {filtered.map((r) => (
        <div key={r.id} className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {r.type === "affiliate" ? <Link2 className="w-4 h-4 text-[var(--color-accent-amber)]" /> : <Store className="w-4 h-4 text-[var(--color-accent-amber)]" />}
                {r.name}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {r.type === "affiliate" ? "Affilié" : "Point de vente"} ·{" "}
                {r.email || r.phone || "—"} · créé le {new Date(r.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_BADGE[r.status])}>
                {STATUS_LABELS[r.status] || r.status}
              </span>
              {r.type === "affiliate" && r.status === "pending" && (
                <button
                  onClick={() => approveAffiliate(r)}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-success)] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Approuver
                </button>
              )}
              {r.status === "active" && (
                <button
                  onClick={() => setStatus(r.id, "suspended")}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" /> Suspendre
                </button>
              )}
              {r.status === "suspended" && (
                <button
                  onClick={() => setStatus(r.id, "active")}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Réactiver
                </button>
              )}
            </div>
          </div>

          <div className="px-4 py-3 space-y-2">
            {r.type === "affiliate" ? (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  Ref : <code className="font-mono font-semibold text-[var(--color-text-primary)]">{r.ref_code || "—"}</code>
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  Promo : <code className="font-mono font-semibold text-[var(--color-text-primary)]">{r.promo_code || "—"}</code>
                  {r.promo_discount_percent ? ` (−${r.promo_discount_percent}%)` : ""}
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  Commission : <span className="font-mono font-semibold text-[var(--color-accent-amber)]">{r.commission_rate}%</span>
                  {" "}({LEVEL_LABELS[r.level || "standard"] || "Standard"})
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  <MapPin className="inline w-3.5 h-3.5 mr-1" />
                  {[r.city, r.country].filter(Boolean).join(", ") || "Lieu non renseigné"}
                </span>
                {r.store_model && (
                  <span className="text-[var(--color-text-secondary)]">Modèle : {r.store_model}</span>
                )}
                {r.lat != null && r.lng != null ? (
                  <span className="text-[var(--color-success)]">Géolocalisé ✓</span>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">Non géolocalisé</span>
                )}
                <button
                  onClick={() => togglePublish(r)}
                  disabled={busy === r.id}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    r.is_published ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                  )}
                >
                  {r.is_published ? "Publié (carte)" : "Masqué"}
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-text-tertiary)] border-t border-[var(--color-border-default)] pt-2">
              <span>Commandes : <strong className="text-[var(--color-text-primary)]">{r.stats.count}</strong></span>
              <span>CA généré : <strong className="text-[var(--color-text-primary)]">{formatFCFA(r.stats.revenue)}</strong></span>
              <span>Commissions payées : <strong className="text-[var(--color-success)]">{formatFCFA(r.stats.earned)}</strong></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
