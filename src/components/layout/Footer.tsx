import Link from "next/link";
import { METIERS } from "@/lib/metiers";
import type { ShowcaseSettings } from "@/types";

// Icônes de marque en SVG inline (lucide-react n'exporte plus Facebook/Instagram/TikTok).
const SOCIAL_PATHS: Record<string, string> = {
  facebook:
    "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z",
  instagram:
    "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.41.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.41.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.41-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z",
  tiktok:
    "M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
};

export function Footer({
  social,
  contact,
}: {
  social?: ShowcaseSettings["social"];
  contact?: ShowcaseSettings["contact"];
}) {
  const socialLinks: { href: string; path: string; label: string }[] = [
    { href: social?.facebook, path: SOCIAL_PATHS.facebook, label: "Facebook" },
    { href: social?.instagram, path: SOCIAL_PATHS.instagram, label: "Instagram" },
    { href: social?.tiktok, path: SOCIAL_PATHS.tiktok, label: "TikTok" },
  ].filter((l): l is { href: string; path: string; label: string } => Boolean(l.href));

  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)]">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
            Imprim<span className="text-[var(--color-accent-amber)]">elle</span>
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Fabricant d&apos;enseignes lumineuses et de mobilier lumineux en Côte d&apos;Ivoire.
            Qualité professionnelle, fabrication locale.
          </p>
          {contact?.email && (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-[var(--color-text-primary)] transition-colors"
              >
                {contact.email}
              </a>
            </p>
          )}
          {contact?.address && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{contact.address}</p>
          )}
          {socialLinks.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">Navigation</h4>
          <ul className="space-y-2">
            {[
              { href: "/collection", label: "Catalogue" },
              { href: "/realisations", label: "Réalisations" },
              { href: "/comment-ca-marche", label: "Comment ça marche" },
              { href: "/faq", label: "FAQ" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">Par métier</h4>
          <ul className="space-y-2">
            {METIERS.map((m) => (
              <li key={m.slug}>
                <Link href={`/metier/${m.slug}`} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">Légal</h4>
          <ul className="space-y-2">
            {[
              { href: "/legal/mentions-legales", label: "Mentions légales" },
              { href: "/legal/cgv", label: "CGV" },
              { href: "/legal/confidentialite", label: "Confidentialité" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6 text-center">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          © {new Date().getFullYear()} Imprimelle CI. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
