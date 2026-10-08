"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/Button";
import { imgProxyUrl } from "@/lib/images";
import { useFormatPrice } from "@/stores/currency";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const formatPrice = useFormatPrice();
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const router = useRouter();
  const total = getTotal();

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-[var(--color-surface-elevated)]/95 backdrop-blur-xl rounded-t-2xl flex flex-col overflow-hidden md:left-auto md:w-[420px] md:rounded-none md:rounded-l-2xl md:bottom-0 md:top-0 md:max-h-full"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-9 h-1 rounded-full bg-[var(--color-border-strong)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
              <h2 className="text-lg font-semibold font-display text-[var(--color-text-primary)] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Panier
                {items.length > 0 && (
                  <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                    ({items.length})
                  </span>
                )}
              </h2>
              <button onClick={onClose} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingCart className="w-16 h-16 text-[var(--color-text-tertiary)] mb-4" />
                  <p className="text-xl font-semibold text-[var(--color-text-secondary)]">Votre panier est vide</p>
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-1">Découvrez nos produits</p>
                  <Button variant="primary" size="sm" className="mt-6" onClick={onClose}>
                    Voir le catalogue
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.key} className="flex gap-3 p-2 rounded-xl">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0">
                      {item.image_url ? (
                        <img src={imgProxyUrl(item.image_url, 80, 107)} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.product_name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{item.variant_label}</p>
                      {item.options && item.options.length > 0 && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">
                          {item.options.map((o) => o.label).join(" · ")}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold font-mono text-[var(--color-text-primary)]">
                          {formatPrice(item.unit_price_fcfa * item.quantity)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-border-default)] px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                  <span>Sous-total</span>
                  <span className="font-mono">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-success)]">Livraison</span>
                  <span className="text-[var(--color-success)] font-medium">Gratuite</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border-default)]">
                  <span>Total</span>
                  <span className="font-mono">{formatPrice(total)}</span>
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={handleCheckout}>
                  Commander
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
