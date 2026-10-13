"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useContentEdit } from "./ContentEditContext";

interface EditableTextProps {
  /** Clé stable et unique de la surcarte (ex. `home.categories.title`). */
  contentKey: string;
  /** Texte par défaut (celui en dur dans le composant). */
  defaultValue: string;
  /** Élément HTML à rendre (défaut `span`). */
  as?: ElementType;
  className?: string;
  /** Champ multiligne (textarea) au lieu d'un input simple. */
  multiline?: boolean;
  /**
   * Rendu par défaut riche (optionnel) : utilisé quand aucun override n'existe,
   * afin de préserver les éventuels spans/animations du texte original.
   * Quand une surcarte existe, c'est sa valeur (texte simple) qui est rendue.
   */
  children?: ReactNode;
}

/**
 * Texte éditable inline : en mode édition (admin), survol → contour, clic →
 * champ inline, Entrée/blur pour enregistrer, Échap pour annuler.
 * Hors mode édition, se comporte comme un simple élément de texte (SSR intact).
 */
export function EditableText({
  contentKey,
  defaultValue,
  as: Tag = "span",
  className,
  multiline = false,
  children,
}: EditableTextProps) {
  const { editing, getValue, save } = useContentEdit();
  const override = getValue(contentKey);
  const resolved = override ?? defaultValue;

  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState(resolved);

  useEffect(() => {
    if (!drafting) setDraft(resolved);
  }, [resolved, drafting]);

  const startDraft = () => {
    setDraft(resolved);
    setDrafting(true);
  };

  const commit = () => {
    setDrafting(false);
    if (draft !== resolved) void save(contentKey, draft);
  };

  const cancel = () => {
    setDrafting(false);
    setDraft(resolved);
  };

  // Champ d'édition inline (style neutre, ne reprend pas les classes d'affichage).
  if (editing && drafting) {
    const fieldClass =
      "w-full rounded-md border border-[var(--color-accent-blue)] bg-[var(--color-surface-card)] px-2 py-1 text-sm text-[var(--color-text-primary)] outline-none shadow-sm";
    if (multiline) {
      return (
        <textarea
          autoFocus
          className={cn(fieldClass, "resize-y min-h-[48px]")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
            else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
          }}
        />
      );
    }
    return (
      <input
        autoFocus
        className={fieldClass}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          else if (e.key === "Enter") commit();
        }}
      />
    );
  }

  const display = override != null ? override : children ?? defaultValue;

  return (
    <Tag
      className={cn(
        className,
        editing &&
          "editable-target cursor-pointer transition-shadow hover:outline hover:outline-2 hover:outline-dashed hover:outline-offset-2 hover:outline-[var(--color-accent-blue)]"
      )}
      onClick={
        editing
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              startDraft();
            }
          : undefined
      }
      title={editing ? "Cliquer pour modifier" : undefined}
    >
      {display}
    </Tag>
  );
}
