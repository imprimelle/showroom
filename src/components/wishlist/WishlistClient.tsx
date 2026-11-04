"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useWishlistStore, type WishlistItem } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { useRemisesStore } from "@/stores/remises";
import { computePrice } from "@/lib/remises";
import { imgProxyUrl } from "@/lib/images";
import { flyToCart } from "@/stores/fly-to-cart";
import { useFormatPrice } from "@/stores/currency";
import { Button } from "@/components/ui/Button";

export function WishlistClient() {
  const formatPrice = useFormatPrice();
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const remises = useRemisesStore((s) => s.config);

  const handleAddToCart = (item: WishlistItem, e: React.MouseEvent<HTMLButtonElement>) => {
    if (item.variant_price == null || !item.variant_sku) return;
    const bp = computePrice(
      item.variant_price,
      { id: item.id, family: item.family, category: item.category },
      remises
    );
    addItem({
      key: `${item.id}:${item.variant_sku}`,
      product_id: item.id,
      product_name: item.name,
      product_slug: item.slug,
      variant_label: item.variant_label ?? "",
      variant_sku: item.variant_sku,
      quantity: 1,
      unit_price_fcfa: bp.final,
      image_url: item.image_url,
      options: [],
      online_enabled: !!item.online_enabled,
      cash_on_delivery: !!item.cash_on_delivery,
    });
    flyToCart(e.currentTarget);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Ma wishlist
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {items.length} produit{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
          >
            Vider
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🤍</span>
          <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">
            Votre wishlist est vide
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Ajoutez des produits pour les retrouver ici.
          </p>
          <Link href="/collection" className="mt-6">
            <Button variant="primary">Voir le catalogue</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {items.map((item) => {
            const bp =
              item.variant_price != null
                ? computePrice(
                    item.variant_price,
                    { id: item.id, family: item.family, category: item.category },
                    remises
                  )
                : null;
            return (
              <div
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:shadow-lg transition-all duration-300"
              >
                <Link
                  href={`/collection/${item.slug}`}
                  className="relative block aspect-[3/4] overflow-hidden bg-[var(--color-bg-tertiary)]"
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgProxyUrl(item.image_url, 600, 800)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">✨</div>
                  )}
                </Link>
                <div className="p-3.5 flex flex-col flex-1">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {bp ? (
                        <>
                          {bp.discounted && (
                            <s className="mr-1.5 text-[11px] font-mono text-[var(--color-text-tertiary)]">
                              {formatPrice(bp.reference)}
                            </s>
                          )}
                          {formatPrice(bp.final)}
                        </>
                      ) : (
                        "Sur devis"
                      )}
                    </span>
                    <button
                      onClick={() => remove(item.id)}
                      aria-label="Retirer de la wishlist"
                      className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(item, e)}
                    disabled={item.variant_price == null}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-sm font-semibold py-2.5 hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
