"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatFCFA } from "@/lib/utils";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { ShowcaseProduct } from "@/lib/products";

const deliveries = ["3-5 jours", "5-7 jours", "7-10 jours", "10-14 jours", "14-21 jours"];
const usages = ["extérieur", "intérieur", "les deux"];

export function ProductEditClient({ product }: { product: ShowcaseProduct }) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(product.is_published);
  const [popularity, setPopularity] = useState(product.showcase?.popularity || 0);
  const [shortDescription, setShortDescription] = useState(product.showcase?.short_description || "");
  const [highlights, setHighlights] = useState<string[]>(product.showcase?.highlights || []);
  const [newHighlight, setNewHighlight] = useState("");
  const [category, setCategory] = useState(product.showcase?.category || "");
  const [family, setFamily] = useState(product.showcase?.family || "");
  const [delivery, setDelivery] = useState(product.showcase?.delivery_time || "");
  const [usage, setUsage] = useState(product.showcase?.usage || "");
  const [seoTitle, setSeoTitle] = useState(product.showcase?.seo?.title || "");
  const [seoDesc, setSeoDesc] = useState(product.showcase?.seo?.description || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const addHighlight = () => {
    if (newHighlight.trim() && highlights.length < 8) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_published: isPublished,
          popularity,
          showcase: {
            short_description: shortDescription,
            highlights,
            family,
            category,
            delivery_time: delivery,
            usage,
            seo: { title: seoTitle, description: seoDesc },
          },
        }),
      });
      if (res.ok) {
        setMessage("✓ Modifications enregistrées");
        router.refresh();
      } else {
        setMessage("Erreur lors de l'enregistrement");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/produits" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="w-4 h-4" /> Produits
        </Link>
        <a href={`/collection/${product.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--color-accent-blue)]">
          Voir sur le site <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">{product.name}</h1>

      {/* Visibility */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Visibilité</h2>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-[var(--color-text-secondary)]">Publié sur le site</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text-secondary)]">Popularité :</label>
            <input type="number" min={0} max={999} value={popularity} onChange={(e) => setPopularity(Number(e.target.value))} className="w-20 h-8 px-2 rounded-lg border border-[var(--color-border-default)] text-sm text-center" />
          </div>
        </div>
      </section>

      {/* Marketing content */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Contenu marketing</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Famille</label>
            <select value={family} onChange={(e) => { setFamily(e.target.value); setCategory(""); }} className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm">
              <option value="">Sélectionner...</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Sous-catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!family} className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm disabled:opacity-50">
              <option value="">{family ? "Sélectionner..." : "Choisissez d'abord une famille"}</option>
              {(getCategory(family)?.children || []).map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Délai</label>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm">
              <option value="">Sélectionner...</option>
              {deliveries.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Usage</label>
            <select value={usage} onChange={(e) => setUsage(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm">
              <option value="">Sélectionner...</option>
              {usages.map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          </div>

          <Input label="Description courte" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Description marketing (20-500 caractères)" />
        </div>
      </section>

      {/* Highlights */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Highlights (avantages clés)</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {highlights.map((h, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
              {h}
              <button onClick={() => removeHighlight(i)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
            placeholder="Nouvel highlight..."
            className="flex-1 h-9 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm"
          />
          <Button variant="secondary" size="sm" onClick={addHighlight} disabled={!newHighlight.trim() || highlights.length >= 8}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* SEO */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">SEO</h2>
        <Input label="Titre SEO" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="50-60 caractères recommandés" />
        <div className="mt-3"><Input label="Meta description" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="150-160 caractères recommandés" /></div>
      </section>

      {/* Variants (read-only) */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Variantes & Prix (lecture seule — géré via AssoAI)</h2>
        {product.variants?.map((v) => (
          <div key={v.id} className="flex justify-between text-sm py-1 border-b border-[var(--color-border-default)] last:border-0">
            <span className="text-[var(--color-text-secondary)]">{v.name}</span>
            <span className="font-mono text-[var(--color-text-primary)]">{formatFCFA(v.price)}</span>
          </div>
        ))}
        {(!product.variants || product.variants.length === 0) && <p className="text-sm text-[var(--color-text-tertiary)]">Aucune variante</p>}
      </section>

      <div className="flex items-center gap-3 mb-8">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Link href="/admin/produits"><Button variant="ghost">Annuler</Button></Link>
        {message && <span className="text-sm text-[var(--color-success)]">{message}</span>}
      </div>
    </div>
  );
}
