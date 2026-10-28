"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Link2, Store, ArrowRight, UserPlus } from "lucide-react";

interface MeData {
  member: { name: string | null; phone: string | null; email: string | null; oauth_provider: string | null };
  affiliate: { status: string } | null;
  store: { status: string } | null;
  orders_count: number;
}

export default function ComptePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((d) => (d?.member ? setData(d) : setError(d?.error || "Erreur")))
      .catch(() => setError("Impossible de charger votre espace."));
  }, []);

  if (error) return <p className="text-sm text-[var(--color-error)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--color-text-tertiary)]">Chargement…</p>;

  const { member, affiliate, store, orders_count } = data;
  const displayName = member.name || member.email || (member.phone ? "Client" : "Membre");

  const cards = [
    {
      href: "/compte/commandes",
      icon: Package,
      title: "Mes commandes",
      desc: `${orders_count} commande${orders_count !== 1 ? "s" : ""} · suivi et historique`,
      show: true,
    },
    {
      href: "/compte/affiliation",
      icon: Link2,
      title: "Mon affiliation",
      desc: affiliate
        ? `Statut : ${affiliate.status === "active" ? "actif" : affiliate.status}`
        : "Devenir affilié et partager votre lien",
      show: true,
    },
    {
      href: "/compte/boutique",
      icon: Store,
      title: "Mon point de vente",
      desc: store
        ? `Statut : ${store.status === "active" ? "actif" : store.status}`
        : "Devenir point de vente agréé",
      show: true,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
        Bonjour {displayName} 👋
      </h1>
      {!member.phone && (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Connecté via {member.oauth_provider === "google" ? "Google" : member.oauth_provider === "facebook" ? "Facebook" : "votre compte"}.
          Ajoutez votre téléphone pour retrouver vos commandes passées sur le site.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 hover:shadow-md transition-shadow"
            >
              <Icon className="w-6 h-6 text-[var(--color-accent-amber)] mb-3" />
              <h2 className="font-semibold text-[var(--color-text-primary)]">{c.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{c.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent-blue)]">
                Ouvrir <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          );
        })}
      </div>

      {!member.phone && (
        <Link
          href="/compte/connexion?linkPhone=1"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
        >
          <UserPlus className="w-4 h-4" /> Associer mon numéro de téléphone
        </Link>
      )}
    </div>
  );
}
