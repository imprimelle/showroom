"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Link2, TrendingUp, Wallet, MousePointerClick } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { SITE_URL } from "@/lib/whatsapp";

export default function AffiliationPage() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/member/affiliation")
      .then((r) => r.json())
      .then((d) => (d?.affiliate ? setData(d.affiliate) : setError(d?.error || "Aucune affiliation")))
      .catch(() => setError("Impossible de charger vos statistiques."));
  }, []);

  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Mon affiliation</h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Aucune candidature d&apos;affiliation liée à ce compte.</p>
        <Link href="/revendeurs" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent-blue)] hover:underline">
          Devenir affilié →
        </Link>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-[var(--color-text-tertiary)]">Chargement…</p>;

  const refLink = `${SITE_URL}/?ref=${data.ref_code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Mon affiliation</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {data.name} · commission <strong className="text-[var(--color-accent-amber)]">{data.commission_rate}%</strong>
        {data.status !== "active" && <span className="text-[var(--color-accent-amber)]"> · statut : {data.status}</span>}
      </p>

      {/* Lien d'affiliation explicite */}
      <div className="mt-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-[var(--color-accent-amber)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Votre lien d&apos;affiliation</h2>
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
          Partagez ce lien : toute commande passée après un clic vous est attribuée (commission {data.commission_rate}%).
        </p>
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
        {data.promo_code && (
          <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
            💡 Code promo <strong>{data.promo_code}</strong> (−{data.promo_discount_percent}%) : chaque commande qui l&apos;utilise vous est aussi attribuée.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <TrendingUp className="w-4 h-4 text-[var(--color-accent-amber)] mb-2" />
          <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">{data.order_count}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Ventes</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <MousePointerClick className="w-4 h-4 text-[var(--color-accent-amber)] mb-2" />
          <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">{data.clicks ?? 0}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Clics</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <Wallet className="w-4 h-4 text-[var(--color-accent-blue)] mb-2" />
          <p className="font-mono text-xl font-bold text-[var(--color-accent-blue)]">{formatFCFA(data.earned_fcfa)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Acquises</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <Wallet className="w-4 h-4 text-[var(--color-success)] mb-2" />
          <p className="font-mono text-xl font-bold text-[var(--color-success)]">{formatFCFA(data.paid_fcfa)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Versées</p>
        </div>
      </div>
    </div>
  );
}
