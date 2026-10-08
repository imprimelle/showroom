"use client";
import { useEffect } from "react";
import { useConsentStore } from "@/stores/consent";

type Fbq = ((...args: unknown[]) => void) & { queue: unknown[]; loaded?: boolean };

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

type PostHogStub = {
  q: unknown[];
  init?: (...args: unknown[]) => void;
  capture?: (...args: unknown[]) => void;
  [key: string]: unknown;
};

/**
 * Charge le snippet PostHog (stub + array.js) puis initialise.
 * No-op si déjà chargé. Consentement géré par l'appelant.
 */
function loadPostHog(key: string, host: string) {
  const w = window as unknown as {
    posthog?: PostHogStub;
    __posthogLoaded?: boolean;
  };
  if (w.__posthogLoaded) return;
  w.__posthogLoaded = true;

  const assetsHost = host.replace(".i.posthog.com", "-assets.i.posthog.com");

  // Stub minimal qui met en file les appels avant le chargement d'array.js
  if (!w.posthog) {
    const ph: PostHogStub = { q: [] };
    const methods = [
      "capture",
      "identify",
      "alias",
      "reset",
      "set",
      "set_once",
      "register",
      "register_once",
      "unregister",
      "opt_in_capturing",
      "opt_out_capturing",
      "has_opted_out_capturing",
      "isFeatureEnabled",
      "onFeatureFlags",
      "getFeatureFlag",
      "reloadFeatureFlags",
      "group",
      "onSessionId",
      "init",
    ];
    for (const m of methods) {
      ph[m] = (...args: unknown[]) => {
        ph.q.push([m, ...args]);
      };
    }
    w.posthog = ph;
  }

  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `${assetsHost}/static/array.js`;
  document.head.appendChild(s);

  // La file est relue par array.js ; l'appel init est mis en file immédiatement.
  w.posthog?.init?.(key, { api_host: host });
}

/**
 * Injecte les scripts d'analyse côté client, en respectant le consentement :
 * - Meta Pixel  → consentement « marketing »
 * - Umami       → consentement « analytics »
 * - PostHog     → consentement « analytics »
 */
export function AnalyticsScripts({
  pixelId,
  umamiWebsiteId,
  umamiScriptUrl,
  posthogKey,
  posthogHost,
}: {
  pixelId?: string;
  umamiWebsiteId?: string;
  umamiScriptUrl?: string;
  posthogKey?: string;
  posthogHost?: string;
}) {
  const analytics = useConsentStore((s) => s.analytics);
  const marketing = useConsentStore((s) => s.marketing);

  useEffect(() => {
    // Meta Pixel — marketing
    if (marketing && pixelId && !window.fbq?.loaded) {
      const queue: unknown[] = [];
      const fbq = ((...args: unknown[]) => {
        queue.push(args);
      }) as Fbq;
      fbq.queue = queue;
      fbq.loaded = true;
      window.fbq = fbq;
      fbq("init", pixelId);
      fbq("track", "PageView");

      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }

    // Umami — analytics
    if (analytics && umamiWebsiteId && umamiScriptUrl) {
      const s = document.createElement("script");
      s.async = true;
      s.defer = true;
      s.src = umamiScriptUrl;
      s.setAttribute("data-website-id", umamiWebsiteId);
      document.head.appendChild(s);
    }

    // PostHog — analytics
    if (analytics && posthogKey) {
      loadPostHog(posthogKey, posthogHost || "https://us.i.posthog.com");
    }
  }, [pixelId, umamiWebsiteId, umamiScriptUrl, posthogKey, posthogHost, analytics, marketing]);

  return null;
}
