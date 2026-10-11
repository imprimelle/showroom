"use client";
import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { buildGroupageShareMessage, waShareUrl, productUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface GroupageShareButtonProps {
  productName: string;
  slug: string;
  groupPriceFcfa?: number | null;
  reductionFcfa?: number;
  /** Version compacte (petits boutons) pour le panier. */
  compact?: boolean;
}

/**
 * Bouton de partage d'un groupage : WhatsApp (message pré-rempli) + copie du lien.
 */
export function GroupageShareButton({
  productName,
  slug,
  groupPriceFcfa,
  reductionFcfa,
  compact = false,
}: GroupageShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = productUrl(slug) || "";

  const handleWhatsApp = () => {
    const msg = buildGroupageShareMessage({
      productName,
      url,
      reductionFcfa,
      groupPriceFcfa,
    });
    window.open(waShareUrl(msg), "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  return (
    <div className={cn("flex items-center gap-2", compact ? "" : "w-full")}>
      <button
        type="button"
        onClick={handleWhatsApp}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-white font-semibold transition-opacity hover:opacity-90",
          compact ? "px-3 py-1.5 text-xs" : "flex-1 px-4 py-2.5 text-sm"
        )}
      >
        <Share2 className="w-4 h-4" />
        Partager
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copier le lien"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] font-semibold transition-colors hover:bg-[var(--color-bg-tertiary)]",
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
        )}
      >
        {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Link2 className="w-4 h-4" />}
        {copied ? "Copié !" : "Lien"}
      </button>
    </div>
  );
}
