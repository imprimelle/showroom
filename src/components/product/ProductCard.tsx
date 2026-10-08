"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Clock, Zap } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { imgProxyUrl } from "@/lib/images";
import { getMinPrice } from "@/lib/utils";
import { useFormatPrice } from "@/stores/currency";
import { getCategoryLabel } from "@/lib/categories";
import { isOnlinePayable, type ShowcaseProduct } from "@/lib/products";

interface ProductCardProps {
  product: ShowcaseProduct;
  /** Attribut `sizes` responsive — précis selon la grille (2/3/4 colonnes). */
  sizes?: string;
}

/** Grille catalogue : 2 col (mobile) → 3 col (md) → 4 col (lg). */
const DEFAULT_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";

export function ProductCard({ product, sizes = DEFAULT_SIZES }: ProductCardProps) {
  const formatPrice = useFormatPrice();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const lowestPrice = getMinPrice(product.variants);

  const firstVariant = product.variants?.[0];
  const popularity = product.showcase?.popularity || 0;
  const categoryLabel = product.showcase?.category
    ? getCategoryLabel(product.showcase.category)
    : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || firstVariant.price == null) return;
    addItem({
      key: `${product.id}:${firstVariant.sku}`,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_label: firstVariant.name,
      variant_sku: firstVariant.sku,
      quantity: 1,
      unit_price_fcfa: firstVariant.price,
      image_url: product.main_image_url,
      options: [],
      online_enabled: !!product.showcase?.payment?.online_enabled,
      cash_on_delivery: !!product.showcase?.payment?.cash_on_delivery,
    });
  };

  return (
    <Link
      href={`/collection/${product.slug}`}
      className="group block rounded-2xl overflow-hidden bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-tertiary)]">
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
          {popularity >= 80 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm">
              Best-seller
            </span>
          )}
          {popularity >= 60 && popularity < 80 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-accent-amber)] text-white shadow-sm">
              Populaire
            </span>
          )}
          {popularity > 0 && popularity < 40 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-accent-blue)] text-white shadow-sm">
              Nouveau
            </span>
          )}
        </div>

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
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}

        {/* Badge Express (discret) — produit payable en ligne */}
        {isOnlinePayable(product) && (
          <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-white/90 text-[var(--color-text-primary)] shadow-sm backdrop-blur-sm">
            <Zap className="w-2.5 h-2.5 text-[var(--color-accent-amber)]" /> Express
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 md:p-4">
        {categoryLabel && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 truncate">
            {categoryLabel}
          </p>
        )}
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          {lowestPrice !== null ? (
            <div>
              <span className="block text-[10px] leading-none text-[var(--color-text-tertiary)] mb-1">
                À partir de
              </span>
              <span className="text-[15px] font-semibold leading-none text-[var(--color-text-primary)]">
                {formatPrice(lowestPrice)}
              </span>
            </div>
          ) : (
            <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              Sur devis
            </span>
          )}
          {product.showcase?.delivery_time && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)] shrink-0">
              <Clock className="w-3 h-3" />
              {product.showcase.delivery_time}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
