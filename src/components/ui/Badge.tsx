"use client";
import { cn } from "@/lib/utils";

type BadgeVariant = "category" | "new" | "contacted" | "confirmed" | "in_progress" | "delivered" | "cancelled" | "cart";

const variantStyles: Record<BadgeVariant, string> = {
  category: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  new: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  contacted: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
  confirmed: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
  in_progress: "bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)]",
  delivered: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  cancelled: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
  cart: "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]",
};

const statusLabels: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  confirmed: "Confirmé",
  in_progress: "En cours",
  delivered: "Livré",
  cancelled: "Annulé",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "category", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        variantStyles[variant],
        variant === "cart" && "absolute -top-1 -right-1 w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full animate-bounce-small",
        className
      )}
    >
      {children || statusLabels[variant] || variant}
    </span>
  );
}
