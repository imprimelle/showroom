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
 * En-tête de section réutilisable (page d'accueil + guides).
 * Typographie alignée sur les sections de fiche produit (« Vous aimerez aussi ») :
 * kicker orange en majuscules `tracking-[0.22em]`, titre `font-serif text-3xl md:text-4xl`.
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
          <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-amber)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mt-1.5">
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
