"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  ExternalLink,
  Pencil,
  Settings,
  ImageIcon,
  Tags,
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MediaField } from "@/components/admin/MediaField";
import { GalleryField } from "@/components/admin/GalleryField";
import { Images360Field } from "@/components/admin/Images360Field";
import { SaveBar } from "@/components/admin/SaveBar";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { MEDIA_SPECS, CROP_SPECS } from "@/lib/media-specs";
import { cn } from "@/lib/utils";
import { imgProxyUrl } from "@/lib/images";
import { normalizeHighlights, autoHighlightIcon } from "@/lib/highlights";
import { HIGHLIGHT_ICONS, getHighlightIcon } from "@/lib/highlight-icons";
import type { ShowcaseProduct, ProductVariant } from "@/lib/products";
import type { ProductParameter, Highlight } from "@/types";

const deliveries = ["3-5 jours", "5-7 jours", "7-10 jours", "10-14 jours", "14-21 jours"];
const usages = ["extérieur", "intérieur", "les deux"];

type TabId = "general" | "contenu" | "medias" | "variantes" | "parametres" | "seo" | "paiement";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "Général", icon: Settings },
  { id: "contenu", label: "Contenu", icon: Pencil },
  { id: "medias", label: "Médias", icon: ImageIcon },
  { id: "variantes", label: "Variantes", icon: Tags },
  { id: "parametres", label: "Paramètres", icon: SlidersHorizontal },
  { id: "seo", label: "SEO", icon: Search },
  { id: "paiement", label: "Paiement", icon: Wallet },
];

export function ProductEditClient({ product, availableParameters }: { product: ShowcaseProduct; availableParameters: ProductParameter[] }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [editingName, setEditingName] = useState(false);
  const [isPublished, setIsPublished] = useState(product.is_published);
  const [popularity, setPopularity] = useState(product.showcase?.popularity || 0);
  const [shortDescription, setShortDescription] = useState(product.showcase?.short_description || "");
  const [highlights, setHighlights] = useState<Highlight[]>(normalizeHighlights(product.showcase?.highlights));
  const [iconPickerFor, setIconPickerFor] = useState<number | null>(null);
  const [category, setCategory] = useState(product.showcase?.category || "");
  const [family, setFamily] = useState(product.showcase?.family || "");
  const [delivery, setDelivery] = useState(product.showcase?.delivery_time || "");
  const [usage, setUsage] = useState(product.showcase?.usage || "");
  const [seoTitle, setSeoTitle] = useState(product.showcase?.seo?.title || "");
  const [seoDesc, setSeoDesc] = useState(product.showcase?.seo?.description || "");
  const [heroVideo, setHeroVideo] = useState(product.showcase?.hero_video_url || "");
  const [heroAspect, setHeroAspect] = useState<"wide" | "portrait">(
    product.showcase?.hero_aspect === "portrait" ? "portrait" : "wide"
  );
  const [mainImage, setMainImage] = useState<string | null>(product.main_image_url);
  const [gallery, setGallery] = useState<string[]>(product.gallery_images || []);
  const [images360, setImages360] = useState<string[]>(product.showcase?.images_360 || []);
  const [threeSixtyEnabled, setThreeSixtyEnabled] = useState<boolean>(
    !!product.showcase?.three_sixty_enabled ||
      (product.showcase?.images_360?.length ?? 0) > 0
  );
  const [lightSwitchEnabled, setLightSwitchEnabled] = useState<boolean>(
    !!product.showcase?.light_switch?.enabled
  );
  const [lightSwitchOn, setLightSwitchOn] = useState<string | null>(
    product.showcase?.light_switch?.image_on || null
  );
  const [lightSwitchOff, setLightSwitchOff] = useState<string | null>(
    product.showcase?.light_switch?.image_off || null
  );
  const [galleryOff, setGalleryOff] = useState<Record<string, string>>(
    product.showcase?.light_switch?.gallery_off || {}
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    product.showcase?.variants ?? (product.variants || [])
  );
  const [faq, setFaq] = useState<{ q: string; a: string }[]>(product.showcase?.faq || []);
  const [activeParameters, setActiveParameters] = useState<string[]>(
    product.showcase?.active_parameters || []
  );
  const [cashOnDelivery, setCashOnDelivery] = useState<boolean>(
    !!product.showcase?.payment?.cash_on_delivery
  );
  const [onlineEnabled, setOnlineEnabled] = useState<boolean>(
    !!product.showcase?.payment?.online_enabled
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<TabId>("general");

  const addHighlight = () => {
    if (highlights.length >= 8) return;
    setHighlights([...highlights, { title: "", icon: "", text: "" }]);
  };

  const updateHighlight = (idx: number, patch: Partial<Highlight>) => {
    setHighlights((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  };

  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const moveHighlight = (idx: number, dir: number) => {
    setHighlights((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateFaq = (i: number, field: "q" | "a", value: string) => {
    const next = [...faq];
    next[i] = { ...next[i], [field]: value };
    setFaq(next);
  };
  const addFaq = () => setFaq([...faq, { q: "", a: "" }]);
  const removeFaq = (i: number) => setFaq(faq.filter((_, idx) => idx !== i));

  const genId = () => Math.random().toString(36).slice(2, 9);
  const toggleActiveParameter = (paramId: string) => {
    setActiveParameters((prev) =>
      prev.includes(paramId) ? prev.filter((id) => id !== paramId) : [...prev, paramId]
    );
  };

  const updateVariant = (i: number, patch: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };
  const updateVariantAttr = (i: number, key: string, value: string) => {
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i ? { ...v, attributes: { ...(v.attributes || {}), [key]: value } } : v
      )
    );
  };
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: genId(),
        sku: `SKU-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        name: "",
        price: null,
        attributes: {},
      },
    ]);
  };
  const removeVariant = (i: number) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed) {
      setName(trimmed);
    } else {
      setName(product.name); // revert si vide
    }
    setEditingName(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          is_published: isPublished,
          popularity,
          main_image_url: mainImage,
          gallery_images: gallery.filter((u) => u.trim()),
          showcase: {
            variants: variants.filter((v) => v.name.trim()),
            short_description: shortDescription,
            highlights,
            family,
            category,
            delivery_time: delivery,
            usage,
            hero_video_url: heroVideo || null,
            hero_aspect: heroAspect,
            seo: { title: seoTitle, description: seoDesc },
            faq: faq.filter((f) => f.q.trim() || f.a.trim()),
            active_parameters: activeParameters,
            images_360: images360.filter((u) => u.trim()),
            three_sixty_enabled: threeSixtyEnabled,
            light_switch: {
              enabled: lightSwitchEnabled,
              image_on: lightSwitchOn,
              image_off: lightSwitchOff,
              gallery_off: Object.fromEntries(
                Object.entries(galleryOff).filter(
                  ([k, v]) => v.trim() && gallery.includes(k)
                )
              ),
            },
            payment: { online_enabled: onlineEnabled, cash_on_delivery: cashOnDelivery },
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

  // Détection « modifications non enregistrées » par comparaison d'instantanés.
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        name: product.name,
        isPublished: product.is_published,
        popularity: product.showcase?.popularity || 0,
        shortDescription: product.showcase?.short_description || "",
        highlights: normalizeHighlights(product.showcase?.highlights),
        family: product.showcase?.family || "",
        category: product.showcase?.category || "",
        delivery: product.showcase?.delivery_time || "",
        usage: product.showcase?.usage || "",
        seoTitle: product.showcase?.seo?.title || "",
        seoDesc: product.showcase?.seo?.description || "",
        heroVideo: product.showcase?.hero_video_url || "",
        heroAspect: product.showcase?.hero_aspect === "portrait" ? "portrait" : "wide",
        mainImage: product.main_image_url,
        gallery: product.gallery_images || [],
        images360: product.showcase?.images_360 || [],
        threeSixtyEnabled: !!product.showcase?.three_sixty_enabled,
        lightSwitchEnabled: !!product.showcase?.light_switch?.enabled,
        lightSwitchOn: product.showcase?.light_switch?.image_on || null,
        lightSwitchOff: product.showcase?.light_switch?.image_off || null,
        galleryOff: product.showcase?.light_switch?.gallery_off || {},
        variants: product.showcase?.variants ?? (product.variants || []),
        faq: product.showcase?.faq || [],
        activeParameters: product.showcase?.active_parameters || [],
        cashOnDelivery: !!product.showcase?.payment?.cash_on_delivery,
        onlineEnabled: !!product.showcase?.payment?.online_enabled,
      }),
    [product]
  );

  const dirty = useMemo(() => {
    const cur = JSON.stringify({
      name,
      isPublished,
      popularity,
      shortDescription,
      highlights,
      family,
      category,
      delivery,
      usage,
      seoTitle,
      seoDesc,
      heroVideo,
      heroAspect,
      mainImage,
      gallery,
      images360,
      threeSixtyEnabled,
      lightSwitchEnabled,
      lightSwitchOn,
      lightSwitchOff,
      galleryOff,
      variants,
      faq,
      activeParameters,
      cashOnDelivery,
      onlineEnabled,
    });
    return cur !== initialSnapshot;
  }, [
    name, isPublished, popularity, shortDescription, highlights, family, category,
    delivery, usage, seoTitle, seoDesc, heroVideo, heroAspect, mainImage, gallery,
    images360, threeSixtyEnabled, lightSwitchEnabled, lightSwitchOn, lightSwitchOff,
    galleryOff, variants, faq, activeParameters, cashOnDelivery, onlineEnabled, initialSnapshot,
  ]);

  return (
    <div className="max-w-3xl pb-28">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/produits" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="w-4 h-4" /> Produits
        </Link>
        <a href={`/collection/${product.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--color-accent-blue)]">
          Voir sur le site <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-5">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitName();
              } else if (e.key === "Escape") {
                setName(product.name);
                setEditingName(false);
              }
            }}
            aria-label="Titre du produit"
            className="w-full bg-transparent border-b-2 border-[var(--color-accent-blue)] font-display text-2xl font-bold text-[var(--color-text-primary)] focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            title="Cliquer pour modifier le titre"
            className="inline-flex items-center gap-2 text-left cursor-text group"
          >
            <span>{name}</span>
            <Pencil className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </h1>

      {/* Onglets */}
      <div className="flex gap-1 mb-5 overflow-x-auto border-b border-[var(--color-border-default)] pb-px">
        {tabs.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors " +
                (active
                  ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent-blue)] -mb-px"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]")
              }
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "general" && (
        <>
          {/* Visibilité */}
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

          {/* Contenu marketing */}
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
        </>
      )}

      {tab === "contenu" && (
        <>
          {/* Points forts */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Points forts</h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
              Titre, icône et texte détaillé (révélé au clic sur la fiche produit). Maximum 8. L&apos;icône est déduite du titre si vous n&apos;en choisissez pas.
            </p>
            {highlights.length === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)] mb-3">Aucun point fort pour l&apos;instant.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {highlights.map((h, i) => {
                  const Icon = getHighlightIcon(h.icon);
                  return (
                    <li key={i} className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-tertiary)] w-5 shrink-0 text-center">{i + 1}</span>

                        {/* Sélecteur d'icône */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setIconPickerFor(iconPickerFor === i ? null : i)}
                            aria-label="Choisir une icône"
                            className="w-10 h-10 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] flex items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)] transition-colors"
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                          {iconPickerFor === i && (
                            <>
                              <button
                                type="button"
                                aria-label="Fermer"
                                className="fixed inset-0 z-20 cursor-default"
                                onClick={() => setIconPickerFor(null)}
                              />
                              <div className="absolute left-0 top-11 z-30 w-72 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-lg p-2 grid grid-cols-6 gap-1">
                                {HIGHLIGHT_ICONS.map((def) => {
                                  const DefIcon = def.Icon;
                                  return (
                                    <button
                                      key={def.key}
                                      type="button"
                                      title={def.label}
                                      onClick={() => { updateHighlight(i, { icon: def.key }); setIconPickerFor(null); }}
                                      className={cn(
                                        "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                                        h.icon === def.key
                                          ? "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]"
                                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                                      )}
                                    >
                                      <DefIcon className="w-4 h-4" />
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>

                        <input
                          value={h.title}
                          onChange={(e) => {
                            const title = e.target.value;
                            updateHighlight(i, { title, icon: h.icon || autoHighlightIcon(title) });
                          }}
                          placeholder="Titre (ex : LED haute luminosité)"
                          className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)]"
                        />

                        <div className="flex items-center shrink-0">
                          <button type="button" onClick={() => moveHighlight(i, -1)} disabled={i === 0} aria-label="Monter" className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => moveHighlight(i, 1)} disabled={i === highlights.length - 1} aria-label="Descendre" className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => removeHighlight(i)} aria-label="Supprimer" className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={h.text}
                        onChange={(e) => updateHighlight(i, { text: e.target.value })}
                        placeholder="Texte détaillé (révélé au clic sur la fiche produit)"
                        rows={2}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={addHighlight}
              disabled={highlights.length >= 8}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un point fort
            </button>
          </section>

          {/* FAQ produit */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">FAQ produit</h2>
            {faq.map((f, i) => (
              <div key={i} className="mb-3 rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">Question {i + 1}</span>
                  <button type="button" onClick={() => removeFaq(i)} aria-label="Supprimer" className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Input value={f.q} onChange={(e) => updateFaq(i, "q", e.target.value)} placeholder="Question" />
                <div className="mt-2">
                  <Input value={f.a} onChange={(e) => updateFaq(i, "a", e.target.value)} placeholder="Réponse" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addFaq} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter une question
            </button>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">Si vide, une FAQ générique s'affiche sur la fiche.</p>
          </section>
        </>
      )}

      {tab === "medias" && (
        <>
          {/* Médias */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Médias</h2>
            <MediaField
              value={mainImage ? { type: "image", url: mainImage } : null}
              onChange={(m) => setMainImage(m?.url || null)}
              label="Image principale (fiche, cartes, miniatures, réalisations)"
              hint={MEDIA_SPECS.productImage}
              cropSpec={CROP_SPECS.productImage}
            />
            <div className="mt-4">
              <GalleryField value={gallery} onChange={setGallery} label="Galerie (photos et vidéos)" hint={MEDIA_SPECS.galleryImage} cropSpec={CROP_SPECS.galleryImage} />
            </div>
          </section>

          {/* Switch allumé / éteint */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Switch allumé / éteint</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lightSwitchEnabled}
                  onChange={(e) => setLightSwitchEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--color-text-secondary)]">Activer le switch</span>
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
              Affiche un bouton discret « Éteindre / Allumer » sur la fiche produit, qui bascule entre l&apos;image « allumé » et l&apos;image « éteint ». Le switch n&apos;apparaît que si les deux images sont définies.
            </p>
            <MediaField
              value={lightSwitchOn ? { type: "image", url: lightSwitchOn } : null}
              onChange={(m) => setLightSwitchOn(m?.url || null)}
              label="Image « Allumé »"
              hint={MEDIA_SPECS.productImage}
              cropSpec={CROP_SPECS.productImage}
            />
            <div className="mt-4">
              <MediaField
                value={lightSwitchOff ? { type: "image", url: lightSwitchOff } : null}
                onChange={(m) => setLightSwitchOff(m?.url || null)}
                label="Image « Éteint »"
                hint={MEDIA_SPECS.productImage}
                cropSpec={CROP_SPECS.productImage}
              />
            </div>

            {lightSwitchEnabled && gallery.filter((u) => u.trim()).length > 0 && (
              <div className="mt-4 border-t border-[var(--color-border-default)] pt-4">
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Image « éteint » par photo de la galerie
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
                  Associez une image « éteint » à une photo de la galerie : le switch s&apos;affichera aussi sur ce slide et basculera entre la photo (allumé) et son image « éteint ».
                </p>
                <div className="space-y-2">
                  {gallery.filter((u) => u.trim()).map((url, i) => (
                    <div key={url} className="flex items-start gap-3 rounded-lg border border-[var(--color-border-default)] p-2">
                      <img
                        src={imgProxyUrl(url, 60, 80)}
                        alt=""
                        className="h-12 w-9 shrink-0 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="mb-1 truncate text-xs text-[var(--color-text-tertiary)]">Photo {i + 1}</p>
                        <MediaField
                          value={galleryOff[url] ? { type: "image", url: galleryOff[url] } : null}
                          onChange={(m) =>
                            setGalleryOff((prev) => {
                              const next = { ...prev };
                              if (m?.url) next[url] = m.url;
                              else delete next[url];
                              return next;
                            })
                          }
                          label="Image « éteint »"
                          hint={MEDIA_SPECS.productImage}
                          cropSpec={CROP_SPECS.productImage}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Vue 360° */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Vue 360° (rotation)</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={threeSixtyEnabled}
                  onChange={(e) => setThreeSixtyEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--color-text-secondary)]">Activer la vue 360°</span>
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
              Ajoutez 32 images ou plus du produit sous différents angles. L&apos;ordre des frames définit le sens de rotation. La vue 360° s&apos;active automatiquement dès qu&apos;au moins une image est ajoutée.
            </p>
            <Images360Field
              value={images360}
              onChange={(urls) => {
                setImages360(urls);
                // Active automatiquement la vue 360° dès qu'au moins une frame est disponible.
                if (urls.length > 0) setThreeSixtyEnabled(true);
              }}
              hint={MEDIA_SPECS.frame360}
            />
          </section>

          {/* Héro produit */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Héro produit</h2>
            <MediaField
              value={heroVideo ? { type: "video", url: heroVideo } : null}
              onChange={(m) => setHeroVideo(m?.url || "")}
              label="Vidéo du héro (optionnel — remplace l'image)"
              hint={MEDIA_SPECS.heroVideo}
              cropSpec={CROP_SPECS.heroVideo}
            />
            <div className="mt-3">
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Format du héro</label>
              <select value={heroAspect} onChange={(e) => setHeroAspect(e.target.value as "wide" | "portrait")} className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm">
                <option value="wide">Large (paysage, pleine largeur)</option>
                <option value="portrait">3/4 (portrait)</option>
              </select>
            </div>
          </section>
        </>
      )}

      {tab === "variantes" && (
        <>
          {/* Variantes & Prix (éditable) */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Variantes & Prix</h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
              Nom, prix (FCFA), SKU, dimensions et matériaux. Une variante au nom vide est ignorée à l'enregistrement. ⚠️ Les variantes sont générées par AssoAI — elles peuvent être réécrasées lors d'une régénération.
            </p>
            {variants.map((v, i) => (
              <div key={v.id} className="mb-3 rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">Variante {i + 1}</span>
                  <button type="button" onClick={() => removeVariant(i)} aria-label="Supprimer la variante" className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} placeholder="Nom (ex : Standard)" label="Nom" />
                  <Input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} placeholder="SKU" label="SKU" />
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Prix (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      value={v.price == null ? "" : v.price}
                      disabled={v.price == null}
                      onChange={(e) => updateVariant(i, { price: e.target.value === "" ? null : Number(e.target.value) })}
                      placeholder="Sur devis"
                      className="w-full h-12 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.15)] focus:outline-none disabled:opacity-50 disabled:bg-[var(--color-bg-tertiary)]"
                    />
                  </div>
                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={v.price == null} onChange={(e) => updateVariant(i, { price: e.target.checked ? null : 0 })} className="w-4 h-4" />
                      <span className="text-sm text-[var(--color-text-secondary)]">Sur devis</span>
                    </label>
                  </div>
                  <Input value={v.attributes?.dimensions || ""} onChange={(e) => updateVariantAttr(i, "dimensions", e.target.value)} placeholder="Ex : 50cm × 50cm" label="Dimensions" />
                  <Input value={v.attributes?.materials || ""} onChange={(e) => updateVariantAttr(i, "materials", e.target.value)} placeholder="Ex : Verre, aluminium" label="Matériaux" />
                </div>
                <div className="mt-2">
                  <MediaField
                    value={v.image ? { type: "image", url: v.image } : null}
                    onChange={(m) => updateVariant(i, { image: m?.url })}
                    label="Image de la variante (affichée à la sélection)"
                    hint={MEDIA_SPECS.variantImage}
                    cropSpec={CROP_SPECS.variantImage}
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter une variante
            </button>
            {variants.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)] mt-2">Aucune variante — le produit s'affiche « Sur devis uniquement ».</p>}
          </section>
        </>
      )}

      {tab === "parametres" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Paramètres du produit</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
            Activez les paramètres (couleur, options, revêtement…) qui s'afficheront sur cette fiche. Gérez la liste des paramètres et leurs coûts dans Réglages → Paramètres produit.
          </p>
          {availableParameters.length > 0 ? (
            <div className="space-y-2">
              {availableParameters.map((param) => {
                const active = activeParameters.includes(param.id);
                return (
                  <label
                    key={param.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      active
                        ? "border-[var(--color-accent-blue)] bg-[var(--color-bg-secondary)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:bg-[var(--color-bg-tertiary)]"
                    )}
                  >
                    <input type="checkbox" checked={active} onChange={() => toggleActiveParameter(param.id)} className="w-4 h-4" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-[var(--color-text-primary)]">{param.name}</span>
                      <span className="block text-xs text-[var(--color-text-tertiary)]">
                        {param.options.length} option{param.options.length > 1 ? "s" : ""} · {param.type === "single" ? "sélect unique" : "multi-sélect"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-tertiary)]">Aucun paramètre disponible — créez-en dans Réglages → Paramètres produit.</p>
          )}
        </section>
      )}

      {tab === "seo" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">SEO</h2>
          <Input label="Titre SEO" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="50-60 caractères recommandés" />
          <div className="mt-3"><Input label="Meta description" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="150-160 caractères recommandés" /></div>
        </section>
      )}

      {tab === "paiement" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Paiement</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Activez les modes de paiement disponibles pour ce produit. Le badge « Express » s&apos;affiche
            quand le paiement en ligne est activé.
          </p>

          <label className="flex items-start gap-3 rounded-lg border border-[var(--color-border-default)] p-3 cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors mb-2">
            <input
              type="checkbox"
              checked={onlineEnabled}
              onChange={(e) => setOnlineEnabled(e.target.checked)}
              className="w-4 h-4 mt-0.5"
            />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                Paiement en ligne (FedaPay)
              </span>
              <span className="block text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Autorise « Payez en ligne » au checkout (Orange Money, MTN, Wave, carte selon les méthodes live).
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-[var(--color-border-default)] p-3 cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <input
              type="checkbox"
              checked={cashOnDelivery}
              onChange={(e) => setCashOnDelivery(e.target.checked)}
              className="w-4 h-4 mt-0.5"
            />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                Paiement cash à la livraison
              </span>
              <span className="block text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Autorise le client à choisir « Payer à la livraison » (espèces ou mobile money) au checkout.
              </span>
            </span>
          </label>
        </section>
      )}

      <SaveBar
        saving={saving}
        dirty={dirty}
        message={message}
        onSave={handleSave}
        cancelHref="/admin/produits"
        rightLabel={isPublished ? "Publié" : "Brouillon"}
      />
    </div>
  );
}
