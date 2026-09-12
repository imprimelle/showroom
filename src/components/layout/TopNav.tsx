"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
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

export function TopNav({ whatsapp = DEFAULT_WHATSAPP }: { whatsapp?: string }) {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* === Top Bar === */}
      <header className="sticky top-0 z-40 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-default)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Burger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 text-[var(--color-text-primary)]"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 font-display font-bold text-lg text-[var(--color-text-primary)] tracking-tight">
            Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          </Link>

          {/* Cart */}
          <Link
            href="/panier"
            className="relative p-2 -mr-2 text-[var(--color-text-primary)]"
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 w-[18px] h-[18px] flex items-center justify-center bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-bold rounded-full">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* === Slide-out Menu Overlay === */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* === Slide-out Menu Drawer === */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-72 bg-[var(--color-surface-card)] shadow-xl transform transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border-default)]">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="font-display font-bold text-lg text-[var(--color-text-primary)]"
          >
            Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-[var(--color-text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        {/* Divider */}
        <div className="mx-4 border-t border-[var(--color-border-default)] my-3" />

        {/* Contact */}
        <div className="px-4 space-y-2">
          <a
            href={getWhatsAppUrl(whatsapp, "Bonjour, je suis intéressé par vos enseignes")}
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

        {/* Legal */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
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
    </>
  );
}
