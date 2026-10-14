"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsentStore } from "@/stores/consent";
import { setFirstPartyAnalyticsEnabled, sendEvent } from "@/lib/first-party";

/**
 * Traqueur first-party : active/désactive le collecteur selon le consentement
 * « analytics », et émet un événement `page_view` à chaque navigation.
 * Monté une seule fois dans le layout racine.
 */
export function FirstPartyTracker() {
  const pathname = usePathname();
  const analytics = useConsentStore((s) => s.analytics);

  // Active/désactive le collecteur (respect RGPD).
  useEffect(() => {
    setFirstPartyAnalyticsEnabled(analytics);
  }, [analytics]);

  // Page view à chaque changement de route.
  useEffect(() => {
    if (!analytics) return;
    sendEvent("page_view", { title: document.title });
  }, [pathname, analytics]);

  return null;
}
