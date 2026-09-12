"use client";
import { useState } from "react";
import { Phone, CircleDot, PhoneCall, CheckCircle2, Cog, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const steps = [
  { key: "new", label: "Reçue", icon: CircleDot },
  { key: "contacted", label: "Contactée", icon: PhoneCall },
  { key: "confirmed", label: "Confirmée", icon: CheckCircle2 },
  { key: "in_progress", label: "En cours", icon: Cog },
  { key: "delivered", label: "Livrée", icon: Truck },
];

export default function SuiviPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Commande introuvable");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIdx = order ? steps.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">Suivi de commande</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Entrez votre numéro de téléphone pour suivre votre commande.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input name="phone" placeholder="+225 01 23 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? "..." : "Rechercher"}
        </Button>
      </form>

      {error && <div className="p-3 rounded-xl bg-[var(--color-error-soft)] text-[var(--color-error)] text-sm mb-4">{error}</div>}

      {order && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
            <p className="text-sm text-[var(--color-text-secondary)]">Commande</p>
            <p className="font-mono font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">Total : <span className="font-bold text-[var(--color-text-primary)]">{order.total_amount.toLocaleString()} FCFA</span></p>
          </div>

          <div className="relative">
            {steps.map((step, i) => {
              const isCompleted = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3 mb-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isCompleted ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={cn("font-medium", isCompleted ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)]")}>
                      {step.label}
                    </p>
                    {isCurrent && <p className="text-xs text-[var(--color-text-secondary)]">Étape en cours</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
