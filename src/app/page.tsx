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
import { ArrowRight } from "lucide-react";
import type { ShowcaseProduct } from "@/lib/products";
import type { MediaItem } from "@/types";
import { DEFAULT_REASSURANCE, DEFAULT_REASSURANCE_TITLE, DEFAULT_SOCIAL_PROOF_STAT, DEFAULT_SOCIAL_PROOF_LABEL, DEFAULT_LOGOS, DEFAULT_FLASH_SALE, normalizeLogos } from "@/lib/home";
import { buildGroupageHomeItems } from "@/lib/groupage-home";
import { GroupageHomeSlider } from "@/components/product/GroupageHomeSlider";
import { ResellerHomeSection } from "@/components/resellers/ResellerHomeSection";
import { StoreDirectory } from "@/components/resellers/StoreDirectory";
import { ReassuranceBlock } from "@/components/home/ReassuranceBlock";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";
import { HomeQuickLinks } from "@/components/search/HomeQuickLinks";
import { resolveQuickLinks, DEFAULT_HOME_SEARCH_QUESTION } from "@/lib/home-search";
import { FlashSaleSlider } from "@/components/product/FlashSaleSlider";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getShowcaseSettings(),
    getPublishedProducts().catch(() => [] as ShowcaseProduct[]),
  ]);

  const whatsapp = normalizePhone(settings.contact?.whatsapp);
  const heroTitle = settings.hero?.title || "La lumière, sur mesure.";
  const heroCta = settings.hero?.cta_text || "Voir le catalogue";
  const heroCtaHref = settings.hero?.cta_href || "/collection";

  const reassuranceItems = (settings.home?.reassurance?.length
    ? settings.home.reassurance
    : DEFAULT_REASSURANCE
  ).map((r) => ({ title: r.title, subtitle: r.desc || null }));
  const reassuranceTitle = settings.home?.reassurance_title || DEFAULT_REASSURANCE_TITLE;
  const reassuranceLogos = normalizeLogos(settings.home?.logos);
  const resolvedLogos = reassuranceLogos.length ? reassuranceLogos : DEFAULT_LOGOS;
  const socialProofStat = settings.home?.social_proof_stat || DEFAULT_SOCIAL_PROOF_STAT;
  const socialProofLabel = settings.home?.social_proof_label || DEFAULT_SOCIAL_PROOF_LABEL;

  // Sélection : 3 sliders « Tops » non-automatiques, un par famille
  // (Mobilier / Tableaux / Enseignes), triés par popularité décroissante.
  // Chaque « top » est enveloppé dans un fond de couleur distinct, légèrement
  // transparent, arrondi (plus léger que les cartes produit).
  const byPopularity = [...products].sort(
    (a, b) => (b.showcase?.popularity || 0) - (a.showcase?.popularity || 0)
  );
  const FEATURED_FAMILIES = [
    { familyId: "mobilier-decorations", title: "Top du Mobilier", bg: "bg-[#FDE9D0]/60", icon: "/icons/family/canape-long.png" },
    { familyId: "tableaux-decoratifs", title: "Top des Tableaux", bg: "bg-[#DBEAFE]/60", icon: "/icons/family/portrait.png" },
    { familyId: "enseignes-signaletique", title: "Top des Enseignes", bg: "bg-[#D1FAE5]/60", icon: "/icons/family/ampoule.png" },
  ] as const;
  const featuredSliders = FEATURED_FAMILIES.map((f) => {
    const media = settings.categories?.[f.familyId]?.media;
    return {
      ...f,
      products: byPopularity
        .filter(
          (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === f.familyId
        )
        .slice(0, 6),
      // Vidéo d'en-tête : la même que celle de la section « Nos catégories ».
      video: media?.type === "video" ? media : null,
    };
  }).filter((s) => s.products.length > 0);

  // Slide « Vente flash » (indépendant, juste avant la sélection).
  const flashSale = settings.flash_sale;
  const flashEnabled = flashSale?.enabled !== false;
  const flashProducts = (flashSale?.product_slugs || [])
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is ShowcaseProduct => Boolean(p));

  // Produits les plus populaires (fallback des slides du hero).
  const featured = byPopularity.slice(0, 6);

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

  const realisationImages = products.filter((p) => p.main_image_url).slice(0, 4);

  // Produits groupables pour le slider « groupage » (résolus côté serveur ;
  // la jauge « live » est chargée côté client par le composant).
  const groupageItems = buildGroupageHomeItems(products, settings.product_parameters);

  // Section recherche accueil (barre animée + liens rapides).
  const homeSearch = settings.home_search;
  const searchEnabled = homeSearch?.enabled !== false;
  const searchQuestion = homeSearch?.question?.trim() || DEFAULT_HOME_SEARCH_QUESTION;
  const searchTerms = byPopularity.map((p) => p.name).filter(Boolean).slice(0, 8);
  const quickLinks = searchEnabled ? resolveQuickLinks(homeSearch?.quick_links, CATEGORIES, products) : [];

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

      {/* ===== 1.25 Recherche accueil (barre sticky animée + liens rapides) ===== */}
      {searchEnabled && (
        <>
          <div className="sticky top-[var(--topbar-height)] z-30 bg-[var(--color-bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <HomeSearchBar question={searchQuestion} terms={searchTerms} />
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <HomeQuickLinks links={quickLinks} />
          </div>
        </>
      )}

      {/* ===== 1.75 Vente flash (slide rouge, indépendant — juste avant la sélection) ===== */}
      {flashEnabled && (
        <div className="max-w-7xl mx-auto px-4 pb-4 md:pb-6">
          <FlashSaleSlider
            title={flashSale?.title || DEFAULT_FLASH_SALE.title}
            buttonHref={flashSale?.button_href || DEFAULT_FLASH_SALE.button_href}
            endTime={flashSale?.end_time || DEFAULT_FLASH_SALE.end_time}
            products={flashProducts}
          />
        </div>
      )}

      {/* ===== 2. Sélection : 3 sliders « Tops » (un par famille), non-automatiques ===== */}
      {featuredSliders.length > 0 && (
        <section className="py-8 md:py-10">
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
            <div className="space-y-4">
              {featuredSliders.map((s) => (
                <div key={s.familyId} className={`${s.bg} rounded-lg overflow-hidden`}>
                  {s.video && (
                    <MediaRenderer
                      url={s.video.url}
                      type="video"
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <div className="px-2 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.icon} alt="" className="h-6 w-6 object-contain" />
                        </span>
                        <h3 className="text-xl md:text-2xl font-bold font-display text-[var(--color-text-primary)]">
                          {s.title}
                        </h3>
                      </div>
                      <Link
                        href={`/collection/categorie/${s.familyId}`}
                        aria-label={`Explorer ${s.title}`}
                        className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] shadow-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <ProductSlider products={s.products} autoPlay={false} />
                  </div>
                </div>
              ))}
            </div>
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

      {/* ===== 3. Preuve sociale + Réassurance (juste après les « Top produits ») ===== */}
      <ReassuranceBlock
        stat={socialProofStat}
        label={socialProofLabel}
        title={reassuranceTitle}
        items={reassuranceItems}
        logos={resolvedLogos}
      />

      {/* ===== 4. Groupages en cours (suit la réassurance) ===== */}
      {groupageItems.length > 0 && <GroupageHomeSlider items={groupageItems} />}

      {/* ===== 5. Réalisations ===== */}
      {realisationImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 md:py-10">
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

      {/* ===== 8. Besoin d'un conseil ? (guide de choix — avant « Devenir partenaire ») ===== */}
      <ChoiceGuide products={products} />

      {/* ===== 9. Devenir revendeur / partenaire ===== */}
      <ResellerHomeSection />

      {/* ===== 10. Points de vente partenaires (tout en bas) ===== */}
      <StoreDirectory />
    </div>
  );
}
