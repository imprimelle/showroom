"use client";
import { cn } from "@/lib/utils";

interface StepHeaderProps {
  step: number;
  title: string;
  subtitle?: string;
  /** Affiche une pastille « Facultatif » (ex. options). */
  optional?: boolean;
  className?: string;
}

/**
 * En-tête d'étape de commande : pastille numérotée mise en avant + titre.
 * Utilisé sur la fiche produit pour structurer la personnalisation en étapes (1. Format, 2. Options).
 */
export function StepHeader({ step, title, subtitle, optional, className }: StepHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-amber)] font-display text-sm font-bold text-[var(--color-text-primary)] shadow-sm"
      >
        {step}
      </span>
      <div className="min-w-0 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-bold leading-tight text-[var(--color-text-primary)]">
            {title}
          </h3>
          {optional && (
            <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Facultatif
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug text-[var(--color-text-tertiary)]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
