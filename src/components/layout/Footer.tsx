import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)]">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
            Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Fabricant d&apos;enseignes lumineuses en Côte d&apos;Ivoire.
            Qualité professionnelle, fabrication locale.
          </p>
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
