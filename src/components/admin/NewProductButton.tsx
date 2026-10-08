"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Bouton « Nouveau produit » : crée une ébauche via POST /api/admin/products,
 * puis redirige (reload plein écran) vers l'éditeur `/admin/produits/[id]`.
 */
export function NewProductButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.id) {
        // Navigation plein écran : garantit l'envoi du cookie admin et le rechargement
        // des données côté serveur (même pattern que le login admin).
        window.location.href = `/admin/produits/${data.id}`;
        return;
      }
      setError(data.error || "Erreur lors de la création du produit");
      setLoading(false);
    } catch {
      setError("Erreur de connexion");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={create} disabled={loading} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        {loading ? "Création…" : "Nouveau produit"}
      </Button>
      {error && <span className="text-xs text-[var(--color-error)]">{error}</span>}
    </div>
  );
}
