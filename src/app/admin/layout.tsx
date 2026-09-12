import Link from "next/link";
import { LayoutDashboard, Package, ClipboardList, Settings, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "./LogoutButton";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/admin/reglages", label: "Réglages", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-default)] p-4">
        <Link href="/admin" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-8 px-2">
          Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          <span className="text-xs text-[var(--color-text-tertiary)] block font-normal">Admin</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 pt-4 border-t border-[var(--color-border-default)]">
          <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <Eye className="w-5 h-5" /> Voir le site
          </a>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
          <Link href="/admin" className="font-display font-bold text-[var(--color-text-primary)]">
            Imprimelle<span className="text-[var(--color-accent-amber)]">CI</span>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
            <LogoutButton />
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
