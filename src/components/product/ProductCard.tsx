"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Eye } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { imgProxyUrl } from "@/lib/images";
import { formatFCFA } from "@/lib/utils";
import type { ShowcaseProduct } from "@/lib/products";

interface ProductCardProps {
  product: ShowcaseProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const lowestPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price))
    : null;

  const firstVariant = product.variants?.[0];
  const popularity = product.showcase?.popularity || 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_label: firstVariant.name,
      variant_sku: firstVariant.sku,
      quantity: 1,
      unit_price_fcfa: firstVariant.price,
      image_url: product.main_image_url,
    });
  };

  return (
    <Link
      href={`/collection/${product.slug}`}
      className="group block"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-tertiary)] mb-3">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {popularity >= 80 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]">
              Best-seller
            </span>
          )}
          {popularity < 80 && popularity >= 60 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-accent-amber)] text-white">
              Populaire
            </span>
          )}
          {popularity < 40 && popularity > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-accent-blue)] text-white">
              Nouveau
            </span>
          )}
        </div>

        {/* Image */}
        {!imgError && product.main_image_url ? (
          <>
            {/* Skeleton placeholder */}
            {!imgLoaded && (
              <div className="absolute inset-0 skeleton" />
            )}
            <img
              src={imgProxyUrl(product.main_image_url, 600)}
              srcSet={`${imgProxyUrl(product.main_image_url, 400)} 400w, ${imgProxyUrl(product.main_image_url, 600)} 600w, ${imgProxyUrl(product.main_image_url, 900)} 900w`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

        {/* Hover overlay — quick actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Link
              href={`/collection/${product.slug}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white text-[var(--color-text-primary)] text-xs font-medium shadow-lg hover:bg-[var(--color-bg-primary)] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-3.5 h-3.5" />
              Voir
            </Link>
            {firstVariant && (
              <button
                onClick={handleQuickAdd}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-xs font-medium shadow-lg hover:bg-[#2A2A2A] transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Ajouter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center px-1">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {product.name}
        </h3>
        {lowestPrice !== null ? (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            À partir de{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {formatFCFA(lowestPrice)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Sur devis</p>
        )}
      </div>
    </Link>
  );
}
