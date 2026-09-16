"use client";
import Link from "next/link";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/Button";
import { imgProxyUrl } from "@/lib/images";
import { formatFCFA } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-[var(--color-text-secondary)]">Votre panier est vide</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 mb-6">Découvrez nos produits</p>
        <Link href="/collection">
          <Button variant="primary">Voir le catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <Link href="/collection" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Continuer mes achats
      </Link>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">Mon panier</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.product_id}-${item.variant_sku}`} className="flex gap-3 p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
            <Link href={`/collection/${item.product_slug}`} className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0">
              {item.image_url ? (
                <img src={imgProxyUrl(item.image_url, 120)} alt={item.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/collection/${item.product_slug}`} className="text-sm font-medium text-[var(--color-text-primary)] hover:underline line-clamp-1">
                {item.product_name}
              </Link>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.variant_label}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product_id, item.variant_sku, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.variant_sku, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold font-mono">{formatFCFA(item.unit_price_fcfa * item.quantity)}</p>
                  <button onClick={() => removeItem(item.product_id, item.variant_sku)} className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] space-y-2">
        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <span>Sous-total ({items.reduce((s, i) => s + i.quantity, 0)} article{items.length > 1 ? "s" : ""})</span>
          <span className="font-mono">{formatFCFA(total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-success)]">Livraison</span>
          <span className="text-[var(--color-success)] font-medium">Gratuite</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border-default)]">
          <span>Total</span>
          <span className="font-mono">{formatFCFA(total)}</span>
        </div>
      </div>

      <Link href="/checkout" className="block mt-4">
        <Button variant="primary" size="lg" className="w-full">Commander</Button>
      </Link>
    </div>
  );
}
