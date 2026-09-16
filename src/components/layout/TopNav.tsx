"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  ShoppingCart,
  House,
  Search,
  MessageCircle,
  Phone,
  Info,
  HelpCircle,
  FileText,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { cn, getWhatsAppUrl, DEFAULT_WHATSAPP } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";

const links = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/collection", label: "Catalogue", icon: Search },
  { href: "/realisations", label: "Réalisations", icon: Info },
  { href: "/comment-ca-marche", label: "Comment ça marche", icon: HelpCircle },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/suivi", label: "Suivi", icon: FileText },
];

const legalLinks = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/cgv", label: "CGV" },
  { href: "/legal/confidentialite", label: "Confidentialité" },
];

function BurgerSearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Trois traits du burger */}
      <line x1="4" y1="5" x2="20" y2="5" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="19" x2="13.5" y2="19" />
      {/* Loupe incrustée (recherche) */}
      <circle cx="16.5" cy="16.5" r="3.3" />
      <line x1="18.9" y1="18.9" x2="22" y2="22" />
    </svg>
  );
}

export function TopNav({ whatsapp = DEFAULT_WHATSAPP }: { whatsapp?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const isHero = pathname === "/" || pathname.startsWith("/collection/categorie/");
  const [scrolled, setScrolled] = useState(false);

  // Sur les pages avec bannière (home + univers), la barre devient solide après un léger scroll
  useEffect(() => {
    if (!isHero) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHero]);

  // Verrouille le scroll quand le menu plein écran est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    setMenuOpen(false);
    setSearchQ("");
    router.push(q ? `/collection?q=${encodeURIComponent(q)}` : "/collection");
  };

  if (pathname.startsWith("/admin")) return null;

  const transparent = isHero && !scrolled;
  const fg = transparent ? "text-white" : "text-[var(--color-text-primary)]";

  return (
    <>
      {/* === Barre de navigation === */}
      <header
        className={cn(
          "inset-x-0 top-0 z-40 transition-colors duration-300",
          isHero ? "fixed" : "sticky",
          transparent
            ? "bg-gradient-to-b from-black/50 to-transparent"
            : "bg-[var(--color-bg-primary)] border-b border-[var(--color-border-default)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-[72px] flex items-center justify-between">
          {/* Logo — à gauche */}
          <Link
            href="/"
            className={cn("font-display font-bold text-lg tracking-tight", fg)}
          >
            Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          </Link>

          {/* Panier + Burger — à droite (burger à l'extrême droite) */}
          <div className="flex items-center gap-1">
            <Link
              href="/panier"
              aria-label="Panier"
              className={cn("relative p-2", fg)}
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span
                  className={cn(
                    "absolute top-0 right-0 w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full",
                    transparent
                      ? "bg-white text-black"
                      : "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]"
                  )}
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              className={cn("p-2", fg)}
            >
              <BurgerSearchIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* === Menu plein écran (slide-in depuis la droite) === */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full bg-[var(--color-surface-card)] transform transition-transform duration-300 ease-out flex flex-col",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header — barre de recherche produit épurée */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-default)] shrink-0">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full h-12 pl-11 pr-4 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
              />
            </div>
          </form>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] shrink-0"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="px-2 py-3 space-y-0.5">
            {links.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Univers (accès direct aux 2 catégories) */}
          <div className="px-2 pb-2 border-t border-[var(--color-border-default)]">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Nos univers
            </p>
            {CATEGORIES.map((fam) => (
              <Link
                key={fam.id}
                href={`/collection/categorie/${fam.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <span className="text-base">{fam.icon}</span>
                {fam.name}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-[var(--color-border-default)] my-3" />

          {/* Contact */}
          <div className="px-4 space-y-2">
            <a
              href={getWhatsAppUrl(whatsapp, "Bonjour, je suis intéressé par vos produits")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#25D366] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
            <a
              href={`tel:+${whatsapp}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Phone className="w-5 h-5" />
              Appeler
            </a>
          </div>

          {/* Legal (dans le contenu scrollable) */}
          <div className="px-4 py-4">
            <div className="flex gap-4 text-xs text-[var(--color-text-tertiary)]">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — logo à gauche, panier à droite */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] shrink-0">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="font-display font-bold text-lg text-[var(--color-text-primary)]"
          >
            Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          </Link>
          <Link
            href="/panier"
            onClick={() => setMenuOpen(false)}
            aria-label="Panier"
            className="relative p-2 text-[var(--color-text-primary)]"
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
