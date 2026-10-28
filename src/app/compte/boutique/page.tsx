"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, MapPin, Save } from "lucide-react";

interface StoreData {
  id: string;
  name: string;
  status: string;
  city: string | null;
  country: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  is_published: boolean;
  store_model: string | null;
  website: string | null;
  social: string | null;
}

export default function BoutiquePage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", city: "", country: "", address: "", website: "", social: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/member/store")
      .then((r) => r.json())
      .then((d) => {
        if (d?.store) {
          setStore(d.store);
          setForm({
            name: d.store.name || "",
            city: d.store.city || "",
            country: d.store.country || "",
            address: d.store.address || "",
            website: d.store.website || "",
            social: d.store.social || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--color-text-tertiary)]">Chargement…</p>;

  if (!store) {
    return (
      <div className="text-center py-16">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Mon point de vente</h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Aucun point de vente lié à ce compte.</p>
        <Link href="/revendeurs" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent-blue)] hover:underline">
          Devenir point de vente →
        </Link>
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/member/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          city: form.city || null,
          country: form.country || null,
          address: form.address || null,
          website: form.website || null,
          social: form.social || null,
        }),
      });
      if (res.ok) setMsg("Informations enregistrées ✓");
      else setMsg("Erreur lors de l'enregistrement.");
    } catch {
      setMsg("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
        <Store className="w-6 h-6 text-[var(--color-accent-amber)]" /> {store.name}
      </h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
          Statut : {store.status}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${store.is_published ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"}`}>
          {store.is_published ? "Publié sur la carte" : "En attente de publication"}
        </span>
        {store.lat != null && store.lng != null && (
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-[var(--color-success-soft)] text-[var(--color-success)] inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Géolocalisé
          </span>
        )}
      </div>

      <form onSubmit={save} className="mt-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Informations du point de vente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
            Nom du commerce
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
          </label>
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
            Ville
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
          </label>
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
            Pays
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
          </label>
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
            Site web
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} />
          </label>
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1 sm:col-span-2">
            Adresse
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Quartier, rue, point de repère" className={inputCls} />
          </label>
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1 sm:col-span-2">
            Réseau social
            <input value={form.social} onChange={(e) => setForm({ ...form, social: e.target.value })} placeholder="@votre_compte" className={inputCls} />
          </label>
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          La géolocalisation et la publication sur la carte sont gérées par l&apos;équipe Imprimelle après validation.
        </p>
        {msg && <p className="text-sm text-[var(--color-success)]">{msg}</p>}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] px-4 py-2 text-sm font-medium disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
