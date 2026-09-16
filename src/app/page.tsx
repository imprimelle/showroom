import Link from "next/link";
import { getPublishedProducts } from "@/lib/products";
import { getShowcaseSettings } from "@/lib/settings";
import { CATEGORIES, resolveFamily } from "@/lib/categories";
import { ProductSlider } from "@/components/product/ProductSlider";
import { HeroSlider } from "@/components/hero/HeroSlider";
import { ChoiceGuide } from "@/components/decision/ChoiceGuide";
import { Button } from "@/components/ui/Button";
import { imgProxyUrl } from "@/lib/images";
import { getWhatsAppUrl, normalizePhone } from "@/lib/utils";
import { Truck, ShieldCheck, MapPin, Lock, ArrowRight } from "lucide-react";
import type { ShowcaseProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

const steps = [
  { icon: "🔍", title: "Choisissez", desc: "Parcourez le catalogue et sélectionnez votre produit" },
  { icon: "🛒", title: "Commandez", desc: "4 champs suffisent pour passer commande en 2 minutes" },
  { icon: "📞", title: "Confirmation", desc: "Notre équipe vous appelle sous 24h pour confirmer" },
  { icon: "🚚", title: "Livraison", desc: "Fabrication 7-10 jours, installation incluse à Abidjan" },
];

const reassurances = [
  { icon: Truck, title: "Livraison gratuite", desc: "Sur toute commande" },
  { icon: ShieldCheck, title: "Garantie 2 ans", desc: "Sur tous nos produits" },
  { icon: MapPin, title: "Made in CI", desc: "Fabrication locale" },
  { icon: Lock, title: "Paiement livraison", desc: "Espèces ou mobile money" },
];

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getShowcaseSettings(),
    getPublishedProducts().catch(() => [] as ShowcaseProduct[]),
  ]);

  const whatsapp = normalizePhone(settings.contact?.whatsapp);
  const heroTitle = settings.hero?.title || "La lumière, sur mesure.";
  const heroCta = settings.hero?.cta_text || "Voir le catalogue";

  const featured = [...products]
    .sort((a, b) => (b.showcase?.popularity || 0) - (a.showcase?.popularity || 0))
    .slice(0, 8);

  const heroSlides = featured
    .filter((p) => p.main_image_url)
    .slice(0, 5)
    .map((p) => ({ url: p.main_image_url as string, alt: p.name }));

  const familyCounts = CATEGORIES.map((fam) => {
    const prod = products.find(
      (p) => resolveFamily(p.showcase?.family, p.showcase?.category) === fam.id && p.main_image_url
    );
    return {
      ...fam,
      count: products.filter((p) => resolveFamily(p.showcase?.family, p.showcase?.category) === fam.id).length,
      image: prod?.main_image_url ? imgProxyUrl(prod.main_image_url, 800) : fam.image,
    };
  });

  const realisationImages = products.filter((p) => p.main_image_url).slice(0, 4);

  return (
    <div>
      {/* ===== 1. Hero (slider plein écran, style Cozey) ===== */}
      <section className="relative w-full h-[80dvh] min-h-[540px] max-h-[90dvh]">
        <HeroSlider
          slides={heroSlides}
          title={heroTitle}
          ctaText={heroCta}
          ctaHref="/collection"
          whatsappHref={getWhatsAppUrl(whatsapp, "Bonjour, je souhaite un devis")}
        />
      </section>

      {/* ===== 2. Slider produit (featured) ===== */}
      {featured.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">Nos produits vedettes</h2>
              <Link href="/collection" className="text-sm font-medium text-[var(--color-accent-blue)] hover:underline hidden md:block">
                Voir tout →
              </Link>
            </div>
            <ProductSlider products={featured} />
            <div className="mt-6 text-center md:hidden">
              <Link href="/collection">
                <Button variant="secondary" size="sm">Voir tout le catalogue</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 3. Catégories (focus 3 familles) ===== */}
      <section className="bg-[var(--color-bg-secondary)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">
            Nos catégories
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-10">
            Deux univers pour illuminer vos espaces
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {familyCounts.map((fam) => (
              <div
                key={fam.id}
                className="group overflow-hidden rounded-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)] flex flex-col hover:shadow-lg transition-shadow"
              >
                {/* Image bannière */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {fam.image ? (
                    <img
                      src={fam.image}
                      alt={fam.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${fam.color}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2.5">
                    <span className="text-3xl">{fam.icon}</span>
                    <div>
                      <h3 className="text-white text-lg font-bold leading-tight">{fam.name}</h3>
                      <span className="text-white/70 text-xs">
                        {fam.count} produit{fam.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-5 flex flex-col flex-1">
                  {fam.children.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fam.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/collection?category=${sub.id}`}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg-primary)] transition-colors"
                        >
                          {sub.icon} {sub.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-text-tertiary)]">Bientôt disponible</p>
                  )}

                  <Link
                    href={`/collection/categorie/${fam.id}`}
                    className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent-blue)] hover:underline"
                  >
                    Explorer la catégorie <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3.5 Guide de choix ===== */}
      <ChoiceGuide products={products} />

      {/* ===== 4. Réassurance ===== */}
      <section className="border-b border-[var(--color-border-default)]">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {reassurances.map((item) => (
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
        <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">Nos dernières réalisations</h2>
            <Link href="/realisations" className="text-sm font-medium text-[var(--color-accent-blue)] hover:underline hidden md:block">
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {realisationImages.map((p) => (
              <Link key={p.id} href={`/collection/${p.slug}`} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img
                  src={imgProxyUrl(p.main_image_url, 600)}
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
              <Button variant="secondary" size="sm">Voir toutes les réalisations</Button>
            </Link>
          </div>
        </section>
      )}

      {/* ===== 6. Comment ça marche ===== */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-10">
          Comment ça marche
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.title} className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-2xl">
                {step.icon}
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 7. CTA Devis ===== */}
      <section className="bg-[var(--color-text-primary)] py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-[var(--color-bg-primary)]">
            Un projet spécifique ?
          </h2>
          <p className="mt-3 text-[var(--color-bg-secondary)]/80">
            Envoyez-nous vos dimensions et votre logo — devis gratuit sous 24h, sans engagement.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a href={getWhatsAppUrl(whatsapp, "Bonjour, je souhaite un devis gratuit")} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg">💬 Devis gratuit sur WhatsApp</Button>
            </a>
            <Link href="/comment-ca-marche">
              <Button variant="secondary" size="lg" className="bg-transparent text-[var(--color-bg-primary)] border-[var(--color-bg-primary)]/30 hover:bg-white/10">
                Comment ça marche <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
