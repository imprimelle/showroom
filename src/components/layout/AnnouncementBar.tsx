"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { AnnouncementMessage } from "@/types";
import {
  announcementMessageDuration,
  resolveAnnouncementHref,
  tokenizeAnnouncement,
  type AnnouncementSegment,
} from "@/lib/announcements";
import { formatPhoneDisplay } from "@/lib/utils";

/** Lien qui utilise `next/link` en interne et `<a>` en externe. */
function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Rend un message (segments gras / souligné / lien), en ambre. */
function MessageLine({ message }: { message: AnnouncementMessage }) {
  const segments = tokenizeAnnouncement(message.text);
  const base = "text-[var(--color-accent-amber)] text-[11px] md:text-xs font-semibold";
  return (
    <span className={`${base} truncate`}>
      {segments.map((seg, i) => {
        if (seg.type === "bold")
          return (
            <strong key={i} className="font-extrabold">
              {seg.content}
            </strong>
          );
        if (seg.type === "underline")
          return (
            <span key={i} className="underline underline-offset-2">
              {seg.content}
            </span>
          );
        if (seg.type === "link")
          return (
            <SmartLink
              key={i}
              href={resolveAnnouncementHref(seg.href)}
              className="underline underline-offset-2 decoration-[var(--color-accent-amber)]/70 hover:opacity-80"
            >
              {seg.content}
            </SmartLink>
          );
        return <span key={i}>{seg.content}</span>;
      })}
    </span>
  );
}

/**
 * Bandeau d'annonce défilant (vertical) affiché au-dessus de la nav.
 * Un message à la fois, qui « défile vers le bas » (sort par le bas, le suivant
 * entre par le haut), en texte ambre. Durée d'affichage par message configurable.
 */
export function AnnouncementBar({
  enabled,
  periodMs,
  messages,
  phone,
}: {
  enabled: boolean;
  periodMs: number;
  messages: AnnouncementMessage[];
  phone?: string;
}) {
  const [index, setIndex] = useState(0);

  // Avancement automatique : durée propre à chaque message, boucle infinie.
  useEffect(() => {
    if (!enabled || messages.length <= 1) return;
    if (index >= messages.length) {
      setIndex(0);
      return;
    }
    const duration = announcementMessageDuration(messages[index], periodMs);
    const t = setTimeout(() => setIndex((i) => (i + 1) % messages.length), duration);
    return () => clearTimeout(t);
  }, [index, messages, periodMs, enabled]);

  if (!enabled || messages.length === 0) return null;

  const current = messages[Math.min(index, messages.length - 1)];

  return (
    <div className="bg-[var(--color-text-primary)]">
      <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between gap-3">
        {/* Ticker vertical */}
        <div className="relative h-8 flex-1 min-w-0 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center"
            >
              <MessageLine message={current} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Téléphone (statique, à droite) */}
        {phone && (
          <a
            href={`tel:+${phone}`}
            className="shrink-0 text-white/70 hover:text-white font-semibold tabular-nums tracking-wide text-[11px] md:text-xs"
          >
            {formatPhoneDisplay(phone)}
          </a>
        )}
      </div>
    </div>
  );
}
