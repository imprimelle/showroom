"use client";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      // Lire le corps de façon tolérante (peut être vide sur certaines erreurs proxy)
      let data: { error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(data?.error || `Connexion refusée (${res.status})`);
        return;
      }

      // Redirection plein écran (reload) : garantit que le navigateur envoie
      // le cookie HttpOnly fraîchement posé lors de la requête suivante,
      // contrairement à router.push() qui peut rebondir vers /admin/login.
      window.location.href = "/admin";
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center">
            <Lock className="w-8 h-8 text-[var(--color-accent-amber)]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Admin</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Imprimelle CI</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--color-error-soft)] text-[var(--color-error)] text-sm text-center">{error}</div>
          )}
          <Input
            label="Code PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            required
            autoFocus
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? "Vérification..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
