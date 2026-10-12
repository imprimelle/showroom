"use client";
import { Share2 } from "lucide-react";
import { buildGroupageShareMessage, waShareUrl, groupageProductUrl } from "@/lib/whatsapp";

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

/* ==== Icônes de réseaux sociaux (SVG inline — lucide-react n'expose pas les marques) ==== */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.018 4.358-.75 5.633-2.376.925-1.18 1.498-2.756 1.724-4.731.038-.334.064-.678.077-1.032-1.393.53-2.861.777-4.357.728-2.616-.087-4.673-1.242-5.947-3.337-1.205-1.98-1.518-4.58-1.031-6.865.451-2.115 1.623-3.85 3.385-5.008C8.234 1.254 10.117.69 12.06.71c2.683.03 5.114 1.337 6.564 3.529 1.653 2.5 1.928 5.853 1.435 9.23-.385 2.634-1.313 4.856-2.756 6.604-1.878 2.276-4.585 3.62-8.06 3.923ZM17.758 5.118c-1.01-.02-1.956.349-2.658 1.021-.84.804-1.293 1.943-1.324 3.303.022 1.25.376 2.376 1.05 3.324.744 1.049 1.814 1.615 3.03 1.615.885 0 1.73-.252 2.469-.71.058-.846.04-1.65-.055-2.4-.23-1.84-1.03-3.266-2.328-4.173-.745-.52-1.622-.957-2.184-.98Zm-3.173 5.164c-.056 1.78-.3 3.342-1.96 4.134-1.114.53-2.4.35-3.364-.376-1.24-.936-1.715-2.595-1.692-4.467.023-1.87.52-3.517 1.5-4.68.925-1.096 2.17-1.576 3.605-1.618.031 1.19.245 2.272.638 3.216.569 1.365 1.58 2.168 2.864 2.214.12-.536.17-1.083.17-1.64-.014-1.464-.503-2.62-1.43-3.487-.755-.707-1.775-1.062-3.03-1.056-1.248.006-2.4.517-3.248 1.44-1.12 1.22-1.719 3.114-1.719 5.528.014 2.413.61 4.289 1.785 5.589 1.124 1.243 2.701 1.858 4.676 1.825 1.275-.022 2.436-.335 3.456-.93.984-.575 1.806-1.44 2.442-2.573.037.775-.256 1.456-.78 1.899-.686.58-1.562.826-2.604.733-2.402-.214-3.856-2.02-3.802-4.668.048-2.47.9-4.342 2.653-5.809 1.298-1.086 2.94-1.666 4.687-1.666.024 0 .048 0 .072-.001-.638.53-1.103 1.242-1.36 2.1Z" />
    </svg>
  );
}

/**
 * CTA marketing de partage du groupage : compteur + message incitatif +
 * une ligne de boutons — le premier (« Partager », partage natif) affiche un
 * libellé, les suivants sont les icônes des réseaux (Facebook, Instagram,
 * TikTok, X, Threads).
 */
export function GroupageShareSection({
  productName,
  slug,
  groupPriceFcfa,
  reductionFcfa,
  sharesCount,
  onShared,
}: GroupageShareSectionProps) {
  const url = groupageProductUrl(slug) || "";
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

  /** Partage natif quand dispo, sinon ouvre la plateforme (Instagram/TikTok n'ont pas d'URL de partage web). */
  const shareNativeOrOpen = (platformUrl: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: productName, text, url }).then(() => onShared?.()).catch(() => {});
      return;
    }
    window.open(platformUrl, "_blank", "noopener,noreferrer");
    onShared?.();
  };

  const openShareUrl = (u: string) => {
    window.open(u, "_blank", "noopener,noreferrer");
    onShared?.();
  };

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`;

  const iconBtn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90";

  return (
    <div className="rounded-xl bg-[var(--color-accent-amber)]/10 p-3">
      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
        Invitez vos amis à rejoindre le groupage pour accélérer la livraison
      </p>
      <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
        {sharesCount > 0
          ? `🔥 ${sharesCount} personne${sharesCount > 1 ? "s" : ""} ont déjà partagé`
          : "🔥 Soyez le premier à partager"}
      </p>
      <div className="mt-2.5 flex flex-nowrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-accent-amber)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-amber-hover)]"
        >
          <Share2 className="h-3.5 w-3.5" /> Partager
        </button>
        <button type="button" onClick={() => openShareUrl(facebookUrl)} aria-label="Partager sur Facebook" className={`${iconBtn} bg-[#1877F2]`}>
          <FacebookIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => shareNativeOrOpen("https://www.instagram.com/")} aria-label="Partager sur Instagram" className={`${iconBtn} bg-[#E4405F]`}>
          <InstagramIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => shareNativeOrOpen("https://www.tiktok.com/")} aria-label="Partager sur TikTok" className={`${iconBtn} bg-black`}>
          <TikTokIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => openShareUrl(xUrl)} aria-label="Partager sur X" className={`${iconBtn} bg-black`}>
          <XIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => openShareUrl(threadsUrl)} aria-label="Partager sur Threads" className={`${iconBtn} bg-black`}>
          <ThreadsIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
