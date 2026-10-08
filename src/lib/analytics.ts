/**
 * Tracking d'événements analytics côté client.
 * Envoie chaque événement aux outils chargés (Umami, PostHog, Meta Pixel).
 * No-op silencieux si un outil n'est pas chargé (consentement refusé ou non configuré).
 */

// Mapping des événements internes vers les noms standards Meta Pixel.
const META_EVENTS: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
};

type WindowWithAnalytics = Window & {
  umami?: { track?: (event: string, data?: unknown) => void };
  posthog?: { capture?: (event: string, data?: unknown) => void };
  fbq?: (...args: unknown[]) => void;
};

export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as WindowWithAnalytics;

  if (w.umami && typeof w.umami.track === "function") {
    try {
      w.umami.track(event, data);
    } catch {
      /* ignore */
    }
  }

  if (w.posthog && typeof w.posthog.capture === "function") {
    try {
      w.posthog.capture(event, data);
    } catch {
      /* ignore */
    }
  }

  if (typeof w.fbq === "function") {
    try {
      w.fbq("track", META_EVENTS[event] ?? event, data);
    } catch {
      /* ignore */
    }
  }
}
