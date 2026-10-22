"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { COUNTRIES } from "@/lib/countries";
import type { ResellerType } from "@/types";

/**
 * Formulaire de candidature revendeur (affilié ou point de vente).
 * POST /api/resellers/apply → revendeur `pending` (validation manuelle admin).
 *
 * - Affilié : nom, téléphone, message (pas de « personne à contacter », pas d'email).
 * - Point de vente : nom du commerce, personne à contacter, téléphone,
 *   ville + pays (dropdowns), adresse, modèle, site, social, message.
 */

const STORE_MODELS = [
  { value: "showroom", label: "Showroom Exposeur (dépôt-exposition)" },
  { value: "b2b", label: "Achat-Revente B2B (distributeur)" },
  { value: "corner", label: "Corner / Espace dédié" },
];

/** Principales villes de Côte d'Ivoire (repli si le pays est hors CI, libre). */
const CITIES = [
  "Abidjan",
  "Yamoussoukro",
  "Bouaké",
  "San-Pédro",
  "Daloa",
  "Korhogo",
  "Man",
  "Gagnoa",
  "Divo",
  "Abengourou",
  "Autre",
];

export function ResellerApplyForm({
  initialType = "affiliate",
  onDone,
}: {
  initialType?: ResellerType;
  onDone?: () => void;
}) {
  const [type] = useState<ResellerType>(initialType);
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
      phone: String(fd.get("phone") || ""),
      message: String(fd.get("message") || ""),
    };
    if (type === "store") {
      payload.contact_name = String(fd.get("contact_name") || "");
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
      <div className="text-center py-4">
        <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
          Candidature envoyée ✅
        </h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Merci pour votre intérêt. Notre équipe étudie votre candidature et vous recontacte
          rapidement avec votre lien d&apos;affiliation ou les modalités de partenariat.
        </p>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-4 text-sm font-medium text-[var(--color-accent-blue)] hover:underline"
          >
            Fermer
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
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

        {type === "store" && (
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Personne à contacter</span>
            <input
              name="contact_name"
              maxLength={120}
              className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
            />
          </label>
        )}

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

        {type === "store" && (
          <>
            {/* Ville + pays sur la même ligne (dropdowns) */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Ville</span>
                <select
                  name="city"
                  defaultValue="Abidjan"
                  className="mt-1.5 w-full h-11 px-3 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Pays</span>
                <select
                  name="country"
                  defaultValue="CI"
                  className="mt-1.5 w-full h-11 px-3 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
                >
                  {COUNTRIES.filter((c) => c.code !== "ZZ").map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Adresse</span>
              <input
                name="address"
                maxLength={300}
                placeholder="Quartier, rue, point de repère"
                className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Modèle de partenariat</span>
              <select
                name="store_model"
                className="mt-1.5 w-full h-11 px-3 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none"
              >
                {STORE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>

            {/* Site web + réseau social sur la même ligne */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Site web</span>
                <input name="website" maxLength={200} className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Réseau social</span>
                <input name="social" maxLength={200} placeholder="@votre_compte" className="mt-1.5 w-full h-11 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none" />
              </label>
            </div>
          </>
        )}

        <label className="block">
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

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sending}>
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
