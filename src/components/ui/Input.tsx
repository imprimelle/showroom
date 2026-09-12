"use client";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {label}
            {required && <span className="text-[var(--color-error)] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-12 px-3.5 text-base rounded-xl border bg-[var(--color-surface-card)]",
            "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]",
            "transition-colors duration-150",
            "focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.15)] focus:outline-none",
            error
              ? "border-[var(--color-error)] ring-[3px] ring-[rgba(220,38,38,0.1)]"
              : "border-[var(--color-border-default)]",
            "disabled:opacity-50 disabled:bg-[var(--color-bg-tertiary)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="flex items-center gap-1 mt-1 text-xs text-[var(--color-error)]">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
