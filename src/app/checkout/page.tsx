"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, CreditCard } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatFCFA } from "@/lib/utils";
import { createOrderSchema } from "@/schemas/order";

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const router = useRouter();
  const total = getTotal();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-[var(--color-text-secondary)]">Panier vide</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 mb-6">Ajoutez des articles avant de commander</p>
        <Link href="/collection"><Button variant="primary">Voir le catalogue</Button></Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    if (!acceptedCGV) {
      setGlobalError("Veuillez accepter les conditions générales de vente.");
      return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      customer: {
        name: String(formData.get("name") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || ""),
        city: String(formData.get("city") || ""),
        address: String(formData.get("address") || ""),
      },
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        variant_label: item.variant_label,
        variant_sku: item.variant_sku,
        quantity: item.quantity,
        unit_price_fcfa: item.unit_price_fcfa,
        subtotal_fcfa: item.unit_price_fcfa * item.quantity,
      })),
      total_amount: total,
      notes: String(formData.get("notes") || ""),
    };

    const result = createOrderSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (path.startsWith("customer.")) {
          fieldErrors[path.replace("customer.", "")] = err.message;
        } else {
          fieldErrors[path] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Une erreur est survenue.");
        return;
      }

      clearCart();
      router.push(`/confirmation?order=${data.order_id}`);
    } catch {
      setGlobalError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-8">
      <Link href="/panier" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour au panier
      </Link>

      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">Finaliser la commande</h1>

      {/* Order Summary */}
      <div className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Récapitulatif</h2>
        {items.map((item) => (
          <div key={`${item.product_id}-${item.variant_sku}`} className="flex justify-between text-sm py-1">
            <span className="text-[var(--color-text-secondary)] truncate mr-2">
              {item.product_name} — {item.variant_label} {item.quantity > 1 && `×${item.quantity}`}
            </span>
            <span className="font-mono text-[var(--color-text-primary)] shrink-0">{formatFCFA(item.unit_price_fcfa * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-1 border-t border-[var(--color-border-default)] mt-2 pt-2">
          <span className="text-[var(--color-success)]">Livraison</span>
          <span className="text-[var(--color-success)] font-medium">Gratuite</span>
        </div>
        <div className="flex justify-between text-lg font-bold mt-2">
          <span>Total</span>
          <span className="font-mono">{formatFCFA(total)}</span>
        </div>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {globalError && (
          <div className="p-3 rounded-xl bg-[var(--color-error-soft)] text-[var(--color-error)] text-sm">{globalError}</div>
        )}

        <Input label="Nom complet" name="name" required placeholder="Votre nom et prénom" error={errors.name} />
        <Input label="Téléphone" name="phone" required placeholder="+225 01 23 45 67" error={errors.phone} type="tel" />
        <Input label="Ville / Quartier" name="city" required placeholder="Abidjan, Cocody" error={errors.city} />
        <Input label="Adresse de livraison" name="address" required placeholder="Rue, immeuble, point de repère" error={errors.address} />
        <Input label="Email (optionnel)" name="email" type="email" placeholder="Pour recevoir le suivi" error={errors.email} />
        <Input label="Notes (optionnel)" name="notes" placeholder="Précisions sur votre commande" />

        {/* Payment info */}
        <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--color-accent-amber)]" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Paiement à la livraison</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 ml-7">Espèces ou mobile money (Orange Money, Wave)</p>
        </div>

        {/* CGV */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={acceptedCGV} onChange={(e) => setAcceptedCGV(e.target.checked)} className="mt-1" />
          <span className="text-xs text-[var(--color-text-secondary)]">
            J&apos;accepte les{" "}
            <Link href="/legal/cgv" target="_blank" className="text-[var(--color-accent-blue)] underline">conditions générales de vente</Link>{" "}
            et confirme que mes informations sont exactes.
          </span>
        </label>

        <Button variant="primary" size="lg" className="w-full" type="submit" disabled={loading}>
          {loading ? "Envoi en cours..." : "✓ Confirmer la commande"}
        </Button>

        <p className="text-xs text-center text-[var(--color-text-tertiary)]">
          En confirmant, vous acceptez nos CGV. Nous vous contacterons sous 24h.
        </p>
      </form>
    </div>
  );
}
