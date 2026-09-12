"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[var(--color-success)]" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Commande confirmée !
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Nous vous contacterons sous 24h au numéro indiqué pour confirmer les détails.
        </p>

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
