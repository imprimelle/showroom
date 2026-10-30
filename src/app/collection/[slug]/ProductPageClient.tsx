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
  Users,
  Rotate3d,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductMediaViewer, type ProductMediaViewerHandle } from "@/components/product/ProductMediaViewer";
import { StickyProductBar } from "@/components/product/StickyProductBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/stores/cart";
import { useCheckoutStore } from "@/stores/checkout";
import { useUiStore } from "@/stores/ui";
import { useRemisesStore } from "@/stores/remises";
import { computePrice } from "@/lib/remises";
import { getWhatsAppUrl, DEFAULT_WHATSAPP, cn, isVideoUrl } from "@/lib/utils";
import { productInquiryMessage, productUrl } from "@/lib/whatsapp";
import { useFormatPrice } from "@/stores/currency";
import { imgProxyUrl } from "@/lib/images";
import { getCategory, getSubCategory, getCategoryLabel, resolveFamily } from "@/lib/categories";
import { track } from "@/lib/analytics";
import { isOnlinePayable, type ShowcaseProduct } from "@/lib/products";
import { resolveGroupageConfig, resolveGroupageVariant, groupagePrice, groupageReductionAmount, GROUPAGE_MAX_DURATION_DAYS, resolveGroupageInfo } from "@/lib/groupage";
import { GroupageCard } from "@/components/product/GroupageCard";
import { normalizeHighlights } from "@/lib/highlights";
import { DEFAULT_FAQ, DEFAULT_FAQ_PILLS } from "@/lib/faq";
import { HighlightCarousel } from "@/components/product/HighlightCarousel";
import { IdeaDecoSlider } from "@/components/product/IdeaDecoSlider";
import { ReviewSection } from "@/components/product/ReviewSection";
import { StepHeader } from "@/components/product/StepHeader";
import { EditableText } from "@/components/admin/content/EditableText";
import type { ProductParameter, CartItemOption, FaqPill, IdeaDecoSlide, ShowcaseReview, ReviewAggregate, GroupageInfo } from "@/types";

interface ProductPageClientProps {
  product: ShowcaseProduct;
  relatedProducts: ShowcaseProduct[];
  whatsapp?: string;
  parameters?: ProductParameter[];
  faqPills?: FaqPill[];
  ideaDecoVideos?: IdeaDecoSlide[];
  reviews?: ShowcaseReview[];
  aggregate?: ReviewAggregate;
  groupageInfo?: GroupageInfo;
  /** Interrupteur global maître des vues 360° (Réglages → 360°). */
  threeSixtyGlobalEnabled?: boolean;
  /** Affiche le bouton flottant « Voir le produit en 360° » (barre sticky). */
  threeSixtyStickyButtonEnabled?: boolean;
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

export function ProductPageClient({ product, relatedProducts, whatsapp = DEFAULT_WHATSAPP, parameters = [], faqPills = DEFAULT_FAQ_PILLS, ideaDecoVideos = [], reviews = [], aggregate = { average: 0, count: 0, distribution: [] }, groupageInfo, threeSixtyGlobalEnabled = true, threeSixtyStickyButtonEnabled = false }: ProductPageClientProps) {
  const formatPrice = useFormatPrice();
  const searchParams = useSearchParams();
  const preselectGroupage = searchParams?.get("groupage") === "1";
  const [selectedSku, setSelectedSku] = useState<string | null>(
    preselectGroupage ? null : product.variants?.[0]?.sku ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [openParam, setOpenParam] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<FaqPill | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCheckout = useCheckoutStore((s) => s.open);
  const setHasStickyBar = useUiStore((s) => s.setHasStickyBar);

  // Tracking `view_item` (une seule fois par fiche produit).
  useEffect(() => {
    const minPrice = product.variants?.reduce<number | null>(
      (min, v) => (v.price != null && (min == null || v.price < min) ? v.price : min),
      null
    );
    track("view_item", {
      product_slug: product.slug,
      product_name: product.name,
      value: minPrice ?? undefined,
      currency: "XOF",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  // Remonte toujours en haut de page à chaque changement de produit
  // (clic sur une miniature / carte produit).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product.slug]);

  // === Groupage (achat groupé) : config produit + statut live (jauge de places) ===
  const groupageConfig = resolveGroupageConfig(product.showcase);
  const groupPrice = groupageConfig ? groupagePrice(groupageConfig, product.variants) : null;
  const clonedVariant = groupageConfig ? resolveGroupageVariant(groupageConfig, product.variants) : null;
  const originalPrice = clonedVariant?.price ?? null;
  const groupageReduction = groupageConfig ? groupageReductionAmount(groupageConfig, product.variants) : null;
  const info = resolveGroupageInfo(groupageInfo);
  const [groupageSelected, setGroupageSelected] = useState(preselectGroupage);
  const [groupageOptions, setGroupageOptions] = useState<Record<string, string[]>>({});
  const [groupageQuantity, setGroupageQuantity] = useState(1);
  const [shareCount, setShareCount] = useState(0);
  const [groupageStatus, setGroupageStatus] = useState<{
    places_taken: number;
    max_places: number;
    remaining: number;
    days_remaining: number;
  } | null>(null);

  useEffect(() => {
    if (!groupageConfig) return;
    let active = true;
    fetch(`/api/groupage?product_id=${product.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d?.enabled) return;
        setGroupageStatus({
          places_taken: d.places_taken ?? 0,
          max_places: d.max_places ?? groupageConfig.max_places,
          remaining: d.remaining ?? groupageConfig.max_places,
          days_remaining: d.days_remaining ?? GROUPAGE_MAX_DURATION_DAYS,
        });
        setShareCount(d.shares_count ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // === Barre produit sticky : apparaît quand l'image principale sort du viewport ===
  const mediaRef = useRef<HTMLDivElement>(null);
  const media360Ref = useRef<ProductMediaViewerHandle | null>(null);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  // === Bouton flottant « Voir le produit en 360° » : sous la barre sticky, visible dès
  // que la section « Points forts » entre à l'écran (et masqué en remontant). ===
  const pointsFortsRef = useRef<HTMLElement>(null);
  const [show360Btn, setShow360Btn] = useState(false);
  const [pepiteClicked, setPepiteClicked] = useState<boolean>(() => {
    try {
      return typeof sessionStorage !== "undefined" && sessionStorage.getItem(`showroom_pepite_clicked_${product.slug}`) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const el = pointsFortsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShow360Btn(entry.boundingClientRect.top < window.innerHeight),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Clic : mémorise le clic (fin de l'arc-en-ciel), remonte vers le média et bascule en 360°.
  const handlePepiteClick = () => {
    setPepiteClicked(true);
    try {
      sessionStorage.setItem(`showroom_pepite_clicked_${product.slug}`, "1");
    } catch {
      /* ignore */
    }
    mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    media360Ref.current?.show360();
  };

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

  // === Barre sticky bas : apparaît quand le bloc CTA (quantité + ajout au panier) sort du viewport ===
  const ctaRef = useRef<HTMLDivElement>(null);
  const joinGroupRef = useRef<HTMLDivElement>(null);
  const [bottomBarVisible, setBottomBarVisible] = useState(false);

  useEffect(() => {
    const el = groupageSelected ? joinGroupRef.current : ctaRef.current;
    if (!el) {
      setBottomBarVisible(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setBottomBarVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [groupageSelected]);

  // Signale qu'une barre sticky (haut ou bas) est visible → masque les éléments flottants.
  useEffect(() => {
    setHasStickyBar(stickyBarVisible || bottomBarVisible);
    return () => setHasStickyBar(false);
  }, [stickyBarVisible, bottomBarVisible, setHasStickyBar]);

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

  const remises = useRemisesStore((s) => s.config);
  const priceRef = { id: product.id, family: product.showcase?.family, category: product.showcase?.category };
  const selectedVariant = product.variants?.find((v) => v.sku === selectedSku) || null;
  const currentPrice = selectedVariant?.price ?? null;
  const currentBreakdown = currentPrice != null ? computePrice(currentPrice, priceRef, remises) : null;
  const discountedBase = currentBreakdown?.final ?? currentPrice;

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
  const toggleGroupageOption = (param: ProductParameter, optionId: string) => {
    setGroupageOptions((prev) => {
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
  // Options groupage : incluses (0 FCFA) + ajoutées (plein tarif, aucune réduction).
  const groupageOptionsList: CartItemOption[] = groupageConfig
    ? parameters.flatMap((param) => {
        const includedIds = groupageConfig.included_option_ids;
        const ids = groupageOptions[param.id] || [];
        return param.options
          .filter((o) => includedIds.includes(o.id) || ids.includes(o.id))
          .map((o) => {
            const isIncluded = includedIds.includes(o.id);
            return {
              param_id: param.id,
              option_id: o.id,
              label: `${param.name} : ${o.label}`,
              price: isIncluded ? 0 : o.price ?? 0,
            };
          });
      })
    : [];
  const groupageAdditionalTotal = groupageOptionsList.reduce((s, o) => s + o.price, 0);
  const groupageTotal = groupPrice != null ? groupPrice + groupageAdditionalTotal : null;
  // Options incluses gratuitement dans l'offre groupage (libellé + prix catalogue, pour le récap sous les images).
  const includedOptions: { id: string; label: string; price: number | null }[] = groupageConfig
    ? parameters.flatMap((param) =>
        param.options
          .filter((o) => groupageConfig.included_option_ids.includes(o.id))
          .map((o) => ({ id: o.id, label: o.label, price: o.price ?? null }))
      )
    : [];
  // Valeur catalogue totale des options incluses gratuitement (prix barré + économie affichée).
  const includedOptionsValue = includedOptions.reduce((sum, o) => sum + (o.price ?? 0), 0);

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
  const totalPrice = discountedBase != null ? discountedBase + optionsTotal : null;
  // Prix de la ligne = prix unitaire (variante + options) × quantité
  const lineTotal = totalPrice != null ? totalPrice * quantity : null;
  // Libellé prix pour la barre produit sticky (unitaire, options incluses)
  const priceLabel =
    groupageSelected && groupPrice != null
      ? formatPrice(groupageTotal ?? groupPrice)
      : currentPrice != null
        ? formatPrice(totalPrice ?? currentPrice)
        : "Sur devis";

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

  // === Vue 360° : interrupteur global maître + activation produit + frames configurées ===
  const images360 = product.showcase?.images_360 || [];
  const threeSixtyEffective = !!threeSixtyGlobalEnabled && !!product.showcase?.three_sixty_enabled;
  const has360 = threeSixtyEffective && images360.length > 0;
  // Bouton flottant « Voir le produit en 360° » (barre sticky) : masqué par défaut
  // (contrôle spécifique désactivé), et uniquement si le produit dispose réellement d'une vue 360°.
  const showSticky360Button = show360Btn && has360 && !!threeSixtyStickyButtonEnabled;

  // Ajoute la variante + options sélectionnées au panier (sans ouvrir de surface).
  const addCurrentToCart = () => {
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
  };

  // « Ajouter au panier » : ajoute puis ouvre directement le slide de commande.
  const handleAddToCart = () => {
    addCurrentToCart();
    openCheckout();
  };

  // Ajoute une place de groupage au panier (sans ouvrir de surface).
  const addGroupageToCart = () => {
    if (!groupageConfig || groupPrice == null || groupageTotal == null) return;
    addItem({
      key: `${product.id}:GROUPAGE:${groupageOptionsList
        .map((o) => `${o.param_id}.${o.option_id}`)
        .sort()
        .join("|")}`,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_label: "Groupage",
      variant_sku: "GROUPAGE",
      quantity: groupageQuantity,
      unit_price_fcfa: groupageTotal,
      image_url: product.main_image_url,
      options: groupageOptionsList,
      groupage: true,
      groupage_reduction_fcfa: groupageReduction ?? 0,
      groupage_included_fcfa: includedOptionsValue,
      groupage_deposit_fcfa: groupageConfig.deposit_fcfa,
      online_enabled: true,
      cash_on_delivery: false,
    });
  };

  // Rejoindre le groupage : ajoute une place puis ouvre le slide de commande.
  const handleJoinGroupage = () => {
    addGroupageToCart();
    openCheckout();
  };

  // Commande directe selon la sélection courante (classique ou groupage).
  const handleQuickOrder = () => {
    if (groupageSelected) handleJoinGroupage();
    else handleAddToCart();
  };

  // Incrémente le compteur de partage (fire-and-forget).
  const handleGroupageShared = async () => {
    try {
      const r = await fetch("/api/groupage/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      const d = await r.json();
      if (d?.shares_count != null) setShareCount(d.shares_count);
    } catch {
      /* ignore */
    }
  };

  // Jauge groupage (statut live ou repli sur la config + base d'affichage).
  const gMax = groupageStatus?.max_places ?? groupageConfig?.max_places ?? 60;
  const gPlacesTaken = groupageStatus?.places_taken ?? (groupageConfig?.base_places ?? 0);
  const gRemaining =
    groupageStatus?.remaining ?? Math.max(0, gMax - (groupageConfig?.base_places ?? 0));
  // Compteur de partages affiché = base (artificielle) + partages réels.
  const displayShares = (groupageConfig?.base_shares ?? 0) + shareCount;
  // Jours restants avant complétion automatique (délai max).
  const gMaxDelayDays = groupageStatus?.days_remaining ?? groupageConfig?.max_duration_days ?? GROUPAGE_MAX_DURATION_DAYS;

  // Bouton CTA principal (ajout au panier / devis WhatsApp), réutilisé en bloc (plein) et en sticky bas (compact).
  const renderPrimaryCta = (compact: boolean) => {
    if (groupageSelected) {
      return (
        <Button
          variant="success"
          size={compact ? "md" : "lg"}
          className={cn(
            compact
              ? "flex-1 px-4!"
              : "w-full px-4! sm:px-8! shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          )}
          onClick={handleJoinGroupage}
        >
          <span className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-sm">
            <Users className="h-5 w-5 shrink-0" />
            <span className="font-semibold">
              <EditableText contentKey="product.groupage.join" defaultValue="Rejoindre le groupage" />
            </span>
            {groupPrice != null && (
              <>
                <span className="text-[7px] font-bold leading-none" aria-hidden="true">•</span>
                <span className="font-mono font-bold">{formatPrice(groupageTotal ?? groupPrice)}</span>
              </>
            )}
          </span>
        </Button>
      );
    }
    if (variants.length > 0 && currentPrice != null) {
      if (compact) {
        // Barre sticky : « Commander » → ouvre le slide de commande.
        return (
          <Button
            variant="success"
            size="md"
            className="flex-1 px-4!"
            onClick={handleAddToCart}
            disabled={!selectedSku}
          >
            {selectedSku ? (
              <span className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-sm">
                <CartPlusIcon className="h-5 w-5 shrink-0" />
                <span className="font-semibold">
                  <EditableText contentKey="product.cta.buy_now" defaultValue="Commander" />
                </span>
                <span className="text-[7px] font-bold leading-none" aria-hidden="true">•</span>
                <span className="font-mono font-bold">{formatPrice(lineTotal ?? 0)}</span>
              </span>
            ) : (
              <EditableText contentKey="product.cta.select_size" defaultValue="Sélectionnez une taille" />
            )}
          </Button>
        );
      }

      return (
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
              <span className="font-semibold">
                <EditableText contentKey="product.cta.add_to_cart" defaultValue="Ajouter au panier" />
              </span>
              <span className="text-[7px] font-bold leading-none" aria-hidden="true">•</span>
              <span className="font-mono font-bold">{formatPrice(lineTotal ?? 0)}</span>
            </span>
          ) : (
            <EditableText contentKey="product.cta.select_size" defaultValue="Sélectionnez une taille" />
          )}
        </Button>
      );
    }
    return (
      <a
        href={getWhatsAppUrl(whatsapp, showWhatsAppMsg)}
        target="_blank"
        rel="noopener noreferrer"
        className={compact ? "flex-1" : undefined}
      >
        <Button variant="whatsapp" size={compact ? "md" : "lg"} className="w-full">
          {variants.length > 0
            ? selectedSku
              ? <EditableText contentKey="product.cta.quote_whatsapp" defaultValue="💬 Demander un devis WhatsApp" />
              : <EditableText contentKey="product.cta.select_size" defaultValue="Sélectionnez une taille" />
            : <EditableText contentKey="product.cta.quote_whatsapp" defaultValue="💬 Demander un devis WhatsApp" />}
        </Button>
      </a>
    );
  };

  return (
    <div className="pb-12">
      {/* ===== Produit : média sticky (gauche) + panneau info (droite) ===== */}
      <div className="md:max-w-7xl md:mx-auto md:px-4 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-12 md:items-start">
          {/* Bloc média sticky (pleine largeur, sans marge sur mobile) */}
          <ProductMediaViewer
            ref={media360Ref}
            images={heroImages}
            defaultImage={variantImage ?? product.main_image_url ?? heroImages[0]?.url}
            videoUrl={heroVideo}
            galleryVideos={galleryVideos}
            dimensions={selectedVariant?.attributes?.dimensions ?? variants[0]?.attributes?.dimensions ?? null}
            images360={images360}
            threeSixtyEnabled={threeSixtyEffective}
            lightSwitch={product.showcase?.light_switch}
            productName={product.name}
            slug={product.slug}
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
                {groupageSelected && groupPrice != null ? (
                  <div>
                    <span className="text-xs text-[var(--color-text-tertiary)]">Groupage</span>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                      {formatPrice(groupageTotal ?? groupPrice)}
                    </p>
                    {groupageAdditionalTotal > 0 && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        dont options : +{formatPrice(groupageAdditionalTotal)}
                      </p>
                    )}
                  </div>
                ) : currentPrice != null ? (
                  <div>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {selectedVariant ? selectedVariant.name : (
                        <EditableText contentKey="product.price.from" defaultValue="À partir de" />
                      )}
                    </span>
                    {currentBreakdown?.discounted && (
                      <p className="text-sm text-[var(--color-text-tertiary)] font-mono line-through leading-tight">
                        {formatPrice(currentBreakdown.reference + optionsTotal)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                      {formatPrice(totalPrice ?? currentPrice)}
                    </p>
                    {currentBreakdown?.discounted && (
                      <p className="text-xs font-semibold text-[var(--color-success)] mt-0.5">
                        {currentBreakdown.rule?.type === "percent"
                          ? `−${Math.round(Number(currentBreakdown.rule.value))}%`
                          : `−${formatPrice(currentBreakdown.discountAmount)}`}
                      </p>
                    )}
                    {optionsTotal > 0 && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        dont options : +{formatPrice(optionsTotal)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-[var(--color-text-secondary)]">
                    <EditableText contentKey="product.price.on_quote" defaultValue="Sur devis" />
                  </p>
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
                  titleKey="product.step.format.title"
                  subtitleKey="product.step.format.subtitle"
                />
                <div className="mt-3">
                  <VariantSelector
                    variants={variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price, dimensions: v.attributes?.dimensions }))}
                    selectedSku={selectedSku}
                    remises={remises}
                    product={priceRef}
                    onSelect={(v) => {
                      setGroupageSelected(false);
                      setSelectedSku(v.sku);
                    }}
                    groupage={
                      groupageConfig && groupPrice != null && originalPrice != null
                        ? {
                            selected: groupageSelected,
                            onSelect: () => {
                              setGroupageSelected(true);
                              setSelectedSku(null);
                            },
                            dimensions: clonedVariant?.attributes?.dimensions,
                            price: groupPrice,
                            originalPrice: originalPrice + includedOptionsValue,
                            reductionPercent: groupageConfig.reduction_percent,
                          }
                        : null
                    }
                  />
                  {groupageSelected && includedOptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Inclus :</span>
                      {includedOptions.map((opt) => (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-amber-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)]"
                        >
                          <Check className="h-3 w-3 text-[var(--color-accent-amber)]" />
                          {opt.label}
                          {opt.price != null && opt.price > 0 && (
                            <span className="text-[10px] font-semibold text-[var(--color-success)]">{formatPrice(opt.price)}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {groupageSelected && groupageConfig && groupPrice != null && originalPrice != null && (
                    <div className="mt-3">
                      <GroupageCard
                        productName={product.name}
                        slug={product.slug}
                        originalPrice={originalPrice}
                        groupPrice={groupPrice}
                        reductionPercent={groupageConfig.reduction_percent}
                        reductionFcfa={groupageReduction ?? 0}
                        placesTaken={gPlacesTaken}
                        maxPlaces={gMax}
                        remaining={gRemaining}
                        depositFcfa={groupageConfig.deposit_fcfa}
                        maxDelayDays={gMaxDelayDays}
                        maxDurationDays={groupageConfig.max_duration_days}
                        info={info}
                        parameters={parameters}
                        includedOptionIds={groupageConfig.included_option_ids}
                        hiddenOptionIds={groupageConfig.hidden_option_ids}
                        allowAdditionalOptions={groupageConfig.allow_additional_options}
                        selectedOptions={groupageOptions}
                        onToggleOption={toggleGroupageOption}
                        quantity={groupageQuantity}
                        onQuantityChange={setGroupageQuantity}
                        sharesCount={displayShares}
                        onShared={handleGroupageShared}
                        onJoin={handleJoinGroupage}
                        joinGroupRef={joinGroupRef}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2 — Options (single/multi-sélect avec miniatures + coûts) */}
            {parameters.length > 0 && !groupageSelected && (
              <div className="mt-5">
                <StepHeader
                  step={2}
                  title="Ajoutez des options"
                  subtitle="Personnalisez votre produit"
                  optional
                  titleKey="product.step.options.title"
                  subtitleKey="product.step.options.subtitle"
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
            {!groupageSelected && (
            <div ref={ctaRef} className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-sm">
              <div className="p-4">
                {variants.length > 0 && currentPrice != null ? (
                  <div className="space-y-3">
                    {/* Sélecteur de quantité (bloc arrondi) */}
                    <div className="flex items-center justify-between rounded-full border border-[var(--color-border-strong)] pl-4 pr-1 py-1">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        <EditableText contentKey="product.quantity" defaultValue="Quantité" />
                      </span>
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
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.05 }}
                    >
                      {renderPrimaryCta(false)}
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.05 }}
                  >
                    {renderPrimaryCta(false)}
                  </motion.div>
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
            )}
          </div>
        </div>
      </div>

      {/* ===== Points forts : cartes modernes sur fond crème ===== */}
      {highlights.length > 0 && (
        <section ref={pointsFortsRef} className="bg-[var(--color-cream)] border-y border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="text-center mb-5 md:mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                <EditableText contentKey="product.section.highlights.title" defaultValue="Points forts" />
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                <EditableText contentKey="product.section.highlights.subtitle" defaultValue="Ce qui distingue ce produit — cliquez sur une carte pour en savoir plus." />
              </p>
            </div>
            <HighlightCarousel highlights={highlights} />
          </div>
        </section>
      )}

      {/* ===== Comparer les formats : tableau moderne sur fond crème ===== */}
      {hasVariantsTable && (
        <section className="bg-[var(--color-cream)] border-y border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="text-center mb-5 md:mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                <EditableText contentKey="product.section.specs.title" defaultValue="Comparer les formats" />
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                <EditableText contentKey="product.section.specs.subtitle" defaultValue="Les spécifications selon la taille." />
              </p>
            </div>

            {/* Tableau moderne : sans bordure latérale, déballage au scroll */}
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="overflow-hidden rounded-2xl border-y border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-sm"
            >
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
                    {variants.map((v) => {
                      const bp = v.price != null ? computePrice(v.price, priceRef, remises) : null;
                      return (
                        <tr key={v.id} className="transition-colors hover:bg-[var(--color-bg-secondary)]">
                          <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">{v.name}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{v.attributes?.dimensions || "—"}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{v.attributes?.materials || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                            {bp ? (
                              <div className="flex flex-col items-end gap-0.5">
                                {bp.discounted && (
                                  <span className="text-xs font-mono font-normal text-[var(--color-text-tertiary)] line-through">
                                    {formatPrice(bp.reference)}
                                  </span>
                                )}
                                <span>{formatPrice(bp.final)}</span>
                              </div>
                            ) : (
                              <EditableText contentKey="product.price.on_quote" defaultValue="Sur devis" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== Questions fréquentes ===== */}
      <section className="border-t border-[var(--color-border-default)]">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
          <div className="mb-5 md:mb-6">
            <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-amber)]">
              <EditableText contentKey="product.section.faq.eyebrow" defaultValue="Plus d'infos" />
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mt-1.5">
              <EditableText contentKey="product.section.faq.title" defaultValue="Questions fréquentes" />
            </h2>
          </div>

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
            <Button variant="whatsapp" size="lg" className="w-full">
              <EditableText contentKey="product.cta.advisor" defaultValue="💬 Parler à un conseiller" />
            </Button>
          </a>
        </div>
      </section>

      {/* ===== Produits similaires ===== */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[var(--color-border-default)]">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <div className="mb-6">
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-amber)]">
                <EditableText contentKey="product.section.related.eyebrow" defaultValue="Suggestions" />
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mt-1.5">
                <EditableText contentKey="product.section.related.title" defaultValue="Vous aimerez aussi" />
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {relatedProducts.map((rp, i) => (
                <motion.div
                  key={rp.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, ease: "easeOut", delay: (i % 4) * 0.09 }}
                >
                  <ProductCard product={rp} sizes="(max-width: 767px) 50vw, 25vw" />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/collection">
                <Button variant="secondary" size="sm">
                  <EditableText contentKey="product.related.see_all" defaultValue="Voir tout le catalogue" />
                </Button>
              </Link>
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

      {/* Barre sticky bas : CTA compact (quantité + ajout au panier) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out",
          bottomBarVisible ? "translate-y-0" : "translate-y-full"
        )}
        aria-hidden={!bottomBarVisible}
      >
        <div className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/95 backdrop-blur safe-bottom">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
            {groupageSelected && groupPrice != null ? (
              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--color-border-strong)] p-0.5">
                <button
                  type="button"
                  onClick={() => setGroupageQuantity((q) => Math.max(1, q - 1))}
                  disabled={groupageQuantity <= 1}
                  aria-label="Diminuer la quantité"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-semibold text-[var(--color-text-primary)]">{groupageQuantity}</span>
                <button
                  type="button"
                  onClick={() => setGroupageQuantity((q) => q + 1)}
                  aria-label="Augmenter la quantité"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : variants.length > 0 && currentPrice != null ? (
              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--color-border-strong)] p-0.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuer la quantité"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-semibold text-[var(--color-text-primary)]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Augmenter la quantité"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : null}
            {renderPrimaryCta(true)}
          </div>
        </div>
      </div>

      {/* Bouton flottant « Voir le produit en 360° » (sous la barre sticky, visible dès « Points forts ») */}
      <AnimatePresence>
        {showSticky360Button && (
          <motion.div
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-0 top-14 z-40 px-3 pt-2"
          >
            <button
              type="button"
              onClick={handlePepiteClick}
              className={cn(
                "mx-auto flex w-full max-w-7xl items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                pepiteClicked
                  ? "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]"
                  : "pepite-rainbow"
              )}
            >
              <Rotate3d className="h-4 w-4" />
              <EditableText contentKey="product.cta.360" defaultValue="Voir le produit en 360°" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre produit sticky (remplace la TopNav quand l'image principale est sortie du viewport) */}
      <StickyProductBar
        name={product.name}
        priceLabel={priceLabel}
        image={variantImage ?? product.main_image_url}
        visible={stickyBarVisible}
        onBuyNow={handleQuickOrder}
        buyEnabled={groupageSelected ? groupPrice != null : !!selectedSku}
      />
    </div>
  );
}
