"use client";
import { useConsentStore } from "@/stores/consent";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export function CookieConsent() {
  const { hasInteracted, acceptAll, rejectAll, setConsent } = useConsentStore();

  if (hasInteracted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface-card)] border-t border-[var(--color-border-default)] p-4 shadow-2xl safe-bottom">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez les accepter tous ou choisir vos préférences.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={rejectAll}>
            Essentiels uniquement
          </Button>
          <Button variant="primary" size="sm" onClick={acceptAll}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
