"use client";
import { useConsentStore } from "@/stores/consent";
import { Button } from "@/components/ui/Button";

export function CookieConsent() {
  const { hasInteracted, acceptAll, rejectAll } = useConsentStore();

  if (hasInteracted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-3 py-2 shadow-2xl safe-bottom">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-xs text-[var(--color-text-secondary)]">
          Nous utilisons des cookies pour améliorer votre expérience.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={rejectAll}
            className="shrink-0 text-xs font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            Essentiels uniquement
          </button>
          <Button variant="primary" size="sm" onClick={acceptAll}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
