/**
 * Analytics first-party (hébergé) — collecte d'événements côté client.
 * Envoie chaque événement à `POST /api/events` (table `showroom_events`).
 * Désactivé par défaut : activé uniquement après consentement « analytics »
 * (via `setFirstPartyAnalyticsEnabled`, piloté par FirstPartyTracker).
 *
 * No-op silencieux si désactivé, hors navigateur, ou si l'envoi échoue.
 */

const EVENTS_ENDPOINT = "/api/events";

let enabled = false;

function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

let sessionId: string | null = null;

/** Identifiant de session persisté (localStorage) — un par navigateur. */
export function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("showroom-session-id");
      if (stored) {
        sessionId = stored;
        return stored;
      }
    } catch {
      /* ignore */
    }
    sessionId = generateId();
    try {
      window.localStorage.setItem("showroom-session-id", sessionId);
    } catch {
      /* ignore */
    }
    return sessionId;
  }
  return "ssr";
}

/** Active/désactive le tracking first-party (consentement « analytics »). */
export function setFirstPartyAnalyticsEnabled(value: boolean): void {
  enabled = value;
}

export function isFirstPartyAnalyticsEnabled(): boolean {
  return enabled;
}

/** Envoie un événement (fire-and-forget). `data` → colonne jsonb. */
export function sendEvent(event: string, data?: Record<string, unknown>): void {
  if (!enabled || typeof window === "undefined") return;
  try {
    const payload: Record<string, unknown> = {
      session_id: getSessionId(),
      event,
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      data: data ?? null,
    };

    const slug = data && (data.product_slug ?? data.slug);
    if (typeof slug === "string" && slug) payload.product_slug = slug;

    fetch(EVENTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}
