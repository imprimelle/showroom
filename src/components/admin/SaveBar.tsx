"use client";
import Link from "next/link";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SaveBarProps {
  saving: boolean;
  dirty: boolean;
  message: string;
  onSave: () => void;
  cancelHref: string;
  /** Libellé d'état affiché à droite (ex. « Publié » / « Brouillon »). */
  rightLabel?: string;
}

/**
 * Barre d'enregistrement sticky (bas de page) partagée par les formulaires admin.
 * Affiche l'état « modifications non enregistrées » et le message de sauvegarde.
 */
export function SaveBar({ saving, dirty, message, onSave, cancelHref, rightLabel }: SaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-30 border-t border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        <Button onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Link href={cancelHref}>
          <Button variant="ghost">Annuler</Button>
        </Link>
        {message && <span className="text-sm text-[var(--color-success)]">{message}</span>}
        {!message && dirty && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
            Modifications non enregistrées
          </span>
        )}
        {rightLabel && (
          <span className="ml-auto text-xs font-medium text-[var(--color-text-tertiary)]">{rightLabel}</span>
        )}
      </div>
    </div>
  );
}
