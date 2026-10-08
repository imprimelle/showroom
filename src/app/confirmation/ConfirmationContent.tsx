"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart";
import { track } from "@/lib/analytics";

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const status = searchParams.get("status"); // absent (cash) | paid | pending | failed | error
  const pm = searchParams.get("pm");
  const total = searchParams.get("total");
  const clearCart = useCartStore((s) => s.clearCart);

  // Paiement en ligne abouti : tracking d'achat + vidage du panier (conservé jusque-là).
  useEffect(() => {
    if (status === "paid") {
      track("purchase", {
        order_id: orderId || undefined,
        value: total ? Number(total) : undefined,
        currency: "XOF",
        payment_method: pm || undefined,
      });
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let title = "Commande confirmée !";
  let subtitle = "Nous vous contacterons sous 24h au numéro indiqué pour confirmer les détails.";
  let Icon = CheckCircle2;
  let iconClass = "bg-[var(--color-success-soft)] text-[var(--color-success)]";

  if (status === "paid") {
    title = "Paiement confirmé !";
    subtitle = "Merci ! Votre paiement a bien été reçu. Nous vous contacterons sous 24h pour confirmer la livraison.";
  } else if (status === "pending") {
    title = "Paiement en attente";
    subtitle = "Votre paiement n'est pas encore confirmé. Nous vous contacterons dès sa validation.";
    Icon = Clock;
    iconClass = "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]";
  } else if (status === "failed" || status === "error") {
    title = "Paiement non abouti";
    subtitle = "Le paiement n'a pas pu être confirmé. Votre panier a été conservé — vous pouvez réessayer.";
    Icon = Clock;
    iconClass = "bg-[var(--color-error-soft)] text-[var(--color-error)]";
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${iconClass}`}>
          <Icon className="w-10 h-10" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          {title}
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">{subtitle}</p>

        {orderId && (
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Package className="w-4 h-4" />
              <span>N° de commande</span>
            </div>
            <p className="text-lg font-bold font-mono text-[var(--color-text-primary)] mt-1">#{orderId.slice(0, 8).toUpperCase()}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/suivi">
            <Button variant="secondary" size="lg" className="w-full">Suivre ma commande</Button>
          </Link>
          <Link href="/collection">
            <Button variant="primary" size="lg" className="w-full">Continuer mes achats</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
