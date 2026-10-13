"use client";

import { createContext, useContext } from "react";

export type ContentMap = Record<string, string>;

export interface ContentEditState {
  /** Vrai si le visiteur est connecté en admin (cookie `admin_token` valide). */
  isAdmin: boolean;
  /** Mode édition inline actif. */
  editing: boolean;
  /** Surcartes courantes (clé → texte). */
  content: ContentMap;
  setEditing: (editing: boolean) => void;
  /** Valeur surchargée pour une clé, ou undefined si aucun override. */
  getValue: (key: string) => string | undefined;
  /** Sauvegarde une surcarte (optimiste + PUT API). Vide = réinitialisation. */
  save: (key: string, value: string) => Promise<void>;
}

export const ContentEditContext = createContext<ContentEditState | null>(null);

export function useContentEdit(): ContentEditState {
  const ctx = useContext(ContentEditContext);
  if (!ctx) {
    throw new Error("useContentEdit doit être utilisé dans <ContentEditProvider>");
  }
  return ctx;
}
