import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <FileQuestion className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">Page introuvable</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <div className="flex flex-col gap-3">
          <Link href="/"><Button variant="primary" size="lg" className="w-full">Retour à l&apos;accueil</Button></Link>
          <Link href="/collection"><Button variant="secondary" size="lg" className="w-full">Voir le catalogue</Button></Link>
        </div>
      </div>
    </div>
  );
}
