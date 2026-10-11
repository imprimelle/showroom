"use client";
import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { buildGroupageShareMessage, waShareUrl, productUrl } from "@/lib/whatsapp";

interface GroupageShareSectionProps {
  productName: string;
  slug: string;
  groupPriceFcfa?: number | null;
  reductionFcfa?: number;
  /** Nombre de partages déjà enregistrés. */
  sharesCount: number;
  /** Appelé après un partage (pour incrémenter le compteur). */
  onShared?: () => void;
}

/**
 * CTA marketing de partage du groupage : compteur + message incitatif +
 * partage natif (panel élargi du téléphone) avec repli Facebook / WhatsApp / copier.
 */
export function GroupageShareSection({
  productName,
  slug,
  groupPriceFcfa,
  reductionFcfa,
  sharesCount,
  onShared,
}: GroupageShareSectionProps) {
  const [copied, setCopied] = useState(false);
  const url = productUrl(slug) || "";
  const text = buildGroupageShareMessage({ productName, url, reductionFcfa, groupPriceFcfa });

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: productName, text, url });
        onShared?.();
      } catch {
        /* partage annulé — ne pas compter */
      }
      return;
    }
    // Repli desktop : WhatsApp.
    window.open(waShareUrl(text), "_blank", "noopener,noreferrer");
    onShared?.();
  };

  const handleFacebook = () => {
    const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(fb, "_blank", "noopener,noreferrer");
    onShared?.();
  };

  const handleWhatsApp = () => {
    window.open(waShareUrl(text), "_blank", "noopener,noreferrer");
    onShared?.();
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
    <div className="rounded-xl bg-[var(--color-accent-amber)]/10 p-3">
      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
        {sharesCount > 0
          ? `🔥 ${sharesCount} personne${sharesCount > 1 ? "s" : ""} ont déjà partagé`
          : "🔥 Soyez le premier à partager"}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
        Partagez pour compléter le groupage et être livré plus vite !
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-amber)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-amber-hover)]"
        >
          <Share2 className="h-3.5 w-3.5" /> Partager
        </button>
        <button
          type="button"
          onClick={handleFacebook}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
