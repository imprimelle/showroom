import Link from "next/link";
import { Eye } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { AdminNav } from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-default)] p-4">
        <Link href="/admin" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-8 px-2">
          Imprim<span className="text-[var(--color-accent-amber)]">elle</span>
          <span className="text-xs text-[var(--color-text-tertiary)] block font-normal">Admin</span>
        </Link>

        <AdminNav variant="sidebar" />

        <div className="space-y-1 pt-4 border-t border-[var(--color-border-default)]">
          <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <Eye className="w-5 h-5" /> Voir le site
          </a>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between gap-2 px-4 h-14 border-b border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
          <Link href="/admin" className="font-display font-bold text-[var(--color-text-primary)] shrink-0">
            Imprim<span className="text-[var(--color-accent-amber)]">elle</span>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            <AdminNav variant="mobile" />
            <LogoutButton />
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
