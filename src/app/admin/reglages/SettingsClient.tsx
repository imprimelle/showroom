"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { MediaField } from "@/components/admin/MediaField";
import { SaveBar } from "@/components/admin/SaveBar";
import { Plus, Trash2, Settings, House, Layers, Check, GripVertical, SlidersHorizontal, Tags, Truck, Wallet, HelpCircle, ChevronUp, ChevronDown, Film } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { DEFAULT_SHIPPING_ZONES } from "@/lib/shipping";
import { DEFAULT_ONLINE_METHODS } from "@/lib/payment";
import { DEFAULT_FAQ_PILLS } from "@/lib/faq";
import { MEDIA_SPECS, CROP_SPECS } from "@/lib/media-specs";
import { cn } from "@/lib/utils";
import { imgProxyUrl } from "@/lib/images";
import type { MediaItem, ShowcaseSettings, ProductParameter, ProductParameterOption, FaqPill, IdeaDecoVideo } from "@/types";
import type { Category, SubCategory } from "@/lib/categories";

type TabId = "coordonnees" | "accueil" | "univers" | "catalog" | "parametres" | "livraison" | "paiement" | "faq" | "ideadeco";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "coordonnees", label: "Coordonnées & SEO", icon: Settings },
  { id: "accueil", label: "Page d'accueil", icon: House },
  { id: "univers", label: "Univers", icon: Layers },
  { id: "catalog", label: "Catégories", icon: Tags },
  { id: "parametres", label: "Paramètres produit", icon: SlidersHorizontal },
  { id: "livraison", label: "Livraison", icon: Truck },
  { id: "paiement", label: "Paiement", icon: Wallet },
  { id: "faq", label: "FAQ produit", icon: HelpCircle },
  { id: "ideadeco", label: "Idées décos", icon: Film },
];

export function SettingsClient({ initialData, products }: {
  initialData: ShowcaseSettings;
  products: { id: string; name: string; slug: string; main_image_url: string | null }[];
}) {
  const [data, setData] = useState<ShowcaseSettings>(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<TabId>("coordonnees");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const update = (path: string, value: string) => {
    const keys = path.split(".");
    const newData: any = { ...data };
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
    let obj: any = data;
    for (const k of keys) {
      if (!obj || typeof obj !== "object") return "";
      obj = obj[k];
    }
    return String(obj || "");
  };

  // === Slides du hero ===
  const slides: MediaItem[] = data.hero?.slides || [];
  const setSlides = (next: MediaItem[]) => setData({ ...data, hero: { ...data.hero, slides: next } });
  const addSlide = () => setSlides([...slides, { type: "image", url: "" }]);
  const updateSlide = (i: number, media: MediaItem | null) => {
    const next = [...slides];
    if (media) next[i] = media;
    else next.splice(i, 1);
    setSlides(next);
  };
  const reorderSlides = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSlides(next);
  };

  // === Médias des univers ===
  const setCategory = (famId: string, patch: Partial<{ title: string; media: MediaItem | null }>) => {
    const categories = { ...(data.categories || {}) };
    const current = categories[famId] || {};
    categories[famId] = { ...current, title: patch.title ?? current.title, media: patch.media !== undefined ? (patch.media || undefined) : current.media };
    setData({ ...data, categories });
  };

  // === Sections de la page d'accueil ===
  const homeReassurance = data.home?.reassurance || [];
  const homeSteps = data.home?.steps || [];
  const setHome = (patch: Partial<ShowcaseSettings["home"]>) =>
    setData({ ...data, home: { ...data.home, ...patch } });
  const setReassuranceItem = (i: number, patch: Partial<{ title: string; desc: string }>) => {
    const list = [...homeReassurance];
    list[i] = { ...(list[i] || {}), ...patch };
    setHome({ reassurance: list });
  };
  const setStepItem = (i: number, patch: Partial<{ title: string; desc: string }>) => {
    const list = [...homeSteps];
    list[i] = { ...(list[i] || {}), ...patch };
    setHome({ steps: list });
  };

  // === Produits en vedette ===
  const featuredIds: string[] = data.home?.featured || [];
  const toggleFeatured = (id: string) => {
    const next = featuredIds.includes(id)
      ? featuredIds.filter((x) => x !== id)
      : [...featuredIds, id];
    setHome({ featured: next });
  };

  // === Paramètres produit (catalogue global : options + coûts) ===
  const parameters = data.product_parameters || [];
  const setParameters = (next: ProductParameter[]) => setData({ ...data, product_parameters: next });
  const genId = () => Math.random().toString(36).slice(2, 9);
  const updateParam = (i: number, patch: Partial<ProductParameter>) =>
    setParameters(parameters.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const addParam = () =>
    setParameters([...parameters, { id: genId(), name: "", type: "multi", options: [] }]);
  const removeParam = (i: number) => setParameters(parameters.filter((_, idx) => idx !== i));
  const updateOption = (pi: number, oi: number, patch: Partial<ProductParameterOption>) =>
    setParameters(
      parameters.map((p, idx) =>
        idx === pi
          ? { ...p, options: p.options.map((o, oidx) => (oidx === oi ? { ...o, ...patch } : o)) }
          : p
      )
    );
  const addOption = (pi: number) =>
    setParameters(
      parameters.map((p, idx) =>
        idx === pi ? { ...p, options: [...p.options, { id: genId(), label: "", price: null }] } : p
      )
    );
  const removeOption = (pi: number, oi: number) =>
    setParameters(
      parameters.map((p, idx) =>
        idx === pi ? { ...p, options: p.options.filter((_, oidx) => oidx !== oi) } : p
      )
    );

  // === Catalogue (catégories + sous-catégories) ===
  const catalog = data.catalog || [];
  const setCatalog = (next: Category[]) => setData({ ...data, catalog: next });
  const updateCategory = (ci: number, patch: Partial<Category>) =>
    setCatalog(catalog.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const addCategory = () =>
    setCatalog([...catalog, { id: genId(), name: "", icon: "📦", color: "from-amber-500/80", children: [] }]);
  const removeCategory = (ci: number) => setCatalog(catalog.filter((_, i) => i !== ci));
  const updateSub = (ci: number, si: number, patch: Partial<SubCategory>) =>
    setCatalog(
      catalog.map((c, i) =>
        i === ci
          ? { ...c, children: c.children.map((s, j) => (j === si ? { ...s, ...patch } : s)) }
          : c
      )
    );
  const addSub = (ci: number) =>
    setCatalog(
      catalog.map((c, i) =>
        i === ci ? { ...c, children: [...c.children, { id: genId(), name: "", icon: "📦" }] } : c
      )
    );
  const removeSub = (ci: number, si: number) =>
    setCatalog(
      catalog.map((c, i) =>
        i === ci ? { ...c, children: c.children.filter((_, j) => j !== si) } : c
      )
    );

  // === Livraison (zones + frais de port) ===
  const shippingZones = data.shipping?.zones ?? DEFAULT_SHIPPING_ZONES;
  const setShippingZones = (next: { id: string; label: string; countries: string[]; fee_fcfa: number }[]) =>
    setData({ ...data, shipping: { zones: next } });
  const updateZone = (zi: number, patch: Partial<{ label: string; countries: string[]; fee_fcfa: number }>) =>
    setShippingZones(shippingZones.map((z, i) => (i === zi ? { ...z, ...patch } : z)));
  const addZone = () =>
    setShippingZones([...shippingZones, { id: genId(), label: "", countries: [], fee_fcfa: 0 }]);
  const removeZone = (zi: number) => setShippingZones(shippingZones.filter((_, i) => i !== zi));

  // === Méthodes de paiement en ligne (statut « live sur FedaPay ») ===
  const paymentMethods = data.payment_methods ?? DEFAULT_ONLINE_METHODS;
  const setPaymentMethods = (next: ShowcaseSettings["payment_methods"]) =>
    setData({ ...data, payment_methods: next });
  const toggleMethodLive = (mi: number) =>
    setPaymentMethods((paymentMethods || []).map((m, i) => (i === mi ? { ...m, live: !m.live } : m)));

  // === Pilules FAQ (bottom sheet de la fiche produit) — globales ===
  const faqPills: FaqPill[] = data.faq_pills ?? DEFAULT_FAQ_PILLS;
  const setFaqPills = (next: FaqPill[]) => setData({ ...data, faq_pills: next });
  const updatePill = (i: number, patch: Partial<FaqPill>) =>
    setFaqPills(faqPills.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const addPill = () => setFaqPills([...faqPills, { id: genId(), label: "", content: "" }]);
  const removePill = (i: number) => setFaqPills(faqPills.filter((_, idx) => idx !== i));
  const movePill = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= faqPills.length) return;
    const next = [...faqPills];
    [next[i], next[j]] = [next[j], next[i]];
    setFaqPills(next);
  };

  // === Vidéos « Idées décos » par univers (slug de famille → liste) ===
  const ideaDeco = data.idea_deco || {};
  const ideaDecoFor = (famId: string): IdeaDecoVideo[] => ideaDeco[famId] || [];
  const setIdeaDecoFor = (famId: string, videos: IdeaDecoVideo[]) =>
    setData({ ...data, idea_deco: { ...ideaDeco, [famId]: videos } });
  const addIdeaVideo = (famId: string) =>
    setIdeaDecoFor(famId, [...ideaDecoFor(famId), { url: "", poster: null, product_slugs: [] }]);
  const updateIdeaVideo = (famId: string, i: number, patch: Partial<IdeaDecoVideo>) =>
    setIdeaDecoFor(famId, ideaDecoFor(famId).map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const removeIdeaVideo = (famId: string, i: number) =>
    setIdeaDecoFor(famId, ideaDecoFor(famId).filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      // Nettoyage : retire les slides sans URL et les médias d'univers sans URL
      const cleanData: ShowcaseSettings = {
        ...data,
        hero: data.hero ? { ...data.hero, slides: (data.hero.slides || []).filter((s) => s.url) } : undefined,
        categories: Object.fromEntries(
          Object.entries(data.categories || {}).map(([id, c]) => [
            id,
            { title: c.title, media: c.media?.url ? c.media : undefined },
          ])
        ),
        product_parameters: (data.product_parameters || [])
          .filter((p) => p.name.trim())
          .map((p) => ({ ...p, name: p.name.trim(), options: p.options.filter((o) => o.label.trim()) })),
        catalog: (data.catalog || [])
          .filter((c) => c.name.trim())
          .map((c) => ({
            ...c,
            name: c.name.trim(),
            children: c.children.filter((s) => s.name.trim()).map((s) => ({ ...s, name: s.name.trim() })),
          })),
        shipping: {
          zones: (shippingZones || [])
            .filter((z) => z.label.trim() || (z.countries?.length ?? 0) > 0)
            .map((z) => ({
              id: z.id,
              label: z.label.trim(),
              countries: (z.countries || []).map((c) => String(c).toUpperCase()),
              fee_fcfa: Number(z.fee_fcfa) || 0,
            })),
        },
        payment_methods: (paymentMethods || []).map((m) => ({ id: m.id, label: m.label, live: !!m.live })),
        faq_pills: (faqPills || [])
          .filter((p) => p.label.trim())
          .map((p) => ({ id: p.id, label: p.label.trim(), content: p.content.trim() })),
        idea_deco: Object.fromEntries(
          Object.entries(ideaDeco).map(([famId, list]) => [
            famId,
            list
              .filter((v) => v.url?.trim())
              .map((v) => ({
                url: v.url.trim(),
                poster: v.poster?.trim() || null,
                product_slugs: (v.product_slugs || []).filter(Boolean),
              })),
          ])
        ),
      };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: cleanData }),
      });
      if (res.ok) setMessage("✓ Réglages enregistrés");
      else setMessage("Erreur lors de l'enregistrement");
    } catch {
      setMessage("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const initialSnapshot = useMemo(() => JSON.stringify(initialData), [initialData]);
  const dirty = useMemo(() => JSON.stringify(data) !== initialSnapshot, [data, initialSnapshot]);

  return (
    <div className="max-w-3xl pb-28">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-5">Réglages</h1>

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

      {tab === "coordonnees" && (
        <>
          {/* Coordonnées */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Coordonnées</h2>
            <Input label="WhatsApp" value={getVal("contact.whatsapp")} onChange={(e) => update("contact.whatsapp", e.target.value)} placeholder="225XXXXXXXXX" />
            <div className="mt-3"><Input label="Téléphone (barre du haut)" value={getVal("contact.phone")} onChange={(e) => update("contact.phone", e.target.value)} placeholder="225XXXXXXXXX" /></div>
            <div className="mt-3"><Input label="Email" value={getVal("contact.email")} onChange={(e) => update("contact.email", e.target.value)} placeholder="contact@imprimelle.ci" /></div>
            <div className="mt-3"><Input label="Adresse" value={getVal("contact.address")} onChange={(e) => update("contact.address", e.target.value)} placeholder="Abidjan, Cocody..." /></div>
          </section>

          {/* Méta site */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Méta site</h2>
            <Input label="Nom du site" value={getVal("meta.site_name")} onChange={(e) => update("meta.site_name", e.target.value)} />
            <div className="mt-3"><Input label="Domaine" value={getVal("meta.domain")} onChange={(e) => update("meta.domain", e.target.value)} /></div>
            <div className="mt-3"><Input label="Titre par défaut" value={getVal("meta.default_title")} onChange={(e) => update("meta.default_title", e.target.value)} /></div>
            <div className="mt-3"><Input label="Meta description" value={getVal("meta.default_description")} onChange={(e) => update("meta.default_description", e.target.value)} /></div>
          </section>

          {/* Réseaux sociaux */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Réseaux sociaux</h2>
            <Input label="Facebook" value={getVal("social.facebook")} onChange={(e) => update("social.facebook", e.target.value)} />
            <div className="mt-3"><Input label="Instagram" value={getVal("social.instagram")} onChange={(e) => update("social.instagram", e.target.value)} /></div>
            <div className="mt-3"><Input label="TikTok" value={getVal("social.tiktok")} onChange={(e) => update("social.tiktok", e.target.value)} /></div>
          </section>

          {/* Analytics */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Analytics</h2>
            <Input label="Facebook Pixel ID" value={getVal("analytics.fb_pixel_id")} onChange={(e) => update("analytics.fb_pixel_id", e.target.value)} placeholder="123456789012345" />
            <div className="mt-3"><Input label="Umami Website ID" value={getVal("analytics.umami_website_id")} onChange={(e) => update("analytics.umami_website_id", e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
            <div className="mt-3"><Input label="URL script Umami" value={getVal("analytics.umami_script_url")} onChange={(e) => update("analytics.umami_script_url", e.target.value)} placeholder="https://analytics.example.com/script.js" /></div>
            <div className="mt-3"><Input label="PostHog Project API Key" value={getVal("analytics.posthog_key")} onChange={(e) => update("analytics.posthog_key", e.target.value)} placeholder="phc_..." /></div>
            <div className="mt-3"><Input label="PostHog Host" value={getVal("analytics.posthog_host")} onChange={(e) => update("analytics.posthog_host", e.target.value)} placeholder="https://us.i.posthog.com (laisser vide = US)" /></div>
          </section>
        </>
      )}

      {tab === "accueil" && (
        <>
          {/* Page d'accueil — Héro */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Héro</h2>
            <Input label="Titre Hero" value={getVal("hero.title")} onChange={(e) => update("hero.title", e.target.value)} />
            <div className="mt-3"><Input label="Sous-titre Hero" value={getVal("hero.subtitle")} onChange={(e) => update("hero.subtitle", e.target.value)} /></div>
            <div className="mt-3"><Input label="Texte CTA" value={getVal("hero.cta_text")} onChange={(e) => update("hero.cta_text", e.target.value)} /></div>
            <div className="mt-3"><Input label="Lien CTA" value={getVal("hero.cta_href")} onChange={(e) => update("hero.cta_href", e.target.value)} placeholder="/collection" /></div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">Slides (images ou vidéos — glissez pour réordonner)</span>
                <button type="button" onClick={addSlide} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {slides.map((s, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(i);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overIndex !== i) setOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex !== null && dragIndex !== i) reorderSlides(dragIndex, i);
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={cn(
                      "relative flex items-start gap-2 rounded-lg border p-3 transition-all duration-150",
                      dragIndex === i
                        ? "border-dashed border-[var(--color-accent-blue)] opacity-50"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]"
                    )}
                  >
                    {overIndex === i && dragIndex !== null && dragIndex !== i && (
                      <span className="absolute -top-[7px] left-0 right-0 h-0.5 rounded-full bg-[var(--color-accent-blue)]" />
                    )}
                    <span
                      title="Glisser pour réordonner"
                      className="mt-1 shrink-0 cursor-grab active:cursor-grabbing text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-tertiary)] mt-1 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <MediaField value={s} onChange={(m) => updateSlide(i, m)} hint={MEDIA_SPECS.heroSlide} cropSpec={CROP_SPECS.heroSlide} />
                    </div>
                    <button type="button" onClick={() => updateSlide(i, null)} aria-label="Supprimer le slide" className="mt-1 shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {slides.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Aucun slide personnalisé — le site utilisera les photos produits.</p>}
              </div>
            </div>
          </section>

          {/* Page d'accueil — Produits en vedette */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Produits en vedette</h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
              Sélectionnez les produits affichés dans la grille « Nos produits vedettes » (2 rangées de 3). L&apos;ordre suit l&apos;ordre de sélection, puis la grille est complétée jusqu&apos;à 6 produits par les plus populaires.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {products.map((p) => {
                const selected = featuredIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleFeatured(p.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors",
                      selected
                        ? "border-[var(--color-accent-blue)] bg-[var(--color-bg-secondary)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:bg-[var(--color-bg-tertiary)]"
                    )}
                  >
                    <span className="w-10 h-[53px] shrink-0 rounded-md overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                      {p.main_image_url ? (
                        <img src={imgProxyUrl(p.main_image_url, 80, 107)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">✨</span>
                      )}
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-[var(--color-text-primary)] truncate">{p.name}</span>
                    <span
                      className={cn(
                        "w-5 h-5 shrink-0 rounded-full border flex items-center justify-center",
                        selected
                          ? "bg-[var(--color-accent-blue)] border-[var(--color-accent-blue)]"
                          : "border-[var(--color-border-strong)]"
                      )}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {products.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Aucun produit publié.</p>}
          </section>

          {/* Page d'accueil — Sections */}
          <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Sections</h2>

            <Input label="Titre CTA devis" value={getVal("home.cta_title")} onChange={(e) => update("home.cta_title", e.target.value)} />
            <div className="mt-3"><Input label="Texte CTA devis" value={getVal("home.cta_desc")} onChange={(e) => update("home.cta_desc", e.target.value)} /></div>

            <div className="mt-4">
              <span className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Réassurance (4 cartes — icônes fixes)</span>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="mb-3 rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                  <Input value={homeReassurance[i]?.title || ""} onChange={(e) => setReassuranceItem(i, { title: e.target.value })} placeholder={`Carte ${i + 1} — Titre`} />
                  <div className="mt-2"><Input value={homeReassurance[i]?.desc || ""} onChange={(e) => setReassuranceItem(i, { desc: e.target.value })} placeholder="Description" /></div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <span className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Étapes « Comment ça marche » (4 étapes — icônes fixes)</span>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="mb-3 rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                  <Input value={homeSteps[i]?.title || ""} onChange={(e) => setStepItem(i, { title: e.target.value })} placeholder={`Étape ${i + 1} — Titre`} />
                  <div className="mt-2"><Input value={homeSteps[i]?.desc || ""} onChange={(e) => setStepItem(i, { desc: e.target.value })} placeholder="Description" /></div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "univers" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Univers / Catégories</h2>
          <div className="space-y-4">
            {CATEGORIES.map((fam) => (
              <div key={fam.id} className="rounded-lg border border-[var(--color-border-default)] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{fam.icon}</span>
                  <Input label={fam.name} value={data.categories?.[fam.id]?.title || ""} onChange={(e) => setCategory(fam.id, { title: e.target.value })} placeholder={fam.name} />
                </div>
                <MediaField value={data.categories?.[fam.id]?.media || null} onChange={(m) => setCategory(fam.id, { media: m })} label="Média (image ou vidéo 3/4)" hint={MEDIA_SPECS.universeMedia} cropSpec={CROP_SPECS.universeMedia} />
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "catalog" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Catégories & sous-catégories</h2>
            <button type="button" onClick={addCategory} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Catégorie
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Définissez les univers (catégories) et leurs sous-catégories. Les produits sont rangés dans une sous-catégorie. Ces catégories alimentent la navigation, les filtres du catalogue et la fiche produit.
          </p>

          <div className="space-y-4">
            {catalog.map((cat, ci) => (
              <div key={cat.id} className="rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={cat.icon}
                    onChange={(e) => updateCategory(ci, { icon: e.target.value })}
                    placeholder="📦"
                    aria-label="Icône de la catégorie (emoji)"
                    className="w-12 h-10 px-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-center text-lg shrink-0"
                  />
                  <Input value={cat.name} onChange={(e) => updateCategory(ci, { name: e.target.value })} placeholder="Nom de la catégorie" />
                  <button type="button" onClick={() => removeCategory(ci)} aria-label="Supprimer la catégorie" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pl-2 border-l-2 border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Sous-catégories</span>
                    <button type="button" onClick={() => addSub(ci)} className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
                      <Plus className="w-3 h-3" /> Sous-catégorie
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cat.children.map((sub, si) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <input
                          value={sub.icon}
                          onChange={(e) => updateSub(ci, si, { icon: e.target.value })}
                          placeholder="📦"
                          aria-label="Icône de la sous-catégorie (emoji)"
                          className="w-10 h-9 px-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-center shrink-0"
                        />
                        <Input value={sub.name} onChange={(e) => updateSub(ci, si, { name: e.target.value })} placeholder="Nom de la sous-catégorie" />
                        <button type="button" onClick={() => removeSub(ci, si)} aria-label="Supprimer la sous-catégorie" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {cat.children.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Aucune sous-catégorie.</p>}
                  </div>
                </div>
              </div>
            ))}
            {catalog.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">Aucune catégorie — ajoutez-en une.</p>}
          </div>
        </section>
      )}

      {tab === "parametres" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Paramètres produit</h2>
            <button type="button" onClick={addParam} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Paramètre
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Créez des paramètres (couleur, options, revêtement…) réutilisables sur n'importe quel produit, avec miniatures et coûts. L'activation se fait dans la fiche de chaque produit.
          </p>

          <div className="space-y-4">
            {parameters.map((param, pi) => (
              <div key={param.id} className="rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Input value={param.name} onChange={(e) => updateParam(pi, { name: e.target.value })} placeholder="Nom (ex : Revêtement)" />
                  <select value={param.type} onChange={(e) => updateParam(pi, { type: e.target.value as "single" | "multi" })} className="h-10 px-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm shrink-0">
                    <option value="multi">Multi-sélect</option>
                    <option value="single">Sélect unique</option>
                  </select>
                  <button type="button" onClick={() => removeParam(pi)} aria-label="Supprimer le paramètre" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {param.options.map((opt, oi) => (
                  <div key={opt.id} className="mb-2 rounded-lg border border-[var(--color-border-default)] p-2.5 bg-[var(--color-surface-card)]">
                    <div className="flex items-center gap-2">
                      <input type="color" value={opt.color || "#C89B6D"} onChange={(e) => updateOption(pi, oi, { color: e.target.value })} className="w-9 h-9 rounded-lg border border-[var(--color-border-default)] bg-transparent cursor-pointer shrink-0" />
                      <Input value={opt.label} onChange={(e) => updateOption(pi, oi, { label: e.target.value })} placeholder="Libellé (ex : Chêne)" />
                      <div className="w-28 shrink-0">
                        <input type="number" min={0} value={opt.price == null ? "" : opt.price} onChange={(e) => updateOption(pi, oi, { price: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Coût FCFA" className="w-full h-10 px-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm" />
                      </div>
                      <button type="button" onClick={() => removeOption(pi, oi)} aria-label="Supprimer l'option" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <MediaField value={opt.image ? { type: "image", url: opt.image } : null} onChange={(m) => updateOption(pi, oi, { image: m?.url || null })} label="Miniature (image optionnelle)" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addOption(pi)} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Option
                </button>
              </div>
            ))}
            {parameters.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">Aucun paramètre — ajoutez-en un (ex : Couleur, Options, Revêtement).</p>}
          </div>
        </section>
      )}

      {tab === "livraison" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Zones de livraison & frais de port</h2>
            <button type="button" onClick={addZone} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Zone
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Chaque zone associe des codes pays (ISO, séparés par des virgules) à un forfait de livraison en FCFA.
            Une zone <em>sans pays</em> sert de « reste du monde » (repli). 0 FCFA = livraison gratuite.
          </p>

          <div className="space-y-3">
            {shippingZones.map((z, zi) => (
              <div key={z.id} className="rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Input value={z.label} onChange={(e) => updateZone(zi, { label: e.target.value })} placeholder="Nom de la zone (ex : Côte d'Ivoire)" />
                  <button type="button" onClick={() => removeZone(zi)} aria-label="Supprimer la zone" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Pays (codes ISO)</label>
                    <input
                      value={(z.countries || []).join(", ")}
                      onChange={(e) =>
                        updateZone(zi, {
                          countries: e.target.value.split(/[\s,]+/).filter(Boolean).map((s) => s.toUpperCase()),
                        })
                      }
                      placeholder="CI, SN, BF (vide = reste du monde)"
                      className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Frais (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      value={z.fee_fcfa}
                      onChange={(e) => updateZone(zi, { fee_fcfa: e.target.value === "" ? 0 : Number(e.target.value) })}
                      placeholder="0 = gratuit"
                      className="w-full h-10 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "paiement" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Méthodes de paiement en ligne</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Cochez les méthodes qui sont <strong>live sur FedaPay</strong>. Les méthodes non cochées
            apparaissent grisées (« Bientôt ») au checkout.
          </p>

          <div className="space-y-2">
            {paymentMethods.map((m, mi) => (
              <label
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border-default)] p-3 cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{m.label}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${m.live ? "text-[var(--color-success)]" : "text-[var(--color-text-tertiary)]"}`}>
                    {m.live ? "Live" : "Grisée"}
                  </span>
                  <input
                    type="checkbox"
                    checked={m.live}
                    onChange={() => toggleMethodLive(mi)}
                    className="w-4 h-4 accent-[var(--color-accent-blue)]"
                  />
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      {tab === "faq" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Pilules FAQ (fenêtre au clic)</h2>
            <button type="button" onClick={addPill} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Pilule
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Ces pilules s&apos;affichent sur <strong>toutes les fiches produit</strong> (section « Questions fréquentes ») et s&apos;ouvrent dans une fenêtre au clic. Contrairement à la FAQ (accordéon) qui est propre à chaque produit, elles sont modifiables ici de façon globale.
          </p>

          <div className="space-y-2">
            {faqPills.map((p, i) => (
              <div key={p.id} className="rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)] w-5 shrink-0 text-center">{i + 1}</span>
                  <Input value={p.label} onChange={(e) => updatePill(i, { label: e.target.value })} placeholder="Libellé (ex : Livraison)" />
                  <div className="flex items-center shrink-0">
                    <button type="button" onClick={() => movePill(i, -1)} disabled={i === 0} aria-label="Monter" className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => movePill(i, 1)} disabled={i === faqPills.length - 1} aria-label="Descendre" className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => removePill(i)} aria-label="Supprimer" className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={p.content}
                  onChange={(e) => updatePill(i, { content: e.target.value })}
                  placeholder="Contenu affiché dans la fenêtre"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>
            ))}
            {faqPills.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">Aucune pilule — le site utilisera la FAQ par défaut.</p>}
          </div>
        </section>
      )}

      {tab === "ideadeco" && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Vidéos « Idées décos »</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Ajoutez des vidéos verticales (9:16) par univers. Elles s&apos;affichent en slider en bas
            des fiches produit de l&apos;univers correspondant. Chaque vidéo peut être liée à un produit
            (cible du bouton « Shop »).
          </p>

          <div className="space-y-5">
            {CATEGORIES.map((fam) => {
              const list = ideaDecoFor(fam.id);
              return (
                <div key={fam.id} className="rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      <span className="mr-1.5">{fam.icon}</span>
                      {fam.name}
                    </span>
                    <button type="button" onClick={() => addIdeaVideo(fam.id)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Vidéo
                    </button>
                  </div>

                  {list.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Aucune vidéo pour cet univers.</p>}

                  <div className="space-y-3">
                    {list.map((v, i) => (
                      <div key={i} className="rounded-lg border border-[var(--color-border-default)] p-3 bg-[var(--color-surface-card)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">Vidéo {i + 1}</span>
                          <button type="button" onClick={() => removeIdeaVideo(fam.id, i)} aria-label="Supprimer la vidéo" className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <MediaField
                          value={v.url ? { type: "video", url: v.url } : null}
                          onChange={(m) => updateIdeaVideo(fam.id, i, { url: m?.url || "" })}
                          label="Vidéo (9:16)"
                          hint={MEDIA_SPECS.ideaDecoVideo}
                          accept="video/*"
                        />

                        <div className="mt-3">
                          <MediaField
                            value={v.poster ? { type: "image", url: v.poster } : null}
                            onChange={(m) => updateIdeaVideo(fam.id, i, { poster: m?.url || null })}
                            label="Image d'affiche (optionnelle)"
                          />
                        </div>

                        <div className="mt-3">
                          <span className="block text-xs text-[var(--color-text-secondary)] mb-1">Produits liés (bouton « Produits »)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                            {products.map((p) => {
                              const slugs = v.product_slugs || [];
                              const selected = slugs.includes(p.slug);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    const next = selected ? slugs.filter((s) => s !== p.slug) : [...slugs, p.slug];
                                    updateIdeaVideo(fam.id, i, { product_slugs: next });
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg border p-1.5 text-left transition-colors",
                                    selected
                                      ? "border-[var(--color-accent-blue)] bg-[var(--color-bg-secondary)]"
                                      : "border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:bg-[var(--color-bg-tertiary)]"
                                  )}
                                >
                                  <span className="w-9 h-9 shrink-0 rounded-md overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                                    {p.main_image_url ? (
                                      <img src={imgProxyUrl(p.main_image_url, 60, 80)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] text-xs">✨</span>
                                    )}
                                  </span>
                                  <span className="flex-1 min-w-0 text-xs text-[var(--color-text-primary)] truncate">{p.name}</span>
                                  <span className={cn("w-4 h-4 shrink-0 rounded border flex items-center justify-center", selected ? "bg-[var(--color-accent-blue)] border-[var(--color-accent-blue)]" : "border-[var(--color-border-strong)]")}>
                                    {selected && <Check className="w-3 h-3 text-white" />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Sélectionnez un ou plusieurs produits (tout univers confondu).</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <SaveBar
        saving={saving}
        dirty={dirty}
        message={message}
        onSave={handleSave}
        cancelHref="/admin/reglages"
      />
    </div>
  );
}
