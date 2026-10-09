"use client";
import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Shield,
  Star,
  ChevronDown,
  Zap,
  MapPin,
  Minus,
  Plus,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductMediaViewer } from "@/components/product/ProductMediaViewer";
import { StickyProductBar } from "@/components/product/StickyProductBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/stores/cart";
import { getWhatsAppUrl, DEFAULT_WHATSAPP, cn, isVideoUrl } from "@/lib/utils";
import { productInquiryMessage, productUrl } from "@/lib/whatsapp";
import { useFormatPrice } from "@/stores/currency";
import { imgProxyUrl } from "@/lib/images";
import { getCategory, getSubCategory, getCategoryLabel, resolveFamily } from "@/lib/categories";
import { track } from "@/lib/analytics";
import { isOnlinePayable, type ShowcaseProduct } from "@/lib/products";
import { normalizeHighlights } from "@/lib/highlights";
import { DEFAULT_FAQ, DEFAULT_FAQ_PILLS } from "@/lib/faq";
import { HighlightCarousel } from "@/components/product/HighlightCarousel";
import { IdeaDecoSlider } from "@/components/product/IdeaDecoSlider";
import { ReviewSection } from "@/components/product/ReviewSection";
import { StepHeader } from "@/components/product/StepHeader";
import type { ProductParameter, CartItemOption, FaqPill, IdeaDecoSlide, ShowcaseReview, ReviewAggregate } from "@/types";

interface ProductPageClientProps {
  product: ShowcaseProduct;
  relatedProducts: ShowcaseProduct[];
  whatsapp?: string;
  parameters?: ProductParameter[];
  faqPills?: FaqPill[];
  ideaDecoVideos?: IdeaDecoSlide[];
  reviews?: ShowcaseReview[];
  aggregate?: ReviewAggregate;
}

/** Étoile pleine / demi / vide (lucide `Star`). */
function StarIcon({ fill }: { fill: number }) {
  if (fill >= 1) {
    return <Star className="w-4 h-4 text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)]" />;
  }
  if (fill >= 0.5) {
    return (
      <span className="relative inline-block w-4 h-4">
        <Star className="absolute inset-0 w-4 h-4 text-[var(--color-border-strong)]" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
          <Star className="w-4 h-4 text-[var(--color-accent-amber)] fill-[var(--color-accent-amber)]" />
        </span>
      </span>
    );
  }
  return <Star className="w-4 h-4 text-[var(--color-border-strong)]" />;
}

/** Note produit cliquable : agrégat d'avis (sinon repli sur `popularity`). Clic → scroll vers #avis. */
function RatingStars({
  average,
  count,
  popularity,
}: {
  average?: number;
  count?: number;
  popularity?: number;
}) {
  const hasReviews = (count ?? 0) > 0;
  const rating = hasReviews
    ? average ?? 0
    : popularity != null
      ? Math.min(5, Math.max(0, 4 + popularity / 100))
      : 4.5;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const label = `${rating.toFixed(1).replace(".", ",")}${hasReviews ? ` (${count} avis)` : ""}`;
  return (
    <button
      type="button"
      onClick={() => document.getElementById("avis")?.scrollIntoView({ behavior: "smooth" })}
      className="mt-2 flex items-center gap-1.5 group"
      aria-label="Voir les avis clients"
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = i < fullStars ? 1 : i === fullStars && hasHalf ? 0.5 : 0;
          return <StarIcon key={i} fill={fill} />;
        })}
      </span>
      <span className="text-xs font-semibold text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent-amber)] transition-colors">
        {label}
      </span>
    </button>
  );
}

/** Icône « panier + » : un panier avec un « + » à l'intérieur (CTA ajout au panier). */
function CartPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M12 5v7" />
      <path d="M8.5 8.5h7" />
    </svg>
  );
}

export function ProductPageClient({ product, relatedProducts, whatsapp = DEFAULT_WHATSAPP, parameters = [], faqPills = DEFAULT_FAQ_PILLS, ideaDecoVideos = [], reviews = [], aggregate = { average: 0, count: 0, distribution: [] } }: ProductPageClientProps) {
  const formatPrice = useFormatPrice();
  const [selectedSku, setSelectedSku] = useState<string | null>(product.variants?.[0]?.sku ?? null);
  const [cartOpen, setCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [openParam, setOpenParam] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<FaqPill | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  // === Barre produit sticky : apparaît quand l'image principale sort du viewport ===
  const mediaRef = useRef<HTMLDivElement>(null);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyBarVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Masque la TopNav quand la barre produit est visible (cf. globals.css)
  useEffect(() => {
    if (stickyBarVisible) {
      document.body.dataset.stickyProduct = "1";
    } else {
      delete document.body.dataset.stickyProduct;
    }
    return () => {
      delete document.body.dataset.stickyProduct;
    };
  }, [stickyBarVisible]);

  // Verrouille le scroll quand le bottom sheet FAQ est ouvert
  useEffect(() => {
    document.body.style.overflow = activeFaq ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeFaq]);

  // Tracking analytics : vue produit (une fois au montage)
  useEffect(() => {
    track("view_item", {
      product_id: product.id,
      product_name: product.name,
      price: product.variants?.[0]?.price ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVariant = product.variants?.find((v) => v.sku === selectedSku) || null;
  const currentPrice = selectedVariant?.price ?? null;

  // === Sélection des options de paramètres (single/multi) + coûts ===
  const toggleOption = (param: ProductParameter, optionId: string) => {
    setSelectedOptions((prev) => {
      const current = prev[param.id] || [];
      if (param.type === "single") {
        return { ...prev, [param.id]: current.includes(optionId) ? [] : [optionId] };
      }
      return {
        ...prev,
        [param.id]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };
  const selectedOptionsList: CartItemOption[] = parameters.flatMap((param) => {
    const ids = selectedOptions[param.id] || [];
    return ids
      .map((optionId) => {
        const opt = param.options.find((o) => o.id === optionId);
        if (!opt) return null;
        return {
          param_id: param.id,
          option_id: opt.id,
          label: `${param.name} : ${opt.label}`,
          price: opt.price ?? 0,
        };
      })
      .filter((x): x is CartItemOption => Boolean(x));
  });
  const optionsTotal = selectedOptionsList.reduce((sum, o) => sum + o.price, 0);
  const totalPrice = currentPrice != null ? currentPrice + optionsTotal : null;
  // Prix de la ligne = prix unitaire (variante + options) × quantité
  const lineTotal = totalPrice != null ? totalPrice * quantity : null;
  // Libellé prix pour la barre produit sticky (unitaire, options incluses)
  const priceLabel = currentPrice != null ? formatPrice(totalPrice ?? currentPrice) : "Sur devis";

  const showWhatsAppMsg = productInquiryMessage({
    name: product.name,
    variant: selectedVariant?.name,
    priceFcfa: selectedVariant?.price ?? undefined,
    url: productUrl(product.slug),
    options: selectedOptionsList,
  });

  const familyId = resolveFamily(product.showcase?.family, product.showcase?.category);
  const family = familyId ? getCategory(familyId) : undefined;
  const subCategory = getSubCategory(product.showcase?.category);
  const categoryLabel = product.showcase?.category
    ? getCategoryLabel(product.showcase.category)
    : null;
  const highlights = normalizeHighlights(product.showcase?.highlights);
  const variants = product.variants || [];
  const galleryMedia = (product.gallery_images || []).map((url) => ({ url, alt: product.name }));
  // La galerie peut contenir des photos ET des vidéos (détectées par extension d'URL).
  const galleryVideos = galleryMedia.filter((m) => isVideoUrl(m.url));
  const galleryImages = galleryMedia.filter((m) => !isVideoUrl(m.url));
  const allImages = [
    ...(product.main_image_url ? [{ url: product.main_image_url, alt: product.name }] : []),
    ...galleryImages,
  ];
  const variantImage = selectedVariant?.image || null;
  // Images du héro : principale + galerie + image de la variante sélectionnée (si absente de la galerie)
  const heroImages =
    variantImage && !allImages.some((i) => i.url === variantImage)
      ? [...allImages, { url: variantImage, alt: `${product.name} — ${selectedVariant?.name || ""}` }]
      : allImages;
  const heroVideo = product.showcase?.hero_video_url || null;
  const hasVariantsTable = variants.some((v) => v.attributes?.dimensions || v.attributes?.materials);
  const faqItems = product.showcase?.faq?.length ? product.showcase.faq : DEFAULT_FAQ;

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.price == null) return;
    const key = `${product.id}:${selectedVariant.sku}:${selectedOptionsList
      .map((o) => `${o.param_id}.${o.option_id}`)
      .sort()
      .join("|")}`;
    addItem({
      key,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_label: selectedVariant.name,
      variant_sku: selectedVariant.sku,
      quantity,
      unit_price_fcfa: totalPrice ?? selectedVariant.price,
      image_url: product.main_image_url,
      options: selectedOptionsList,
      online_enabled: !!product.showcase?.payment?.online_enabled,
      cash_on_delivery: !!product.showcase?.payment?.cash_on_delivery,
    });
    setCartOpen(true);
  };

  return (
    <div className="pb-12">
      {/* ===== Produit : média sticky (gauche) + panneau info (droite) ===== */}
      <div className="md:max-w-7xl md:mx-auto md:px-4 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-12 md:items-start">
          {/* Bloc média sticky (pleine largeur, sans marge sur mobile) */}
          <ProductMediaViewer
            images={heroImages}
            defaultImage={variantImage ?? product.main_image_url ?? heroImages[0]?.url}
            videoUrl={heroVideo}
            galleryVideos={galleryVideos}
            dimensions={selectedVariant?.attributes?.dimensions ?? variants[0]?.attributes?.dimensions ?? null}
            images360={product.showcase?.images_360}
            threeSixtyEnabled={product.showcase?.three_sixty_enabled}
            lightSwitch={product.showcase?.light_switch}
            productName={product.name}
            mediaRef={mediaRef}
          />

          {/* Panneau info */}
          <div className="px-4 py-6 md:px-0 md:py-0">
            <div className="flex items-center gap-2 flex-wrap">
              {family && (
                <Link
                  href={`/collection/categorie/${family.id}`}
                  aria-label={`Voir la catégorie ${family.name}`}
                  className="text-sm font-medium text-[var(--color-accent-amber)] hover:opacity-80 transition-opacity"
                >
                  {family.name.trim().split(/\s+/)[0]}.../
                </Link>
              )}
              {subCategory ? (
                <Link
                  href={`/collection/categorie/${family?.id}?sub=${subCategory.id}`}
                  aria-label={`Voir ${subCategory.name}`}
                  className="inline-flex transition-opacity hover:opacity-80"
                >
                  <Badge variant="category">{subCategory.name}</Badge>
                </Link>
              ) : (
                categoryLabel && <Badge variant="category">{categoryLabel}</Badge>
              )}
              {isOnlinePayable(product) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent-amber)]">
                  <Zap className="w-3.5 h-3.5" /> Express
                </span>
              )}
            </div>

            {/* Nom + prix côte à côte */}
            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] leading-tight">
                  {product.name}
                </h1>
                {/* Étoiles + note (juste sous le nom, visible sur mobile) */}
                <RatingStars average={aggregate.average} count={aggregate.count} popularity={product.showcase?.popularity} />
              </div>

              {/* Prix (côte à côte avec le nom) */}
              <div className="shrink-0 text-right">
                {currentPrice != null ? (
                  <div>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {selectedVariant ? selectedVariant.name : "À partir de"}
                    </span>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                      {formatPrice(totalPrice ?? currentPrice)}
                    </p>
                    {optionsTotal > 0 && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        dont options : +{formatPrice(optionsTotal)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-[var(--color-text-secondary)]">Sur devis</p>
                )}
              </div>
            </div>

            {/* Description courte */}
            {product.showcase?.short_description && (
              <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {product.showcase.short_description}
              </p>
            )}

            {/* Étape 1 — Format */}
            {variants.length > 0 && (
              <div className="mt-5">
                <StepHeader
                  step={1}
                  title="Choisissez votre format"
                  subtitle="Sélectionnez la taille qui vous convient"
                />
                <div className="mt-3">
                  <VariantSelector
                    variants={variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price, dimensions: v.attributes?.dimensions }))}
                    selectedSku={selectedSku}
                    onSelect={(v) => setSelectedSku(v.sku)}
                  />
                </div>
              </div>
            )}

            {/* Étape 2 — Options (single/multi-sélect avec miniatures + coûts) */}
            {parameters.length > 0 && (
              <div className="mt-5">
                <StepHeader
                  step={2}
                  title="Ajoutez des options"
                  subtitle="Personnalisez votre produit"
                  optional
                />
                <div className="mt-3 space-y-2.5">
                  {parameters.map((param) => {
                  const selected = selectedOptions[param.id] || [];
                  const open = openParam === param.id;
                  const summary = selected.length
                    ? selected
                        .map((id) => param.options.find((o) => o.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : "Choisir";
                  return (
                    <div key={param.id} className="rounded-2xl border border-[var(--color-border-strong)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenParam(open ? null : param.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface-card)]"
                      >
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {param.name}
                          {selected.length > 0 && (
                            <span className="ml-1.5 text-xs font-semibold text-[var(--color-accent-amber)]">
                              {selected.length}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm text-[var(--color-text-secondary)] max-w-[160px] truncate">
                            {summary}
                          </span>
                          <ChevronDown className={cn("w-4 h-4 text-[var(--color-text-tertiary)] transition-transform", open && "rotate-180")} />
                        </span>
                      </button>
                      {open && (
                        <div className="border-t border-[var(--color-border-default)] px-4 py-3">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                            {param.options.map((opt) => {
                              const isSelected = selected.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => toggleOption(param, opt.id)}
                                  className={cn(
                                    "relative flex flex-col items-center gap-1.5 rounded-xl p-2 border transition-all",
                                    isSelected
                                      ? "border-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)]"
                                      : "border-transparent hover:bg-[var(--color-bg-tertiary)]"
                                  )}
                                >
                                  {isSelected && (
                                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--color-text-primary)] flex items-center justify-center">
                                      <Check className="w-3 h-3 text-[var(--color-bg-primary)]" />
                                    </span>
                                  )}
                                  {opt.image ? (
                                    <img src={imgProxyUrl(opt.image, 120, 160)} alt={opt.label} className="w-10 h-10 rounded-lg object-cover" />
                                  ) : opt.color ? (
                                    <span className="w-10 h-10 rounded-lg border border-[var(--color-border-strong)]" style={{ backgroundColor: opt.color }} />
                                  ) : (
                                    <span className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center text-lg">✨</span>
                                  )}
                                  <span className="text-[11px] text-[var(--color-text-secondary)] leading-none text-center">{opt.label}</span>
                                  {opt.price != null && opt.price > 0 && (
                                    <span className="text-[10px] font-semibold text-[var(--color-accent-amber)] leading-none">+{formatPrice(opt.price)}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* ===== CTA principal : quantité + bouton + réassurance ===== */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-sm">
              <div className="p-4">
                {variants.length > 0 ? (
                  currentPrice != null ? (
                    <div className="space-y-3">
                      {/* Sélecteur de quantité (bloc arrondi) */}
                      <div className="flex items-center justify-between rounded-full border border-[var(--color-border-strong)] pl-4 pr-1 py-1">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Quantité</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Diminuer la quantité"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-base font-semibold text-[var(--color-text-primary)] min-w-[1.5rem] text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => q + 1)}
                            aria-label="Augmenter la quantité"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <Button
                        variant="success"
                        size="lg"
                        className="w-full px-4! sm:px-8! shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        onClick={handleAddToCart}
                        disabled={!selectedSku}
                      >
                        {selectedSku ? (
                          <span className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-sm">
                            <CartPlusIcon className="h-5 w-5 shrink-0" />
                            <span className="font-semibold">Ajouter au panier</span>
                            <span className="text-[7px] font-bold leading-none" aria-hidden="true">•</span>
                            <span className="font-mono font-bold">{formatPrice(lineTotal ?? 0)}</span>
                          </span>
                        ) : (
                          "Sélectionnez une taille"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
                      <Button variant="whatsapp" size="lg" className="w-full">
                        {selectedSku ? "💬 Demander un devis WhatsApp" : "Sélectionnez une taille"}
                      </Button>
                    </a>
                  )
                ) : (
                  <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
                    <Button variant="whatsapp" size="lg" className="w-full">💬 Demander un devis WhatsApp</Button>
                  </a>
                )}
              </div>
              {/* Réassurance : bandeau séparé sous le bouton */}
              <div className="grid grid-cols-3 gap-2 border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-3">
                {product.showcase?.delivery_time && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent-amber)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-text-tertiary)] leading-none truncate">Délai</p>
                      <p className="text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] leading-tight truncate">{product.showcase.delivery_time}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent-amber)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-[var(--color-text-tertiary)] leading-none truncate">Fabrication</p>
                    <p className="text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] leading-tight truncate">local</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent-amber)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-[var(--color-text-tertiary)] leading-none truncate">Garantie</p>
                    <p className="text-[12px] sm:text-[13px] font-medium text-[var(--color-text-primary)] leading-tight truncate">2 ans</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Points forts : cartes modernes sur fond crème ===== */}
      {highlights.length > 0 && (
        <section className="bg-[var(--color-cream)] border-y border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="text-center mb-5 md:mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                Points forts
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                Ce qui distingue ce produit — cliquez sur une carte pour en savoir plus.
              </p>
            </div>
            <HighlightCarousel highlights={highlights} />
          </div>
        </section>
      )}

      {/* ===== Questions fréquentes ===== */}
      <section className="border-t border-[var(--color-border-default)]">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            Questions fréquentes
          </h2>

          {/* Pilules : 6 boutons (2×3) → bottom sheet */}
          <div className="grid grid-cols-2 gap-2 mb-6">
          {faqPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveFaq(pill)}
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-full bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{pill.label}</span>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
              </button>
            ))}
          </div>

          {/* Accordion FAQ */}
          <div className="space-y-2.5 mb-6">
            {faqItems.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]"
              >
                <summary className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer text-sm font-medium text-[var(--color-text-primary)] select-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="px-4 pb-3.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>

          {/* CTA conseiller */}
          <a href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="w-full">💬 Parler à un conseiller</Button>
          </a>
        </div>
      </section>

      {/* ===== Caractéristiques : tableau moderne sur fond crème ===== */}
      {hasVariantsTable && (
        <section className="bg-[var(--color-cream)] border-y border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="text-center mb-5 md:mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                Caractéristiques
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                Les spécifications selon la taille.
              </p>
            </div>

            {/* Tableau moderne : conteneur arrondi, en-tête fondé, lignes hover */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      <th className="px-4 py-3 font-semibold">Taille</th>
                      <th className="px-4 py-3 font-semibold">Dimensions</th>
                      <th className="px-4 py-3 font-semibold">Matériaux</th>
                      <th className="px-4 py-3 font-semibold text-right">Prix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-default)]">
                    {variants.map((v) => (
                      <tr key={v.id} className="transition-colors hover:bg-[var(--color-bg-secondary)]">
                        <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">{v.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{v.attributes?.dimensions || "—"}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{v.attributes?.materials || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                          {v.price != null ? formatPrice(v.price) : "Sur devis"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Produits similaires ===== */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} sizes="(max-width: 767px) 50vw, 25vw" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Idées décos (vidéos d'inspiration par univers) ===== */}
      <IdeaDecoSlider videos={ideaDecoVideos} />

      {/* ===== Avis clients (mur global : note + fil + formulaire) ===== */}
      <ReviewSection
        productSlug={product.slug}
        reviews={reviews}
      />


      {/* Bottom sheet FAQ */}
      <AnimatePresence>
        {activeFaq && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={() => setActiveFaq(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-[var(--color-surface-card)] rounded-t-2xl px-5 pt-4 pb-6 max-h-[70vh] overflow-y-auto"
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border-strong)]" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">{activeFaq.label}</h3>
                <button
                  type="button"
                  onClick={() => setActiveFaq(null)}
                  aria-label="Fermer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{activeFaq.content}</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Barre produit sticky (remplace la TopNav quand l'image principale est sortie du viewport) */}
      <StickyProductBar
        name={product.name}
        priceLabel={priceLabel}
        image={variantImage ?? product.main_image_url}
        visible={stickyBarVisible}
      />

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
