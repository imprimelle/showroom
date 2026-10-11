"use client";
import { useEffect } from "react";
import { useConsentStore } from "@/stores/consent";
import { track } from "@/lib/analytics";

/**
 * Traque les clics sur les liens WhatsApp (devis, conseiller, FAB, menu…)
 * par délégation d'événements, et les remonte comme événements Meta :
 * - texte contenant « devis »  → `Lead`   (demande de devis, conversion clé)
 * - sinon                      → `Contact` (prise de contact générique)
 *
 * Respecte le consentement « marketing » : aucun tracking tant que l'utilisateur
 * n'a pas accepté. Le clic ouvre un nouvel onglet, le tracking est donc émis de
 * façon synchrone AVANT la navigation (fbq.queue est déjà rempli).
 */
export function WhatsAppClickTracker() {
  const marketing = useConsentStore((s) => s.marketing);

  useEffect(() => {
    if (!marketing) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const link = target?.closest?.('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      if (!link) return;

      const text = (link.textContent || "").trim();
      const label = text || link.getAttribute("aria-label") || "WhatsApp";
      const isQuote = /devis/i.test(label) || /devis/i.test(link.getAttribute("href") || "");

      track(isQuote ? "lead" : "contact", {
        content_name: label.slice(0, 120),
        content_category: "whatsapp",
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [marketing]);

  return null;
}
