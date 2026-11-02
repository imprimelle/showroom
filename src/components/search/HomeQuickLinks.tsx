"use client";

import Link from "next/link";
import { imgProxyUrl } from "@/lib/images";
import type { ResolvedQuickLink } from "@/lib/home-search";

/**
 * Slider horizontal de liens rapides (sous-catégories + pages) sous la barre de
 * recherche de l'accueil. Pas de défilement auto : l'utilisateur glisse/défile
 * manuellement et sélectionne. Chaque bouton = miniature + nom en gras (2 lignes max).
 */
export function HomeQuickLinks({ links }: { links: ResolvedQuickLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 snap-x snap-proximity">
      {links.map((l) => (
        <Link key={l.key} href={l.href} className="shrink-0 snap-start">
          <span className="inline-flex items-center gap-2.5 h-11 rounded-full bg-[var(--color-bg-tertiary)] pl-1.5 pr-4 hover:bg-[var(--color-border-default)] transition-colors">
            {/* Miniature (image produit / page) ou icône de repli */}
            <span className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] shrink-0 flex items-center justify-center text-base">
              {l.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgProxyUrl(l.image, 64, 64)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span aria-hidden="true">{l.icon || "📄"}</span>
              )}
            </span>
            {/* Nom en gras, 2 lignes max */}
            <span className="text-sm font-bold text-[var(--color-text-primary)] leading-tight line-clamp-2 max-w-[9rem] text-left">
              {l.name}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
