"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  ShoppingCart,
  House,
  Search,
  MessageCircle,
  Phone,
  Info,
  HelpCircle,
  FileText,
  Sparkles,
  Handshake,
  User,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { cn, getWhatsAppUrl, DEFAULT_WHATSAPP, formatPhoneDisplay } from "@/lib/utils";
import { generalInquiryMessage } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import { CATEGORIES } from "@/lib/categories";
import { SearchSuggest } from "@/components/search/SearchSuggest";
import { EditableText } from "@/components/admin/content/EditableText";

const links = [
  { href: "/", label: "Accueil", icon: House, contentKey: "nav.links.home" },
  { href: "/collection", label: "Catalogue", icon: Search, contentKey: "nav.links.catalogue" },
  { href: "/realisations", label: "Réalisations", icon: Info, contentKey: "nav.links.realisations" },
  { href: "/notre-histoire", label: "Notre histoire", icon: Sparkles, contentKey: "nav.links.histoire" },
  { href: "/comment-ca-marche", label: "Comment ça marche", icon: HelpCircle, contentKey: "nav.links.how" },
  { href: "/faq", label: "FAQ", icon: HelpCircle, contentKey: "nav.links.faq" },
  { href: "/suivi", label: "Suivi", icon: FileText, contentKey: "nav.links.suivi" },
  { href: "/revendeurs", label: "Devenir revendeur", icon: Handshake, contentKey: "nav.links.revendeurs" },
  { href: "/compte", label: "Espace membre", icon: User, contentKey: "nav.links.compte" },
];

const legalLinks = [
  { href: "/legal/mentions-legales", label: "Mentions légales", contentKey: "nav.legal.mentions" },
  { href: "/legal/cgv", label: "CGV", contentKey: "nav.legal.cgv" },
  { href: "/legal/confidentialite", label: "Confidentialité", contentKey: "nav.legal.confidentialite" },
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

export function TopNav({ whatsapp = DEFAULT_WHATSAPP, phone }: { whatsapp?: string; phone?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const isHero = pathname === "/" || pathname.startsWith("/collection/categorie/");
  const [scrolled, setScrolled] = useState(false);
  const hideNav = pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname === "/notre-histoire";

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

  // Signale la présence de la barre de navigation pour positionner la notification
  // de preuve sociale sous la barre du haut (toutes pages).
  useEffect(() => {
    if (hideNav) return;
    document.body.dataset.hasTopnav = "1";
    return () => {
      delete document.body.dataset.hasTopnav;
    };
  }, [hideNav]);

  const closeMenu = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchQ("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) track("search", { search_string: q });
    closeMenu();
    router.push(q ? `/collection?q=${encodeURIComponent(q)}` : "/collection");
  };

  if (hideNav) return null;

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
        {/* === Barre fine orange d'annonce (toujours solide, jamais fondue dans le héro) === */}
        <div className="bg-[var(--color-accent-orange)] text-white">
          <div className="max-w-7xl mx-auto px-4 h-7 md:h-8 flex items-center justify-between text-[11px] md:text-xs">
            <span className="font-semibold">
              <EditableText contentKey="nav.announcement" defaultValue="Fièrement Ivoiriens 🇨🇮" />
            </span>
            {phone && (
              <a
                href={`tel:+${phone}`}
                className="font-semibold tabular-nums tracking-wide hover:underline"
              >
                {formatPhoneDisplay(phone)}
              </a>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 h-16 md:h-[72px] flex items-center justify-between">
          {/* Logo — à gauche */}
          <Link
            href="/"
            className={cn("font-display font-bold text-xl tracking-tight", fg)}
          >
            Imprim<span className="text-[var(--color-accent-amber)]">elle</span>
          </Link>

          {/* Compte + Panier + Burger — à droite (burger à l'extrême droite) */}
          <div className="flex items-center gap-1">
            <Link
              href="/compte"
              aria-label="Mon compte"
              className={cn("relative p-2", fg)}
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/panier"
              aria-label="Panier"
              className={cn("relative p-2", fg)}
            >
              <ShoppingCart className="w-5 h-5" />
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
              <BurgerSearchIcon className="w-5 h-5" />
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
          {searchOpen && (
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQ("");
              }}
              className="p-2 -ml-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] shrink-0"
              aria-label="Retour au menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher un produit..."
                className="w-full h-12 pl-11 pr-4 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
              />
            </div>
          </form>
          <button
            onClick={closeMenu}
            className="p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] shrink-0"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {searchOpen ? (
            <SearchSuggest query={searchQ} variant="drawer" onNavigate={closeMenu} />
          ) : (
            <>
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
                  <EditableText contentKey={link.contentKey} defaultValue={link.label} />
                </Link>
              );
            })}
          </nav>

          {/* Univers (accès direct aux 2 catégories) */}
          <div className="px-2 pb-2 border-t border-[var(--color-border-default)]">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              <EditableText contentKey="nav.universes" defaultValue="Nos univers" />
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
              href={getWhatsAppUrl(whatsapp, generalInquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#25D366] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <EditableText contentKey="nav.whatsapp" defaultValue="WhatsApp" />
            </a>
            <a
              href={`tel:+${whatsapp}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Phone className="w-5 h-5" />
              <EditableText contentKey="nav.call" defaultValue="Appeler" />
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
                  <EditableText contentKey={link.contentKey} defaultValue={link.label} />
                </Link>
              ))}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer — logo à gauche, panier à droite */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] shrink-0">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="font-display font-bold text-lg text-[var(--color-text-primary)]"
          >
            Imprim<span className="text-[var(--color-accent-amber)]">elle</span>
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
