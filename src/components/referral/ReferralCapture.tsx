"use client";

import { useEffect } from "react";

/**
 * Capture le code d'affiliation `?ref=CODE` à l'arrivée sur le site et le
 * mémorise côté visiteur (cookie 1st-party 30 j + localStorage en repli).
 * Le checkout relit ce code pour l'envoyer à POST /api/orders.
 *
 * - Attribution « last-click » : tout clic sur un lien `?ref=` écrase le code
 *   précédent (le dernier référent cliqué gagne).
 * - Le code n'est jamais résolu côté client (anti-falsification) : il n'est
 *   qu'un identifiant opaque transmis au serveur, qui le valide.
 */
export const REF_COOKIE = "showroom_ref";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get("ref") || "").trim().toUpperCase();

    if (!ref) return;

    try {
      // Cookie 1st-party, 30 jours, SameSite=Lax (lecture en navigation classique).
      const days = 30;
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${REF_COOKIE}=${encodeURIComponent(ref)}; path=/; expires=${expires}; SameSite=Lax`;
      // Repli localStorage (si cookies bloqués / contexte particulier).
      window.localStorage.setItem(REF_COOKIE, ref);
    } catch {
      /* stockage indisponible — ignorer */
    }

    // Tracking du clic (statistiques de portée, fire-and-forget, best-effort).
    try {
      fetch("/api/affiliates/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, path: window.location.pathname }),
      }).catch(() => {});
    } catch {
      /* ignorer */
    }
  }, []);

  return null;
}

/** Relit le code d'affiliation courant (cookie → localStorage). */
export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return readCookie(REF_COOKIE) || window.localStorage.getItem(REF_COOKIE) || null;
  } catch {
    return null;
  }
}
