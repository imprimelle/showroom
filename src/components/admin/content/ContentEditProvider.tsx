"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { ContentEditContext, type ContentMap } from "./ContentEditContext";

/**
 * Fournit le mode édition inline à tout l'arbre :
 * - détecte l'admin via `/api/admin-status` (cookie HttpOnly lu côté serveur) ;
 * - détient la carte de surcartes (initialisée côté serveur, mise à jour en
 *   optimiste lors des sauvegardes) ;
 * - affiche la barre d'édition (bouton flottant + bandeau) uniquement aux admins.
 */
export function ContentEditProvider({
  children,
  initialContent,
}: {
  children: ReactNode;
  initialContent: ContentMap;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState<ContentMap>(initialContent);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIsAdmin(!!d?.isAdmin);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const getValue = useCallback((key: string) => content[key], [content]);

  const save = useCallback(async (key: string, value: string) => {
    // Optimiste : valeur vide = suppression de la surcarte (retour au défaut).
    setContent((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    try {
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    } catch {
      // Échec réseau : on laisse l'état optimiste (rechargement complet pour resync).
    }
  }, []);

  const value = useMemo(
    () => ({ isAdmin, editing, content, setEditing, getValue, save }),
    [isAdmin, editing, content, getValue, save]
  );

  // Pas de barre d'édition sur les pages admin (elles ont déjà leur propre UI).
  const hideToolbar = pathname.startsWith("/admin");

  return (
    <ContentEditContext.Provider value={value}>
      {children}

      {isAdmin && !hideToolbar && (
        <>
          {/* Bandeau d'information en mode édition */}
          {editing && (
            <div className="fixed top-0 inset-x-0 z-[60] bg-[var(--color-accent-blue)] text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
              <Pencil className="w-4 h-4" />
              <span>Mode édition — cliquez sur un texte pour le modifier</span>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Terminer
              </button>
            </div>
          )}

          {/* Bouton flottant d'activation */}
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className={
              "fixed bottom-20 left-4 z-50 md:bottom-6 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition-all " +
              (editing
                ? "bg-[var(--color-accent-blue)] text-white"
                : "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:bg-[#2A2A2A]")
            }
            aria-label={editing ? "Terminer l'édition des textes" : "Modifier les textes"}
          >
            {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {editing ? "Terminer" : "Modifier les textes"}
            </span>
          </button>
        </>
      )}
    </ContentEditContext.Provider>
  );
}
