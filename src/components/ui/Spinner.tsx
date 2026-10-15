"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Diamètre en pixels. */
  size?: number;
  className?: string;
}

/**
 * Spinner moderne : anneau fin avec arc coloré (couleur du texte courant),
 * rotation fluide et continue. À utiliser partout où un chargement attend
 * le client (soumission de commande, etc.).
 */
export function Spinner({ size = 18, className }: SpinnerProps) {
  return (
    <motion.span
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        borderWidth: 2.5,
        borderStyle: "solid",
        borderColor: "rgba(127,127,127,0.28)",
        borderTopColor: "currentColor",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      aria-hidden="true"
    />
  );
}
