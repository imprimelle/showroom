# Plan d'implémentation — Rendre la console admin complète (contenu, images, vidéos, accueil, catégories)

> **Pour Hermes** : utiliser la skill `subagent-driven-development` pour implémenter tâche par tâche.

**Objectif** : combler tous les écarts entre « ce que le site affiche » et « ce que l'admin peut modifier », en priorité les **images produit** (image principale + galerie), puis les **champs fantômes**, puis le **contenu structuré** (FAQ, variantes, textes d'accueil) et la **structure catégories**.

**Architecture** : aucune nouvelle table ni migration — tout passe par le JSONB existant (`products.showcase`, `products.main_image_url`, `products.gallery_images`, `showcase_settings.data`) et les primitives déjà en place (`MediaField`, `/api/admin/upload`, `MediaRenderer`, `imgProxyUrl`). Zéro nouvelle infra.

**Stack** : Next.js 16 App Router + TypeScript + Supabase (`yqioyfuxviiximembver.supabase.co`). Déploiement tar+SCP sur VPS Hostinger.

---

## Stratégie d'efficacité (pourquoi ce découpage)

1. **Regrouper par déploiement** — le site se déploie par `tar + SCP + docker compose --force-recreate` (pas de remote Git). On minimise les déploiements en livrant des **3 batches** indépendants plutôt que 15 micro-changes.
2. **Réutiliser l'existant** — `MediaField` (URL + upload + aperçu), `/api/admin/upload` (buckets `images`/`videos` publics, vérifiés), `MediaRenderer`, `imgProxyUrl` : **aucun nouveau mécanisme**.
3. **Un seul type de donnée** — étendre `products.showcase` (JSONB sans schéma) et `showcase_settings.data` ; pas de migration SQL.
4. **Corriger les bugs latents dans le même passage** — bug d'écrasement de `showcase`, dérive du secret JWT, URL `.jpe` tronquée : on les traite pendant qu'on touche les mêmes fichiers.
5. **Vérifier en 1 commande** — `npx tsc --noEmit` (exit 0) puis `npm run build`, puis smoke-tests API via `curl`.

---

## Roadmap (3 batches + hardening)

| Batch | Contenu | Impact | Déploiement |
|---|---|---|---|
| **1 (P0)** | Image principale + galerie produit éditables ; miniature dans la liste | Bloquant — 5 produits sans image, 16 sans galerie | Oui |
| **2 (P1)** | Champs fantômes : sous-titre héro, `meta.*` dynamique, `social.*` + `contact` au footer, `analytics` (pixel) | Éditable mais jamais affiché | Oui |
| **3 (P1/P2)** | FAQ produit éditable, textes d'accueil configurables, variantes éditables (décision), couleurs/options tables | Complétude | Oui |
| **Hardening** | JWT secret unifié, fix URL `.jpe`, fix écrasement `showcase` | Robustesse | Optionnel |

---

# Batch 1 — Images produit (P0)

## Tâche 1.1 — Étendre l'API produit (image + galerie)

**Fichier** : modifier `src/app/api/admin/products/[id]/route.ts`

Remplacer le corps du `PUT` (corrige aussi le bug latent d'écrasement de `showcase` quand seul `popularity` est envoyé) :

```ts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { is_published, popularity, showcase, main_image_url, gallery_images } = body;

  const admin = createAdminClient();
  const updates: Record<string, any> = {};

  if (typeof is_published === "boolean") updates.is_published = is_published;
  if (main_image_url !== undefined) updates.main_image_url = main_image_url; // string | null
  if (Array.isArray(gallery_images)) updates.gallery_images = gallery_images; // string[]

  // Merge JSONB showcase — ne JAMAIS écraser, même si seul `popularity` est fourni
  if (typeof popularity === "number" || (showcase && typeof showcase === "object")) {
    const { data: existing } = await admin.from("products").select("showcase").eq("id", id).single();
    const merged = { ...((existing?.showcase as any) || {}), ...(showcase || {}) };
    if (typeof popularity === "number") merged.popularity = popularity;
    updates.showcase = merged;
  }

  const { error } = await admin.from("products").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Vérification** : `export PATH="/home/hermeswebui/.hermes/home/.local/bin:$PATH" && cd /workspace/showroom && npx tsc --noEmit` → exit 0.

---

## Tâche 1.2 — Composant `GalleryField` (multi-upload réutilisable)

**Fichier** : créer `src/components/admin/GalleryField.tsx`

```tsx
"use client";
import { MediaField } from "@/components/admin/MediaField";

export function GalleryField({
  value,
  onChange,
  label,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const update = (i: number, url: string | null) => {
    const next = [...value];
    if (url) next[i] = url;
    else next.splice(i, 1);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {label && <span className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>}
      {value.map((url, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-xs font-bold text-[var(--color-text-tertiary)] mt-2 w-4 shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <MediaField value={{ type: "image", url }} onChange={(m) => update(i, m?.url || null)} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-default)] transition-colors"
      >
        + Ajouter une photo
      </button>
    </div>
  );
}
```

> Note : `gallery_images` est un `text[]` (URLs), PAS `{url, alt}`. Au save on filtre les chaînes vides.

---

## Tâche 1.3 — Brancher image + galerie dans l'admin produit

**Fichier** : modifier `src/app/admin/produits/[id]/ProductEditClient.tsx`

1. Importer `GalleryField` et ajouter l'état (après la ligne 30) :

```tsx
const [mainImage, setMainImage] = useState<string | null>(product.main_image_url);
const [gallery, setGallery] = useState<string[]>(product.gallery_images || []);
```

2. Dans `handleSave`, ajouter au `body` du `JSON.stringify` :

```ts
main_image_url: mainImage,
gallery_images: gallery.filter((u) => u.trim()),
```

3. Ajouter une section **« Médias »** juste avant la section « Héro produit » (ligne ~186) :

```tsx
{/* Médias */}
<section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 mb-4">
  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Médias</h2>
  <MediaField
    value={mainImage ? { type: "image", url: mainImage } : null}
    onChange={(m) => setMainImage(m?.url || null)}
    label="Image principale (fiche, cartes, miniatures, réalisations)"
  />
  <div className="mt-4">
    <GalleryField value={gallery} onChange={setGallery} label="Galerie (photos supplémentaires)" />
  </div>
</section>
```

**Vérification** : `npx tsc --noEmit` → exit 0.

---

## Tâche 1.4 — Miniature dans la liste des produits

**Fichier** : modifier `src/app/admin/produits/ProductListClient.tsx`

Dans la boucle `filtered.map`, remplacer le point coloré (ligne 82) par une vignette :

```tsx
<div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--color-bg-tertiary)]">
  {product.main_image_url ? (
    <img src={imgProxyUrl(product.main_image_url, 120)} alt="" className="w-full h-full object-cover" />
  ) : (
    <span className="w-full h-full flex items-center justify-center text-sm">✨</span>
  )}
</div>
```

Ajouter l'import : `import { imgProxyUrl } from "@/lib/images";`

**Vérification** : `npx tsc --noEmit` → exit 0.

---

## Tâche 1.5 — Smoke-tests API (après déploiement)

```bash
# 1. Upload d'une image de test
curl -s -X POST http://127.0.0.1:3000/api/admin/upload \
  -H "Cookie: admin_token=<JWT>" -F "file=@/tmp/test.jpg"
# → { "url": "https://.../images/public/<uuid>.jpg", "type": "image" }

# 2. Mise à jour produit avec image + galerie
curl -s -X PUT http://127.0.0.1:3000/api/admin/products/<id> \
  -H "Content-Type: application/json" -H "Cookie: admin_token=<JWT>" \
  -d '{"main_image_url":"<url>","gallery_images":["<url2>"]}'
# → { "success": true }
```

---

# Batch 2 — Champs fantômes (P1)

## Tâche 2.1 — Sous-titre du héro (branché)

**Fichier** : modifier `src/app/page.tsx` (ligne ~85)

```tsx
<HeroSlider
  slides={heroSlides}
  title={heroTitle}
  subtitle={settings.hero?.subtitle || undefined}
  ctaText={heroCta}
  ctaHref={heroCtaHref}
  whatsappHref={getWhatsAppUrl(whatsapp, "Bonjour, je souhaite un devis")}
/>
```

## Tâche 2.2 — Métadonnées dynamiques (`meta.*`)

**Fichier** : modifier `src/app/layout.tsx`

Remplacer `export const metadata: Metadata = { ... }` (lignes 31-48) par :

```tsx
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getShowcaseSettings();
  const site = settings.meta?.site_name || "Imprimelle CI";
  const desc = settings.meta?.default_description ||
    "Fabricant d'enseignes, de signalétique et de mobilier lumineux en Côte d'Ivoire. ...";
  return {
    metadataBase: new URL(settings.meta?.domain || "https://imprimelle.com"),
    title: { default: settings.meta?.default_title || "Imprimelle CI — Enseignes & Mobilier Lumineux Sur Mesure", template: `%s | ${site}` },
    description: desc,
    openGraph: { type: "website", locale: "fr_FR", siteName: site },
    robots: { index: true, follow: true },
  };
}
```

> `getShowcaseSettings()` est déjà importé ; le layout est déjà async (RootLayout). `generateMetadata` fera un 2ᵉ fetch (une ligne, négligeable).

## Tâche 2.3 — Réseaux sociaux + contact dans le footer

**Fichiers** : modifier `src/app/layout.tsx` (passer les props) et `src/components/layout/Footer.tsx`

1. `layout.tsx` — `<Footer social={settings.social} contact={settings.contact} />`
2. `Footer.tsx` — accepter les props et rendre conditionnellement :

```tsx
import { Facebook, Instagram, Music2 } from "lucide-react";
import type { ShowcaseSettings } from "@/types";

export function Footer({ social, contact }: { social?: ShowcaseSettings["social"]; contact?: ShowcaseSettings["contact"] }) {
  const links = [
    { href: social?.facebook, icon: Facebook, label: "Facebook" },
    { href: social?.instagram, icon: Instagram, label: "Instagram" },
    { href: social?.tiktok, icon: Music2, label: "TikTok" },
  ].filter((l) => l.href);
  // ... dans la 1re colonne, sous le texte :
  //   {contact?.email && <p className="text-sm ...">{contact.email}</p>}
  //   {contact?.address && <p className="text-sm ...">{contact.address}</p>}
  //   {links.length > 0 && (bloc d'icônes)}
}
```

## Tâche 2.4 — Analytics (pixel) éditable + injecté

**Fichiers** : modifier `SettingsClient.tsx` + `layout.tsx` + créer `src/components/analytics/FBPixel.tsx`

1. `SettingsClient.tsx` — section « Analytics » (le type `analytics` existe déjà) :

```tsx
<section className="rounded-xl border ...">
  <h2>Analytics</h2>
  <Input label="Facebook Pixel ID" value={getVal("analytics.fb_pixel_id")} onChange={(e) => update("analytics.fb_pixel_id", e.target.value)} />
  <div className="mt-3"><Input label="Umami Website ID" value={getVal("analytics.umami_website_id")} onChange={(e) => update("analytics.umami_website_id", e.target.value)} /></div>
</section>
```

2. `FBPixel.tsx` (client) — injecte le script si `pixelId` présent :

```tsx
"use client";
import { useEffect } from "react";
export function FBPixel({ pixelId }: { pixelId?: string }) {
  useEffect(() => {
    if (!pixelId) return;
    // fbq('init', pixelId); fbq('track', 'PageView');  (script standard Meta)
  }, [pixelId]);
  return null;
}
```

3. `layout.tsx` — `<FBPixel pixelId={settings.analytics?.fb_pixel_id} />`.

---

# Batch 3 — Contenu structuré éditable (P1/P2)

## Tâche 3.1 — FAQ produit éditable

1. **Type** : ajouter `faq?: { q: string; a: string }[]` à `showcase` dans `src/lib/products.ts` (et à `ShowcaseProduct`).
2. **Admin** : dans `ProductEditClient`, ajouter un éditeur liste de `{q, a}` (réutiliser le pattern highlights, en 2 champs).
3. **Front** : dans `ProductPageClient.tsx`, remplacer `productFaq` hardcodé par `product.showcase?.faq?.length ? product.showcase.faq : productFaq` (fallback).

## Tâche 3.2 — Variantes éditables (⚠️ décision requise)

- **Option A (recommandée à valider)** : garder en lecture seule — `variants` est généré par AssoAI (colonnes `billing_rules`, `manufacturing_rules`, `session_id` le confirment) ; les éditer ici risquerait d'être écrasé à la prochaine régénération.
- **Option B** : si AssoAI ne régénère plus, rendre `variants` éditables (nom, prix, `attributes.dimensions`/`materials`) via un éditeur dédié + `updates.variants = variants` dans la route PUT.

> À trancher avec l'utilisateur avant d'implémenter.

## Tâche 3.3 — Textes d'accueil configurables (réassurance, étapes, CTA devis)

1. **Type** : ajouter `home?: { reassurance?: {title; desc}[]; steps?: {title; desc}[]; cta_title?; cta_desc? }` à `ShowcaseSettings`.
2. **Admin** : section « Page d'accueil — Sections » dans `SettingsClient`.
3. **Front** : dans `page.tsx`, remplacer les constantes `reassurances` / `steps` et le CTA par `settings.home.*` avec fallback hardcodé.

## Tâche 3.4 — Couleurs/options des tables configurables

1. Déplacer `tableColors` / `tableOptions` vers `showcase` produit (ou `showcase_settings`), ajouter l'UI admin.
2. Consommer dans `ProductPageClient.tsx` (remplacer les constantes lignes 51-65).

---

# Hardening (hors périmètre immédiat)

- **JWT secret unifié** : `middleware.ts` signe avec `ADMIN_PIN`, `lib/admin/auth.ts` et `login/route.ts` priorisent `ADMIN_JWT_SECRET`. Harmoniser les 3 sur une seule source avant d'introduire `ADMIN_JWT_SECRET` (sinon 401 généralisé).
- **URL `.jpe` tronquée** : corriger en DB l'URL de « Portrait Lumineux » (`...jpe` → `...jpeg`) → image ré-affiche.
- **RLS** : vérifier que `products` autorise bien `SELECT` anon (déjà OK car le site affiche).

---

## Vérification & déploiement (par batch)

```bash
# Typecheck rapide (~15s)
export PATH="/home/hermeswebui/.hermes/home/.local/bin:$PATH"
cd /workspace/showroom && npx tsc --noEmit

# Build standalone
cd /workspace/showroom && npm run build
cd .next/standalone/showroom && rm -rf ./public ./.next/static
cp -r /workspace/showroom/public ./public
cp -r /workspace/showroom/.next/static ./.next/static

# Déploiement tar + SCP
cd /workspace/showroom/.next/standalone && tar czf /tmp/showroom-standalone.tar.gz showroom/
scp /tmp/showroom-standalone.tar.gz root@191.101.81.152:/tmp/
ssh root@191.101.81.152 "rm -rf /opt/showroom/standalone && mkdir -p /opt/showroom/standalone && \
  cd /opt/showroom/standalone && tar xzf /tmp/showroom-standalone.tar.gz && \
  cd /opt/showroom && docker compose up -d --force-recreate showroom"

# Vérif
ssh root@191.101.81.152 "curl -sI http://127.0.0.1:3000/ | head -3"
```

**Pièges rappelés** (issus de la skill) : `npm` absent du PATH en build background → préfixer le PATH ; standalone sans `public/` ni `.next/static/` → copier ; pages DB en `force-dynamic` ; `127.0.0.1` (pas l'IP interne qui dérive) ; Zod v4 `error.issues`.

---

## Ordre d'exécution recommandé

1. **Batch 1** (images) — débloque le contenu visuel, le plus urgent.
2. **Batch 2** (fantômes) — rend l'admin honnête (tout champ affiché fonctionne).
3. **Batch 3** (contenu structuré) — après avoir tranché la décision variantes.
4. **Hardening** — quand un déploiement de maintenance se présente.
