"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Formulaire de candidature revendeur (affilié ou point de vente).
 * POST /api/resellers/apply → revendeur `pending` (validation manuelle admin).
 */

const STORE_MODELS = [
  { value: "showroom", label: "Showroom Exposeur (dépôt-exposition)" },
  { value: "b2b", label: "Achat-Revente B2B (distributeur)" },
  { value: "corner", label: "Corner / Espace dédié" },
];

export function ResellerApplyForm() {
  const [type, setType] = useState<"affiliate" | "store">("affiliate");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      type,
      name: String(fd.get("name") || ""),
      contact_name: String(fd.get("contact_name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      message: String(fd.get("message") || ""),
    };
    if (type === "store") {
      payload.city = String(fd.get("city") || "");
      payload.country = String(fd.get("country") || "");
      payload.address = String(fd.get("address") || "");
      payload.store_model = String(fd.get("store_model") || "showroom");
      payload.website = String(fd.get("website") || "");
      payload.social = String(fd.get("social") || "");
    }

    try {
      const res = await fetch("/api/resellers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data?.error || "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-8 text-center">
        <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
          Candidature envoyée ✅
        </h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Merci pour votre intérêt. Notre équipe étudie votre candidature et vous recontacte
          rapidement avec votre lien d&apos;affiliation ou les modalités de partenariat.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-6">
      <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-4">
        Devenir partenaire
      </h3>

      {/* Choix du parcours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setType("affiliate")}
          className={`rounded-xl border p-4 text-left transition-colors ${
            type === "affiliate"
              ? "border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]"
              : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)]"
          }`}
        >
          <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Devenir Affilié</span>
          <span className="block text-xs text-[var(--color-text-secondary)] mt-1">
            Lien unique + code promo, commissions 8–15 % sur les ventes apportées.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setType("store")}
          className={`rounded-xl border p-4 text-left transition-colors ${
            type === "store"
              ? "border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]"
              : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)]"
          }`}
        >
          <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Point de vente agréé</span>
          <span className="block text-xs text-[var(--color-text-secondary)] mt-1">
            Showroom, boutique ou corner : exposez et vendez nos produits.
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {type === "store" ? "Nom du commerce" : "Nom complet"}<span className="text-[var(--color-error)]">*</span>
          </span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Personne à contacter</span>
          <input
            name="contact_name"
            maxLength={120}
            className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Téléphone (WhatsApp)<span className="text-[var(--color-error)]">*</span></span>
          <input
            name="phone"
            required
            type="tel"
            placeholder="+225 01 23 45 67"
            className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Email</span>
          <input
            name="email"
            type="email"
            className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
          />
        </label>

        {type === "store" && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Ville</span>
              <input name="city" maxLength={80} className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Pays</span>
              <input name="country" maxLength={80} className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Adresse</span>
              <input name="address" maxLength={300} className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Modèle de partenariat</span>
              <select
                name="store_model"
                className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
              >
                {STORE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Site web</span>
              <input name="website" maxLength={200} className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Réseau social</span>
              <input name="social" maxLength={200} placeholder="@votre_compte" className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
            </label>
          </>
        )}

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Votre projet / message</span>
          <textarea
            name="message"
            rows={3}
            maxLength={1000}
            placeholder={type === "store" ? "Parlez-nous de votre espace, votre clientèle…" : "Votre audience, vos canaux (réseaux sociaux, blog…)…"}
            className="mt-1.5 w-full px-3.5 py-2.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}

      <Button type="submit" variant="primary" size="lg" className="w-full mt-5" disabled={sending}>
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size={18} /> Envoi en cours…
          </span>
        ) : (
          "Envoyer ma candidature"
        )}
      </Button>
    </form>
  );
}
