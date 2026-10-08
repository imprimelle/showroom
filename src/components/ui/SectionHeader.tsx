import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Petit libellé au-dessus du titre (accent doré, majuscules). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Lien/action affiché à droite (desktop) quand align="left". */
  action?: ReactNode;
  className?: string;
}

/**
 * En-tête de section réutilisable pour la page d'accueil.
 * Apporte une hiérarchie visuelle claire : eyebrow → titre → sous-titre,
 * avec un lien d'action optionnel aligné à droite.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action,
  className,
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "mb-6",
        isCenter ? "text-center" : "flex flex-wrap items-end justify-between gap-3",
        className
      )}
    >
      <div className={cn(isCenter && "mx-auto max-w-2xl")}>
        {eyebrow ? (
          <p
            className={cn(
              "mb-1.5 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-amber)]",
              isCenter && "justify-center"
            )}
          >
            {isCenter && <span aria-hidden className="h-px w-6 bg-current opacity-60" />}
            {eyebrow}
            {isCenter && <span aria-hidden className="h-px w-6 bg-current opacity-60" />}
          </p>
        ) : null}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 text-sm md:text-base text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0 hidden md:block">{action}</div> : null}
    </div>
  );
}
