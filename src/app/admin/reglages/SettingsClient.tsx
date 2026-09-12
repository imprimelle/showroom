"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save } from "lucide-react";

export function SettingsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const update = (path: string, value: string) => {
    const keys = path.split(".");
    const newData = { ...data };
    let obj = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setData(newData);
  };

  const getVal = (path: string): string => {
    const keys = path.split(".");
    let obj = data;
    for (const k of keys) {
      if (!obj || typeof obj !== "object") return "";
      obj = obj[k];
    }
    return String(obj || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (res.ok) setMessage("✓ Réglages enregistrés");
      else setMessage("Erreur");
    } catch { setMessage("Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">Réglages</h1>

      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Coordonnées</h2>
        <Input label="WhatsApp" value={getVal("contact.whatsapp")} onChange={(e) => update("contact.whatsapp", e.target.value)} placeholder="225XXXXXXXXX" />
        <div className="mt-3"><Input label="Email" value={getVal("contact.email")} onChange={(e) => update("contact.email", e.target.value)} placeholder="contact@imprimelle.ci" /></div>
        <div className="mt-3"><Input label="Adresse" value={getVal("contact.address")} onChange={(e) => update("contact.address", e.target.value)} placeholder="Abidjan, Cocody..." /></div>
      </section>

      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Méta site</h2>
        <Input label="Nom du site" value={getVal("meta.site_name")} onChange={(e) => update("meta.site_name", e.target.value)} />
        <div className="mt-3"><Input label="Domaine" value={getVal("meta.domain")} onChange={(e) => update("meta.domain", e.target.value)} /></div>
        <div className="mt-3"><Input label="Titre par défaut" value={getVal("meta.default_title")} onChange={(e) => update("meta.default_title", e.target.value)} /></div>
        <div className="mt-3"><Input label="Meta description" value={getVal("meta.default_description")} onChange={(e) => update("meta.default_description", e.target.value)} /></div>
      </section>

      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Réseaux sociaux</h2>
        <Input label="Facebook" value={getVal("social.facebook")} onChange={(e) => update("social.facebook", e.target.value)} />
        <div className="mt-3"><Input label="Instagram" value={getVal("social.instagram")} onChange={(e) => update("social.instagram", e.target.value)} /></div>
        <div className="mt-3"><Input label="TikTok" value={getVal("social.tiktok")} onChange={(e) => update("social.tiktok", e.target.value)} /></div>
      </section>

      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Page d'accueil</h2>
        <Input label="Titre Hero" value={getVal("hero.title")} onChange={(e) => update("hero.title", e.target.value)} />
        <div className="mt-3"><Input label="Sous-titre Hero" value={getVal("hero.subtitle")} onChange={(e) => update("hero.subtitle", e.target.value)} /></div>
        <div className="mt-3"><Input label="Texte CTA" value={getVal("hero.cta_text")} onChange={(e) => update("hero.cta_text", e.target.value)} /></div>
      </section>

      <div className="flex items-center gap-3 mb-8">
        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        {message && <span className="text-sm text-[var(--color-success)]">{message}</span>}
      </div>
    </div>
  );
}
