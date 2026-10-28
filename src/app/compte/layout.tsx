import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export const metadata = {
  title: "Espace membre",
  robots: { index: false, follow: false },
};

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/compte" className="font-display font-bold text-[var(--color-text-primary)]">
            Espace membre
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              Retour à la boutique
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
