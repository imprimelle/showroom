import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BarChart3,
  Eye,
  Users,
  UserCheck,
  MousePointerClick,
  FileText,
  ShoppingCart,
  TrendingUp,
  Share2,
  CalendarDays,
  Globe,
  Target,
  Activity,
  ArrowDownRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Period = "today" | "week" | "month" | "year" | "custom";
type Granularity = "hour" | "day" | "month";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "7 jours" },
  { id: "month", label: "30 jours" },
  { id: "year", label: "12 mois" },
];

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page vue",
  view_item: "Vue produit",
  add_to_cart: "Ajout panier",
  begin_checkout: "Début de checkout",
  add_payment_info: "Info de paiement",
  purchase: "Commande",
  search: "Recherche",
  lead: "Lead",
  contact: "Contact",
};

type SeriesPoint = { key: string; label: string; count: number };

type FunnelItem = { step: string; event: string; count: number };
type TopEntry = { path?: string; slug?: string; host?: string; count: number };
type BreakdownItem = { event: string; count: number };

type AnalyticsResult = {
  total_events: number;
  page_views: number;
  visitors: number;
  visits: number;
  purchase_visits: number;
  bounces: number;
  events_breakdown: BreakdownItem[];
  funnel: FunnelItem[];
  top_pages: TopEntry[];
  top_products: TopEntry[];
  top_referrers: TopEntry[];
  series: Record<string, number>;
};

/** Valide une date `YYYY-MM-DD` et la retourne en Date UTC (minuit). */
function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Calcule la borne de début/fin selon la période ou la plage personnalisée. */
function getRange(period: Period, from?: string, to?: string): { since: Date; until: Date } {
  const now = new Date();

  if (period === "custom") {
    const since = from ? parseDate(from) : null;
    const untilRaw = to ? parseDate(to) : null;
    if (since && untilRaw) {
      const until = new Date(untilRaw);
      until.setUTCHours(23, 59, 59, 999);
      return { since, until };
    }
  }

  const since = new Date();
  if (period === "today") since.setUTCHours(0, 0, 0, 0);
  else if (period === "week") since.setUTCDate(since.getUTCDate() - 7);
  else if (period === "month") since.setUTCDate(since.getUTCDate() - 30);
  else since.setUTCDate(since.getUTCDate() - 365);
  return { since, until: now };
}

/** Granularité de la série temporelle selon la période et l'amplitude. */
function chooseGranularity(period: Period, since: Date, until: Date): Granularity {
  if (period === "today") return "hour";
  if (period === "year") return "month";
  const days = Math.round((until.getTime() - since.getTime()) / 86_400_000);
  if (days <= 1) return "hour";
  if (days <= 45) return "day";
  return "month";
}

/** Génère les buckets (heure/jour/mois) couvrant [since, until]. */
function generateBuckets(granularity: Granularity, since: Date, until: Date): Omit<SeriesPoint, "count">[] {
  if (granularity === "hour") {
    const day = since.toISOString().slice(0, 10);
    return Array.from({ length: 24 }, (_, h) => ({
      key: `${day} ${String(h).padStart(2, "0")}`,
      label: `${h}h`,
    }));
  }

  if (granularity === "month") {
    const out: { key: string; label: string }[] = [];
    const t = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), 1));
    const end = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), 1));
    while (t <= end && out.length < 60) {
      out.push({ key: t.toISOString().slice(0, 7), label: MONTHS_SHORT[t.getUTCMonth()] });
      t.setUTCMonth(t.getUTCMonth() + 1);
    }
    return out;
  }

  // day
  const out: { key: string; label: string }[] = [];
  const t = new Date(since);
  t.setUTCHours(0, 0, 0, 0);
  const end = new Date(until);
  end.setUTCHours(0, 0, 0, 0);
  while (t <= end && out.length < 366) {
    out.push({
      key: t.toISOString().slice(0, 10),
      label: `${String(t.getUTCDate()).padStart(2, "0")}/${String(t.getUTCMonth() + 1).padStart(2, "0")}`,
    });
    t.setUTCDate(t.getUTCDate() + 1);
  }
  return out;
}

/** Classe un hostname de référent vers une source lisible. */
function classifySource(host: string): { label: string; icon: string } {
  if (host.includes("facebook") || host === "fb.com") return { label: "Facebook", icon: "facebook" };
  if (host.includes("google")) return { label: "Google", icon: "google" };
  if (host.includes("tiktok")) return { label: "TikTok", icon: "tiktok" };
  if (host.includes("instagram")) return { label: "Instagram", icon: "instagram" };
  if (host.includes("whatsapp")) return { label: "WhatsApp", icon: "whatsapp" };
  if (host.includes("imprimelle.com") || host.includes("showroom.srv") || host.includes("hstgr")) return { label: "Interne", icon: "internal" };
  return { label: host, icon: "site" };
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const fmtPct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const fmtDate = (s: string) => {
  const d = parseDate(s);
  return d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : s;
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { period: periodParam, from, to } = await searchParams;

  const customFrom = parseDate(from || "");
  const customTo = parseDate(to || "");
  const isCustom = Boolean(customFrom && customTo);

  const period: Period = isCustom
    ? "custom"
    : PERIODS.some((p) => p.id === periodParam)
      ? (periodParam as Period)
      : "month";

  const { since, until } = getRange(period, from, to);
  const granularity = chooseGranularity(period, since, until);

  // Agrégation exacte côté base (RPC) — pas de limite de lignes.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("showroom_analytics", {
    p_since: since.toISOString(),
    p_until: until.toISOString(),
    p_granularity: granularity,
  });
  if (error) {
    return (
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-10 text-center">
        <p className="text-[var(--color-error)] font-medium">Erreur de lecture des analytics</p>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{error.message}</p>
      </div>
    );
  }

  const stats = (Array.isArray(data) ? (data[0] as AnalyticsResult | undefined) : (data as AnalyticsResult)) ?? {
    total_events: 0,
    page_views: 0,
    visitors: 0,
    visits: 0,
    purchase_visits: 0,
    bounces: 0,
    events_breakdown: [],
    funnel: [],
    top_pages: [],
    top_products: [],
    top_referrers: [],
    series: {},
  };

  const visits = stats.visits;
  const pageViews = stats.page_views;
  const totalEvents = stats.total_events;
  const pagesPerVisit = visits > 0 ? pageViews / visits : 0;
  const conversion = visits > 0 ? (stats.purchase_visits / visits) * 100 : 0;
  const bounceRate = visits > 0 ? (stats.bounces / visits) * 100 : 0;

  // Série temporelle : fusion buckets vides + comptages RPC.
  const seriesMap = stats.series || {};
  const series = generateBuckets(granularity, since, until).map((b) => ({
    ...b,
    count: seriesMap[b.key] ?? 0,
  }));

  // Funnel : Visites (baseline) → Vue produit → Panier → Checkout → Commande.
  const funnelBase = visits > 0 ? visits : 1;
  const funnel = [
    { step: "Visites", event: "visits", count: visits },
    ...(stats.funnel || []).map((f) => ({ step: f.step, event: f.event, count: f.count })),
  ];

  const hasData = totalEvents > 0;
  const seriesUnit =
    granularity === "hour" ? "par heure" : granularity === "month" ? "par mois" : "par jour";

  const kpis = [
    { label: "Visites", value: fmt(visits), sub: "sessions (30 min d'idle)", icon: Users, tone: "amber" },
    { label: "Visiteurs uniques", value: fmt(stats.visitors), sub: "appareils distincts", icon: UserCheck, tone: "blue" },
    { label: "Pages vues", value: fmt(pageViews), sub: "vues de page", icon: Eye, tone: "indigo" },
    { label: "Pages / visite", value: pagesPerVisit.toFixed(1), sub: "profondeur", icon: TrendingUp, tone: "green" },
    { label: "Taux de rebond", value: `${fmtPct(bounceRate)} %`, sub: "visites 1 page", icon: ArrowDownRight, tone: "orange" },
    { label: "Conversion", value: `${fmtPct(conversion)} %`, sub: "visite → commande", icon: Target, tone: "emerald" },
  ];

  const toneStyles: Record<string, string> = {
    amber: "bg-[var(--color-accent-amber-soft)] text-[var(--color-accent-amber)]",
    blue: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
    indigo: "bg-[var(--color-info-soft)] text-[var(--color-accent-blue)]",
    green: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    orange: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    emerald: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--color-accent-amber)]" /> Analytics
          </h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            Audience du showroom · données first-party (consentement « analytics »)
          </p>
        </div>
        {hasData && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            Collecte active
          </span>
        )}
      </div>

      {/* Filtres : période + plage de dates personnalisée */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-[var(--color-bg-tertiary)] rounded-lg p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.id}
              href={`/admin/analytics?period=${p.id}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.id
                  ? "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <form
          method="get"
          action="/admin/analytics"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-3 py-2"
        >
          <CalendarDays className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Personnalisée :</span>
          <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
            Du
            <input
              type="date"
              name="from"
              defaultValue={from || ""}
              required
              className="h-8 px-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
            Au
            <input
              type="date"
              name="to"
              defaultValue={to || ""}
              required
              className="h-8 px-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)]"
            />
          </label>
          <button
            type="submit"
            className="h-8 px-3 rounded-md bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-xs font-medium"
          >
            Appliquer
          </button>
          {isCustom && (
            <Link
              href="/admin/analytics"
              className="h-8 inline-flex items-center px-2 rounded-md text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            >
              Effacer
            </Link>
          )}
        </form>
      </div>

      {isCustom && (
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          Période du <strong className="text-[var(--color-text-primary)]">{fmtDate(from!)}</strong> au{" "}
          <strong className="text-[var(--color-text-primary)]">{fmtDate(to!)}</strong> ·{" "}
          {fmt(totalEvents)} événement{totalEvents !== 1 ? "s" : ""}
        </p>
      )}

      {!hasData ? (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-12 text-center">
          <BarChart3 className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-medium">Aucune donnée pour le moment</p>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1 max-w-md mx-auto">
            Les événements apparaîtront ici dès que des visiteurs auront accepté les cookies
            « analytics » et navigué sur le site.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            {kpis.map((k) => (
              <div key={k.label} className="p-4 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{k.label}</span>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${toneStyles[k.tone]}`}>
                    <k.icon className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono leading-none">{k.value}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Série temporelle */}
          <div className="bg-[var(--color-surface-card)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--color-accent-amber)]" /> Pages vues {seriesUnit}
              </h2>
              <span className="text-xs text-[var(--color-text-tertiary)] font-mono">{fmt(pageViews)} au total</span>
            </div>
            <AreaChart points={series} />
          </div>

          {/* Funnel */}
          <div className="bg-[var(--color-surface-card)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[var(--color-accent-amber)]" /> Parcours de conversion
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-5">Sessions uniques ayant atteint chaque étape.</p>
            <div className="space-y-3">
              {funnel.map((f, i) => {
                const pct = Math.min(100, Math.round((f.count / funnelBase) * 100));
                const prev = i > 0 ? funnel[i - 1].count : f.count;
                const stepConv = i > 0 ? (prev > 0 ? Math.round((f.count / prev) * 100) : 0) : null;
                const isLast = i === funnel.length - 1;
                return (
                  <div key={f.event}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[var(--color-text-secondary)]">{f.step}</span>
                      <span className="font-mono text-[var(--color-text-primary)] flex items-center gap-2">
                        {fmt(f.count)}
                        {stepConv !== null && (
                          <span className="text-[11px] text-[var(--color-text-tertiary)] font-sans">
                            {stepConv}% de l'étape précédente
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isLast
                            ? "var(--color-success)"
                            : "linear-gradient(90deg, var(--color-accent-amber), var(--color-accent-blue))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top pages */}
            <div className="bg-[var(--color-surface-card)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-5">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-accent-blue)]" /> Pages les plus visitées
              </h2>
              {stats.top_pages.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Aucune page vue enregistrée.</p>
              ) : (
                <RankList
                  items={stats.top_pages.map((p) => ({ label: p.path || "/", value: p.count }))}
                  href={(label) => label.startsWith("/") ? label : "/"}
                  max={Math.max(1, ...stats.top_pages.map((p) => p.count))}
                  color="var(--color-accent-blue)"
                />
              )}
            </div>

            {/* Top produits */}
            <div className="bg-[var(--color-surface-card)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-5">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-accent-amber)]" /> Produits les plus consultés
              </h2>
              {stats.top_products.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Aucune vue produit enregistrée.</p>
              ) : (
                <RankList
                  items={stats.top_products.map((p) => ({ label: p.slug || "", value: p.count }))}
                  href={(label) => `/collection/${label}`}
                  max={Math.max(1, ...stats.top_products.map((p) => p.count))}
                  color="var(--color-accent-amber)"
                />
              )}
            </div>

            {/* Sources de trafic */}
            <div className="bg-[var(--color-surface-card)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-5">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[var(--color-success)]" /> Sources de trafic
              </h2>
              {stats.top_referrers.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Aucun référent enregistré.</p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.top_referrers.map((r) => {
                    const src = classifySource(r.host || "");
                    const max = Math.max(1, ...stats.top_referrers.map((x) => x.count));
                    return (
                      <li key={r.host}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-[var(--color-text-primary)] truncate flex items-center gap-2 min-w-0">
                            <Globe className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" />
                            <span className="truncate">{src.label}</span>
                            <span className="text-[var(--color-text-tertiary)] font-mono text-[11px] truncate">{r.host}</span>
                          </span>
                          <span className="text-[var(--color-text-secondary)] font-mono shrink-0">{fmt(r.count)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--color-success)]" style={{ width: `${Math.round((r.count / max) * 100)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Événements */}
            <div className="bg-[var(--color-surface-card)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Répartition des événements
                </h2>
                <span className="text-xs text-[var(--color-text-tertiary)] font-mono">{fmt(totalEvents)} au total</span>
              </div>
              {stats.events_breakdown.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Aucun événement enregistré.</p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.events_breakdown.map((e) => {
                    const max = Math.max(1, ...stats.events_breakdown.map((x) => x.count));
                    return (
                      <li key={e.event}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-[var(--color-text-secondary)]">{EVENT_LABELS[e.event] ?? e.event}</span>
                          <span className="font-mono text-[var(--color-text-primary)]">{fmt(e.count)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--color-accent-blue)]" style={{ width: `${Math.round((e.count / max) * 100)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Liste classée avec barres de progression + liens optionnels. */
function RankList({
  items,
  href,
  max,
  color,
}: {
  items: { label: string; value: number }[];
  href: (label: string) => string;
  max: number;
  color: string;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <Link href={href(it.label)} className="text-[var(--color-text-primary)] truncate hover:underline font-mono text-xs min-w-0">
              {it.label}
            </Link>
            <span className="text-[var(--color-text-secondary)] font-mono shrink-0">{fmt(it.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] mt-1.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.round((it.value / max) * 100)}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Graphique en aires (SVG server-side, tooltip natif via <title>). */
function AreaChart({ points }: { points: SeriesPoint[] }) {
  if (points.length === 0) return null;

  const W = 760;
  const H = 240;
  const PAD_X = 6;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 30;

  const max = Math.max(1, ...points.map((p) => p.count));
  const n = points.length;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => (n === 1 ? PAD_X + innerW / 2 : PAD_X + (i / (n - 1)) * innerW);
  const y = (v: number) => PAD_TOP + innerH - (v / max) * innerH;

  const coords = points.map((p, i) => ({ x: x(i), y: y(p.count), ...p }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const baseline = (PAD_TOP + innerH).toFixed(1);
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${baseline} L${coords[0].x.toFixed(1)},${baseline} Z`;

  const gridlines = [0.25, 0.5, 0.75, 1].map((f) => ({
    gy: (PAD_TOP + innerH - f * innerH).toFixed(1),
    label: Math.round(f * max),
  }));

  const labelIndices =
    n <= 4 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Pages vues dans le temps">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-amber)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-accent-amber)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridlines.map((g, i) => (
        <g key={i}>
          <line x1={PAD_X} y1={g.gy} x2={W - PAD_X} y2={g.gy} stroke="var(--color-border-default)" strokeDasharray="3 4" />
          <text x={W - PAD_X} y={Number(g.gy) - 3} textAnchor="end" fontSize="10" fill="var(--color-text-tertiary)" fontFamily="var(--font-mono)">
            {g.label}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="var(--color-accent-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {coords.map((c, i) => (
        <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={c.count > 0 ? 3 : 0} fill="var(--color-accent-amber)" stroke="var(--color-surface-card)" strokeWidth="1.5">
          <title>{`${c.label} — ${c.count} page${c.count > 1 ? "s" : ""}`}</title>
        </circle>
      ))}

      {labelIndices.map((i) => (
        <text
          key={i}
          x={coords[i].x.toFixed(1)}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          fontSize="10"
          fill="var(--color-text-tertiary)"
          fontFamily="var(--font-mono)"
        >
          {coords[i].label}
        </text>
      ))}
    </svg>
  );
}
