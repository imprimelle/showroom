import Link from "next/link";
import { getPublishedProducts } from "@/lib/products";
import { getShowcaseSettings } from "@/lib/settings";
import { CATEGORIES, resolveFamily } from "@/lib/categories";
import { ProductSlider } from "@/components/product/ProductSlider";
import { HeroSlider } from "@/components/hero/HeroSlider";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import { ChoiceGuide } from "@/components/decision/ChoiceGuide";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/admin/content/EditableText";
import { imgProxyUrl } from "@/lib/images";
import { getWhatsAppUrl, normalizePhone } from "@/lib/utils";
import { quoteMessage } from "@/lib/whatsapp";
import { Truck, ShieldCheck, MapPin, Lock, ArrowRight } from "lucide-react";
import type { ShowcaseProduct } from "@/lib/products";
import type { MediaItem } from "@/types";
import { DEFAULT_REASSURANCE, DEFAULT_STEPS, DEFAULT_CTA } from "@/lib/home";
import { buildGroupageHomeItems } from "@/lib/groupage-home";
import { GroupageHomeSlider } from "@/components/product/GroupageHomeSlider";
import { ResellerHomeSection } from "@/components/resellers/ResellerHomeSection";
import { StoreDirectory } from "@/components/resellers/StoreDirectory";

export const dynamic = "force-dynamic";

const reassuranceIcons = [Truck, ShieldCheck, MapPin, Lock];
const stepIcons = ["🔍", "🛒", "📞", "🚚"];

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getShowcaseSettings(),
    getPublishedProducts().catch(() => [] as ShowcaseProduct[]),
  ]);

  const whatsapp = normalizePhone(settings.contact?.whatsapp);
  const heroTitle = settings.hero?.title || "La lumière, sur mesure.";
  const heroCta = settings.hero?.cta_text || "Voir le catalogue";
  const heroCtaHref = settings.hero?.cta_href || "/collection";

  const ctaTitle = settings.home?.cta_title || DEFAULT_CTA.title;
  const ctaDesc = settings.home?.cta_desc || DEFAULT_CTA.desc;
  const homeReassurance = settings.home?.reassurance;
  const reassuranceItems = DEFAULT_REASSURANCE.map((r, i) => ({
    icon: reassuranceIcons[i],
    title: homeReassurance?.[i]?.title || r.title,
    desc: homeReassurance?.[i]?.desc || r.desc,
  }));
  const homeSteps = settings.home?.steps;
  const stepItems = DEFAULT_STEPS.map((s, i) => ({
    icon: stepIcons[i],
    title: homeSteps?.[i]?.title || s.title,
    desc: homeSteps?.[i]?.desc || s.desc,
  }));

  // Produits en vedette : sélection admin (home.featured) prioritaire,
  // complétée à 6 produits (grille 2×3) par les plus populaires restants.
  const featuredIds = settings.home?.featured;
  const selected = featuredIds?.length
    ? featuredIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is ShowcaseProduct => !!p)
    : [];
  const byPopularity = [...products].sort(
    (a, b) => (b.showcase?.popularity || 0) - (a.showcase?.popularity || 0)
  );
  const featured = [
    ...selected,
    ...byPopularity.filter((p) => !selected.some((s) => s.id === p.id)),
  ].slice(0, 6);

  // Slides du hero : personnalisés (admin) sinon fallback sur les produits mis en avant
  const fallbackSlides: MediaItem[] = featured
    .filter((p) => p.main_image_url)
    .slice(0, 5)
    .map((p) => ({ type: "image", url: p.main_image_url as string, alt: p.name }));

  const heroSlides: MediaItem[] = settings.hero?.slides?.length
    ? settings.hero.slides
    : settings.hero?.video_url
      ? [{ type: "video", url: settings.hero.video_url }]
      : fallbackSlides;

  const familyCounts = CATEGORIES.map((fam) => {
    const prod = products.find(
      (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === fam.id && p.main_image_url
    );
    const custom = settings.categories?.[fam.id];
    const media: MediaItem | null = custom?.media
      ? custom.media
      : prod?.main_image_url
        ? { type: "image" as const, url: prod.main_image_url, alt: fam.name }
        : fam.image
          ? { type: "image" as const, url: fam.image, alt: fam.name }
          : null;
    return {
      ...fam,
      count: products.filter((p) => resolveFamily(p.showcase?.family, p.showcase?.category) === fam.id).length,
      media,
      title: custom?.title || fam.name,
    };
  });

  const realisationImages = products.filter((p) => p.main_image_url).slice(0, 4);

  // Produits groupables pour le slider « groupage » (résolus côté serveur ;
  // la jauge « live » est chargée côté client par le composant).
  const groupageItems = buildGroupageHomeItems(products, settings.product_parameters);

  return (
    <div>
      {/* ===== 1. Hero (slider plein écran, style Cozey) ===== */}
      <section className="relative w-full aspect-[3/4] md:aspect-auto md:h-[80dvh] md:min-h-[540px] md:max-h-[90dvh]">
        <HeroSlider
          slides={heroSlides}
          title={heroTitle}
          subtitle={settings.hero?.subtitle || undefined}
          ctaText={heroCta}
          ctaHref={heroCtaHref}
          whatsappHref={getWhatsAppUrl(whatsapp, quoteMessage())}
        />
      </section>

      {/* ===== 1.5 Groupages en cours (juste sous le héro) ===== */}
      {groupageItems.length > 0 && <GroupageHomeSlider items={groupageItems} />}

      {/* ===== 2. Produits en vedette (remontés sous le groupage) ===== */}
      {featured.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader
              align="left"
              eyebrow="Sélection"
              title="Nos produits vedettes"
              subtitle="Les plus appréciés par nos clients"
              eyebrowKey="home.featured.eyebrow"
              titleKey="home.featured.title"
              subtitleKey="home.featured.subtitle"
              action={
                <Link href="/collection" className="text-sm font-medium text-[var(--color-accent-blue)] hover:underline">
                  <EditableText contentKey="home.featured.see_all" defaultValue="Voir tout →" />
                </Link>
              }
            />
            <ProductSlider products={featured} />
            <div className="mt-6 text-center md:hidden">
              <Link href="/collection">
                <Button variant="secondary" size="sm">
                  <EditableText contentKey="home.featured.see_all_mobile" defaultValue="Voir tout le catalogue" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 3. Catégories (focus familles) ===== */}
      <section className="bg-[var(--color-bg-secondary)] pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            align="left"
            eyebrow="Explorez"
            title="Nos catégories"
            subtitle="Nos univers pour illuminer vos espaces"
            eyebrowKey="home.categories.eyebrow"
            titleKey="home.categories.title"
            subtitleKey="home.categories.subtitle"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {familyCounts.map((fam) => (
              <div
                key={fam.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Média 4/5 — cliquable vers l'univers */}
                <Link
                  href={`/collection/categorie/${fam.id}`}
                  aria-label={`Voir l'univers ${fam.title}`}
                  className="relative aspect-[4/5] overflow-hidden block cursor-pointer bg-[var(--color-bg-tertiary)]"
                >
                  {fam.media ? (
                    <MediaRenderer
                      url={fam.media.url}
                      alt={fam.media.alt || fam.name}
                      type={fam.media.type}
                      imgWidth={800}
                      imgHeight={1000}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${fam.color}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Icône (chip verre dépoli, haut-gauche) */}
                  <div className="absolute top-3 left-3 w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-sm">
                    {fam.icon}
                  </div>

                  {/* Compteur (badge, haut-droite) */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/40 backdrop-blur-md text-white border border-white/15">
                    {fam.count} produit{fam.count > 1 ? "s" : ""}
                  </span>

                  {/* Titre (bas-gauche) */}
                  <div className="absolute bottom-4 left-4 right-16">
                    <h3 className="text-white text-xl md:text-2xl font-display font-bold leading-tight drop-shadow-sm">
                      {fam.title}
                    </h3>
                  </div>

                  {/* Flèche (bas-droite) */}
                  <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white text-[var(--color-text-primary)] flex items-center justify-center shadow-md group-hover:bg-[var(--color-accent-amber)] group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>

                {/* Sous-catégories + CTA */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  {fam.children.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fam.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/collection?category=${sub.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                        >
                          <span className="text-sm leading-none">{sub.icon}</span>
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      <EditableText contentKey="home.categories.empty" defaultValue="Bientôt disponible" />
                    </p>
                  )}

                  <Link
                    href={`/collection/categorie/${fam.id}`}
                    className="mt-auto pt-1 block"
                  >
                    <span className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-semibold min-h-[44px] px-6 text-sm transition-colors hover:bg-[#2A2A2A]">
                      <EditableText contentKey="home.categories.explore" defaultValue="Explorer la catégorie" />
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. Devenir revendeur (après les catégories) ===== */}
      <ResellerHomeSection />

      {/* ===== 5. Guide de choix ===== */}
      <ChoiceGuide products={products} />

      {/* ===== 4. Réassurance ===== */}
      <section className="bg-[var(--color-cream)] border-y border-[var(--color-border-default)]">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {reassuranceItems.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2">
              <item.icon className="w-7 h-7 text-[var(--color-accent-amber)]" />
              <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">{item.title}</h4>
              <p className="text-xs text-[var(--color-text-secondary)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 5. Réalisations ===== */}
      {realisationImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <SectionHeader
            align="left"
            eyebrow="Portfolio"
            title="Nos dernières réalisations"
            subtitle="Un aperçu de nos projets récents"
            eyebrowKey="home.realisations.eyebrow"
            titleKey="home.realisations.title"
            subtitleKey="home.realisations.subtitle"
            action={
              <Link href="/realisations" className="text-sm font-medium text-[var(--color-accent-blue)] hover:underline">
                <EditableText contentKey="home.realisations.see_all" defaultValue="Tout voir →" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {realisationImages.map((p) => (
              <Link key={p.id} href={`/collection/${p.slug}`} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img
                  src={imgProxyUrl(p.main_image_url, 600, 600)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium truncate">{p.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link href="/realisations">
              <Button variant="secondary" size="sm">
                <EditableText contentKey="home.realisations.see_all_mobile" defaultValue="Voir toutes les réalisations" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ===== 6. Comment ça marche ===== */}
      <section className="bg-[var(--color-cream)] border-y border-[var(--color-border-default)]">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <SectionHeader
            eyebrow="Simple & rapide"
            title="Comment ça marche"
            subtitle="De la commande à la livraison en 4 étapes"
            eyebrowKey="home.how.eyebrow"
            titleKey="home.how.title"
            subtitleKey="home.how.subtitle"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stepItems.map((step) => (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--color-surface-card)] flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{step.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 7. CTA Devis ===== */}
      <section className="bg-[var(--color-text-primary)] py-12 md:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-[var(--color-bg-primary)]">
            {ctaTitle}
          </h2>
          <p className="mt-3 text-[var(--color-bg-secondary)]/80">
            {ctaDesc}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a href={getWhatsAppUrl(whatsapp, quoteMessage("Devis gratuit"))} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg">
                <EditableText contentKey="home.cta.whatsapp" defaultValue="💬 Devis gratuit sur WhatsApp" />
              </Button>
            </a>
            <Link href="/comment-ca-marche">
              <Button variant="secondary" size="lg" className="bg-transparent text-[var(--color-bg-primary)] border-[var(--color-bg-primary)]/30 hover:bg-white/10">
                <EditableText contentKey="home.cta.how" defaultValue="Comment ça marche" /> <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 8. Points de vente partenaires (tout en bas) ===== */}
      <StoreDirectory />
    </div>
  );
}
