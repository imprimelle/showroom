"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "whatsapp" | "success" | "danger" | "text";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:bg-[#111827]",
  secondary: "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-tertiary)]",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1EA952]",
  success: "bg-[var(--color-success)] text-white hover:bg-[#15803D]",
  danger: "bg-[var(--color-error)] text-white hover:bg-[#B91C1C]",
  text: "bg-transparent text-[var(--color-accent-blue)] hover:underline p-0 min-h-0",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-4 text-sm",
  md: "min-h-[44px] px-6 text-base",
  lg: "min-h-[52px] px-8 text-lg",
  xl: "min-h-[60px] px-10 text-xl",
  icon: "w-[44px] h-[44px] p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-full",
          "transition-all duration-150 ease-out",
          "active:scale-[0.97] touch-manipulation select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
