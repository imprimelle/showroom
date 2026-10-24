"use client";

import { useEffect } from "react";

/**
 * Protection anti-téléchargement des médias (dissuasion côté client).
 *
 * Bloque, sur les pages publiques uniquement (les écrans `/admin` restent
 * inchangés pour ne pas gêner les outils d'édition / le réordonnancement par
 * glisser-déposer) :
 *  - le clic-droit (menu « Enregistrer l'image sous… ») sur les `<img>`/`<video>` ;
 *  - le glisser-déposer natif de l'image vers le bureau/explorateur.
 *
 * ⚠️ Dissuasion seulement : un visiteur déterminé peut toujours récupérer le
 * média via les DevTools / l'onglet Réseau. Pour une vraie protection il faut
 * des URLs signées (jeton de lecture) ou un filigrane — cf. note de conception.
 */
export function MediaProtection() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAdmin = () => window.location.pathname.startsWith("/admin");

    const blockContextMenu = (e: MouseEvent) => {
      if (isAdmin()) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("img, video, picture, source")) {
        e.preventDefault();
      }
    };

    const blockDragStart = (e: DragEvent) => {
      if (isAdmin()) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("img, video")) {
        e.preventDefault();
      }
    };

    // Phase de capture : s'exécute avant les éventuels handlers des composants.
    document.addEventListener("contextmenu", blockContextMenu, true);
    document.addEventListener("dragstart", blockDragStart, true);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu, true);
      document.removeEventListener("dragstart", blockDragStart, true);
    };
  }, []);

  return null;
}
