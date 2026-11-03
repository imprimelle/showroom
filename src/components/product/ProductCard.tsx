"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Heart } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { flyToCart } from "@/stores/fly-to-cart";
import { useRemisesStore } from "@/stores/remises";
import { computePrice } from "@/lib/remises";
import { imgProxyUrl } from "@/lib/images";
import { getMinPrice, cn } from "@/lib/utils";
import { useFormatPrice } from "@/stores/currency";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductCardProps {
  product: ShowcaseProduct;
  /** Attribut `sizes` responsive — précis selon la grille (2/3/4 colonnes). */
  sizes?: string;
  /** Anime la miniature « vers le panier » lors de l'ajout rapide (désactivé sur la fiche produit). */
  animateAddToCart?: boolean;
}

/** Grille catalogue : 2 col (mobile) → 3 col (md) → 4 col (lg). */
const DEFAULT_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";

export function ProductCard({ product, sizes = DEFAULT_SIZES, animateAddToCart = true }: ProductCardProps) {
  const formatPrice = useFormatPrice();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const remises = useRemisesStore((s) => s.config);
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = wishlistItems.some((i) => i.id === product.id);

  const lowestPrice = getMinPrice(product.variants);
  const priceRef = { id: product.id, family: product.showcase?.family, category: product.showcase?.category };
  const lowestBreakdown = lowestPrice != null ? computePrice(lowestPrice, priceRef, remises) : null;

  const firstVariant = product.variants?.[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || firstVariant.price == null) return;
    const quickBreakdown = computePrice(firstVariant.price, priceRef, remises);
    addItem({
      key: `${product.id}:${firstVariant.sku}`,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_label: firstVariant.name,
      variant_sku: firstVariant.sku,
      quantity: 1,
      unit_price_fcfa: quickBreakdown.final,
      image_url: product.main_image_url,
      options: [],
      online_enabled: !!product.showcase?.payment?.online_enabled,
      cash_on_delivery: !!product.showcase?.payment?.cash_on_delivery,
    });
    // Miniature qui vole vers le panier (liste uniquement — désactivé sur la fiche produit).
    if (animateAddToCart && product.main_image_url) {
      flyToCart(imgProxyUrl(product.main_image_url, 120, 160), e.currentTarget);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image_url: product.main_image_url,
      family: product.showcase?.family,
      category: product.showcase?.category,
      variant_label: firstVariant?.name ?? null,
      variant_sku: firstVariant?.sku ?? null,
      variant_price: firstVariant?.price ?? null,
      online_enabled: !!product.showcase?.payment?.online_enabled,
      cash_on_delivery: !!product.showcase?.payment?.cash_on_delivery,
      added_at: new Date().toISOString(),
    });
  };

  return (
    <Link
      href={`/collection/${product.slug}`}
      className="group block rounded-2xl overflow-hidden bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-tertiary)]">
        {/* Image */}
        {!imgError && product.main_image_url ? (
          <>
            {/* Skeleton placeholder */}
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={imgProxyUrl(product.main_image_url, 600, 800)}
              srcSet={`${imgProxyUrl(product.main_image_url, 400, 533)} 400w, ${imgProxyUrl(product.main_image_url, 600, 800)} 600w, ${imgProxyUrl(product.main_image_url, 900, 1200)} 900w`}
              sizes={sizes}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-tertiary)] gap-2">
            <span className="text-3xl">✨</span>
            <span className="text-xs">Photo à venir</span>
          </div>
        )}

        {/* Quick-add (persistant, ergonomique mobile) */}
        {firstVariant && firstVariant.price != null && (
          <button
            onClick={handleQuickAdd}
            aria-label="Ajouter au panier"
            className="absolute bottom-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white text-[var(--color-text-primary)] shadow-md flex items-center justify-center hover:bg-[var(--color-text-primary)] hover:text-white active:scale-95 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Wishlist (cœur) — en haut à droite, sans fond */}
        <button
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
          className="absolute top-2 right-2 z-10 p-1 text-white drop-shadow-md transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              "h-5 w-5",
              inWishlist && "fill-[var(--color-error)] text-[var(--color-error)]"
            )}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          {lowestPrice !== null ? (
            <>
              {lowestBreakdown?.discounted && (
                <span className="text-xs font-mono text-[var(--color-text-tertiary)] line-through">
                  {formatPrice(lowestBreakdown.reference)}
                </span>
              )}
              <span className="text-[15px] font-bold leading-none text-[var(--color-success)]">
                {formatPrice(lowestBreakdown?.final ?? lowestPrice)}
              </span>
            </>
          ) : (
            <span className="text-[15px] font-semibold leading-none text-[var(--color-text-primary)]">
              Sur devis
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
