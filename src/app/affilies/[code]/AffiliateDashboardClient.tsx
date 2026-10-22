"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Share2, Link2, Wallet, TrendingUp } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { SITE_URL } from "@/lib/whatsapp";
import type { AffiliateStats } from "@/types";

/**
 * Mini-dashboard affilié (accès par code ref, ex. /affilies/SOPHIE).
 * Charge les stats agrégées via GET /api/affiliates/[code].
 */

export function AffiliateDashboardClient({ code }: { code: string }) {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/affiliates/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.affiliate) setStats(d.affiliate);
        else setError(d?.error || "Affilié introuvable.");
      })
      .catch(() => {
        if (active) setError("Impossible de charger vos statistiques.");
      });
    return () => {
      active = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-text-secondary)]">Espace affilié</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{error}</p>
        <Link href="/revendeurs" className="mt-6 inline-block text-sm text-[var(--color-accent-blue)] hover:underline">
          ← Devenir affilié
        </Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-sm text-[var(--color-text-tertiary)]">
        Chargement…
      </div>
    );
  }

  const refLink = `${SITE_URL}/?ref=${stats.ref_code}`;
  const promoNote = stats.promo_code ? `Code promo ${stats.promo_code} (−${stats.promo_discount_percent}%)` : "Sans code promo";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  const shareWhatsApp = () => {
    const text = `Découvrez Imprimelle — enseignes & mobilier lumineux sur mesure. ${promoNote} 👉 ${refLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-amber)] font-semibold">Espace affilié</p>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mt-2">
        Bonjour {stats.name} 👋
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Votre commission actuelle : <strong className="text-[var(--color-accent-amber)]">{stats.commission_rate}%</strong>
      </p>

      {/* Cartes de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <TrendingUp className="w-4 h-4 text-[var(--color-accent-amber)] mb-2" />
          <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">{stats.order_count}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Ventes</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <Wallet className="w-4 h-4 text-[var(--color-accent-amber)] mb-2" />
          <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">{formatFCFA(stats.revenue_fcfa)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">CA généré</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <p className="font-mono text-xl font-bold text-[var(--color-accent-blue)]">{formatFCFA(stats.earned_fcfa)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Acquises</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <p className="font-mono text-xl font-bold text-[var(--color-success)]">{formatFCFA(stats.paid_fcfa)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Versées</p>
        </div>
      </div>

      {/* Lien de partage */}
      <div className="mt-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-[var(--color-accent-amber)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Votre lien d&apos;affiliation</h2>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] px-3 py-2.5 text-sm font-mono text-[var(--color-text-primary)]">
            {refLink}
          </code>
          <button
            onClick={copy}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <button
          onClick={shareWhatsApp}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb457]"
        >
          <Share2 className="w-4 h-4" /> Partager sur WhatsApp
        </button>
        {stats.promo_code && (
          <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
            💡 Partagez aussi votre code promo <strong>{stats.promo_code}</strong> (−{stats.promo_discount_percent}%)
            : chaque commande qui l&apos;utilise vous est attribuée.
          </p>
        )}
      </div>
    </div>
  );
}
