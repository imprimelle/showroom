"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Store,
  Check,
  X,
  MapPin,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
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

const STORE_MODELS: Record<string, string> = {
  showroom: "Showroom",
  b2b: "B2B",
  corner: "Corner",
};

type TypeFilter = "all" | "affiliate" | "store";
type StatusFilter = "all" | "pending" | "active" | "suspended" | "rejected";

/** Champs éditables d'un revendeur (formulaire modale). */
interface EditForm {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  ref_code: string;
  promo_code: string;
  promo_discount_percent: string;
  commission_rate: string;
  level: string;
  store_model: string;
  city: string;
  country: string;
  address: string;
  website: string;
  social: string;
  notes: string;
}

const EMPTY_FORM: EditForm = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  ref_code: "",
  promo_code: "",
  promo_discount_percent: "",
  commission_rate: "8",
  level: "standard",
  store_model: "",
  city: "",
  country: "",
  address: "",
  website: "",
  social: "",
  notes: "",
};

function toEditForm(r: ResellerRow): EditForm {
  return {
    name: r.name || "",
    contact_name: r.contact_name || "",
    email: r.email || "",
    phone: r.phone || "",
    ref_code: r.ref_code || "",
    promo_code: r.promo_code || "",
    promo_discount_percent: r.promo_discount_percent != null ? String(r.promo_discount_percent) : "",
    commission_rate: r.commission_rate != null ? String(r.commission_rate) : "8",
    level: r.level || "standard",
    store_model: r.store_model || "",
    city: r.city || "",
    country: r.country || "",
    address: r.address || "",
    website: r.website || "",
    social: r.social || "",
    notes: r.notes || "",
  };
}

export function ResellersListClient({ resellers }: { resellers: ResellerRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Création manuelle
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

  // Édition
  const [editing, setEditing] = useState<ResellerRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);
  const [editError, setEditError] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  // Suppression
  const [confirmDelete, setConfirmDelete] = useState<ResellerRow | null>(null);

  const filtered = resellers.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/resellers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Erreur lors de la mise à jour.");
    return data;
  };

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    setError("");
    try {
      await patch(id, { status });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const approve = async (r: ResellerRow) => {
    setBusy(r.id);
    setError("");
    try {
      if (r.type === "affiliate") {
        // Active + génère ref/promo à partir du nom si absents.
        const refCode = r.ref_code || r.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
        const promoCode = r.promo_code || `${refCode}5`;
        await patch(r.id, { status: "active", ref_code: refCode, promo_code: promoCode });
      } else {
        await patch(r.id, { status: "active" });
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const togglePublish = async (r: ResellerRow) => {
    setBusy(r.id);
    setError("");
    try {
      await patch(r.id, { is_published: !r.is_published });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (r: ResellerRow) => {
    setEditing(r);
    setEditForm(toEditForm(r));
    setEditError("");
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    setEditError("");
    try {
      const body: Record<string, unknown> = {
        name: editForm.name,
        contact_name: editForm.contact_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        commission_rate: editForm.commission_rate ? Number(editForm.commission_rate) : 8,
        level: editForm.level,
        notes: editForm.notes || null,
      };
      if (editing.type === "affiliate") {
        body.ref_code = editForm.ref_code ? editForm.ref_code.toUpperCase() : null;
        body.promo_code = editForm.promo_code ? editForm.promo_code.toUpperCase() : null;
        body.promo_discount_percent = editForm.promo_discount_percent
          ? Number(editForm.promo_discount_percent)
          : null;
      } else {
        body.store_model = editForm.store_model || null;
        body.city = editForm.city || null;
        body.country = editForm.country || null;
        body.address = editForm.address || null;
        body.website = editForm.website || null;
        body.social = editForm.social || null;
      }
      await patch(editing.id, body);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditBusy(false);
    }
  };

  const deleteReseller = async () => {
    if (!confirmDelete) return;
    setBusy(confirmDelete.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/resellers/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de la suppression.");
      }
      setConfirmDelete(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setConfirmDelete(null);
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

  const inputCls =
    "h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]";

  return (
    <div className="space-y-4">
      {/* Filtres + bouton créer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-[var(--color-border-default)] p-1">
            {(["all", "affiliate", "store"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  typeFilter === f
                    ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                )}
              >
                {f === "all" ? "Tous" : f === "affiliate" ? "Affiliés" : "Points de vente"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl border border-[var(--color-border-default)] p-1">
            {(
              [
                ["all", "Tous statuts"],
                ["pending", "En attente"],
                ["active", "Actifs"],
                ["suspended", "Suspendus"],
                ["rejected", "Rejetés"],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === f
                    ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
        >
          + Nouveau revendeur
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-4 py-2.5 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={createReseller} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Créer un revendeur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "affiliate" | "store" })}
              className={inputCls}
            >
              <option value="affiliate">Affilié</option>
              <option value="store">Point de vente</option>
            </select>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nom / commerce" className={inputCls} />
            <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact" className={inputCls} />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inputCls} />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className={inputCls} />
            {form.type === "affiliate" && (
              <>
                <input value={form.ref_code} onChange={(e) => setForm({ ...form, ref_code: e.target.value.toUpperCase() })} placeholder="Code ref (ex. SOPHIE)" className={inputCls} />
                <input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} placeholder="Code promo (ex. SOPHIE5)" className={inputCls} />
                <input value={form.promo_discount_percent} onChange={(e) => setForm({ ...form, promo_discount_percent: e.target.value })} placeholder="Remise promo %" inputMode="numeric" className={inputCls} />
                <input value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} placeholder="Commission %" inputMode="numeric" className={inputCls} />
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
          Aucun revendeur ne correspond aux filtres. Les candidatures du site apparaîtront ici, ou créez-en un manuellement.
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_BADGE[r.status])}>
                {STATUS_LABELS[r.status] || r.status}
              </span>
              {r.status === "pending" && (
                <>
                  <button
                    onClick={() => approve(r)}
                    disabled={busy === r.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-success)] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approuver
                  </button>
                  <button
                    onClick={() => setStatus(r.id, "rejected")}
                    disabled={busy === r.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-error)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error-soft)] disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Rejeter
                  </button>
                </>
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
              {(r.status === "suspended" || r.status === "rejected") && (
                <button
                  onClick={() => setStatus(r.id, "active")}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Réactiver
                </button>
              )}
              <button
                onClick={() => openEdit(r)}
                disabled={busy === r.id}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
              <button
                onClick={() => setConfirmDelete(r)}
                disabled={busy === r.id}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:border-[var(--color-error)] disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
                  <span className="text-[var(--color-text-secondary)]">Modèle : {STORE_MODELS[r.store_model] || r.store_model}</span>
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

      {/* Modale d'édition */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                Modifier · {editing.name}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                  Nom / commerce *
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className={inputCls} />
                </label>
                <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                  Personne à contacter
                  <input value={editForm.contact_name} onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                  Email
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                  Téléphone
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} />
                </label>

                {editing.type === "affiliate" ? (
                  <>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Code ref
                      <input value={editForm.ref_code} onChange={(e) => setEditForm({ ...editForm, ref_code: e.target.value.toUpperCase() })} className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Code promo
                      <input value={editForm.promo_code} onChange={(e) => setEditForm({ ...editForm, promo_code: e.target.value.toUpperCase() })} className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Remise promo (%)
                      <input value={editForm.promo_discount_percent} onChange={(e) => setEditForm({ ...editForm, promo_discount_percent: e.target.value })} inputMode="numeric" className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Commission (%)
                      <input value={editForm.commission_rate} onChange={(e) => setEditForm({ ...editForm, commission_rate: e.target.value })} inputMode="numeric" className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Niveau
                      <select value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} className={inputCls}>
                        <option value="standard">Standard</option>
                        <option value="performance">Performance</option>
                        <option value="vip">VIP</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Modèle de partenariat
                      <select value={editForm.store_model} onChange={(e) => setEditForm({ ...editForm, store_model: e.target.value })} className={inputCls}>
                        <option value="">—</option>
                        <option value="showroom">Showroom</option>
                        <option value="b2b">B2B</option>
                        <option value="corner">Corner</option>
                      </select>
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Ville
                      <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Pays
                      <input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Site web
                      <input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
                      Réseau social
                      <input value={editForm.social} onChange={(e) => setEditForm({ ...editForm, social: e.target.value })} className={inputCls} />
                    </label>
                    <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1 sm:col-span-2">
                      Adresse
                      <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className={inputCls} />
                    </label>
                  </>
                )}

                <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1 sm:col-span-2">
                  Notes internes
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-3 text-sm" />
                </label>
              </div>

              {editError && <p className="text-sm text-[var(--color-error)]">{editError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
                  Annuler
                </button>
                <button type="submit" disabled={editBusy} className="rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] px-4 py-2 text-sm font-medium disabled:opacity-50">
                  {editBusy ? "…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">Supprimer ce revendeur ?</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              « {confirmDelete.name} » sera définitivement supprimé. Les commandes déjà attribuées
              conserveront leur référence (le lien est mis à null). Cette action est irréversible.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
                Annuler
              </button>
              <button onClick={deleteReseller} disabled={busy === confirmDelete.id} className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy === confirmDelete.id ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
