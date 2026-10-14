import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BarChart3,
  Eye,
  Users,
  MousePointerClick,
  FileText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
] as const;

type EventRow = {
  event: string;
  path: string | null;
  session_id: string;
  product_slug: string | null;
  created_at: string;
};

async function getAnalytics(days: number) {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const { data } = await admin
    .from("showroom_events")
    .select("event, path, session_id, product_slug, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(20000);

  const rows = (data || []) as EventRow[];

  const pageViews = rows.filter((r) => r.event === "page_view");
  const sessions = new Set(rows.map((r) => r.session_id)).size;
  const totalEvents = rows.length;
  const pagesPerSession = sessions > 0 ? pageViews.length / sessions : 0;

  // Top pages
  const pageCount = new Map<string, number>();
  for (const p of pageViews) {
    const path = p.path || "/";
    pageCount.set(path, (pageCount.get(path) || 0) + 1);
  }
  const topPages = [...pageCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top produits (view_item)
  const productCount = new Map<string, number>();
  for (const r of rows) {
    if (r.event === "view_item" && r.product_slug) {
      productCount.set(r.product_slug, (productCount.get(r.product_slug) || 0) + 1);
    }
  }
  const topProducts = [...productCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, count]) => ({ slug, count }));

  // Répartition par événement
  const eventCount = new Map<string, number>();
  for (const r of rows) eventCount.set(r.event, (eventCount.get(r.event) || 0) + 1);
  const eventsBreakdown = [...eventCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([event, count]) => ({ event, count }));

  // Funnel (sessions uniques par étape)
  const unique = (ev: string) => new Set(rows.filter((r) => r.event === ev).map((r) => r.session_id)).size;
  const funnel = [
    { step: "Vue produit", event: "view_item", count: unique("view_item") },
    { step: "Ajout panier", event: "add_to_cart", count: unique("add_to_cart") },
    { step: "Checkout", event: "begin_checkout", count: unique("begin_checkout") },
    { step: "Commande", event: "purchase", count: unique("purchase") },
  ];

  // Série temporelle (pages vues / jour)
  const byDay = new Map<string, number>();
  for (const p of pageViews) {
    const date = (p.created_at || "").slice(0, 10);
    byDay.set(date, (byDay.get(date) || 0) + 1);
  }
  const series: { date: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    series.push({
      date,
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      count: byDay.get(date) || 0,
    });
  }

  return { sessions, totalEvents, pageViews: pageViews.length, pagesPerSession, topPages, topProducts, eventsBreakdown, funnel, series };
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = PERIODS.some((p) => p.days === Number(daysParam)) ? Number(daysParam) : 30;
  const stats = await getAnalytics(days);

  const maxSeries = Math.max(1, ...stats.series.map((d) => d.count));
  const maxPage = Math.max(1, ...stats.topPages.map((p) => p.count));
  const maxProduct = Math.max(1, ...stats.topProducts.map((p) => p.count));
  const funnelBase = Math.max(1, stats.funnel[0]?.count || 1);

  const kpis = [
    { label: "Visites", value: fmt(stats.sessions), icon: Users },
    { label: "Pages vues", value: fmt(stats.pageViews), icon: Eye },
    { label: "Événements", value: fmt(stats.totalEvents), icon: MousePointerClick },
    { label: "Pages / visite", value: stats.pagesPerSession.toFixed(1), icon: TrendingUp },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[var(--color-accent-amber)]" /> Analytics
        </h1>
        <div className="flex gap-1 bg-[var(--color-bg-tertiary)] rounded-lg p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/admin/analytics?days=${p.days}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === p.days
                  ? "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {stats.totalEvents === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-10 text-center">
          <BarChart3 className="w-10 h-10 text-[var(--color-text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">Aucune donnée pour le moment</p>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1 max-w-md mx-auto">
            Les événements apparaîtront ici dès que des visiteurs auront accepté les cookies
            « analytics » et navigué sur le site.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {kpis.map((k) => (
              <div key={k.label} className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">{k.label}</span>
                  <k.icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1 font-mono">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Série temporelle */}
          <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4 mb-6">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Pages vues par jour
            </h2>
            <div className="flex items-end gap-[3px] h-28">
              {stats.series.map((d) => (
                <div key={d.date} title={`${d.label} — ${d.count}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-opacity hover:opacity-70"
                    style={{
                      height: `${Math.max(3, Math.round((d.count / maxSeries) * 96))}px`,
                      backgroundColor: d.count > 0 ? "var(--color-accent-amber)" : "var(--color-bg-tertiary)",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mt-1">
              <span>{stats.series[0]?.label}</span>
              <span>{stats.series[stats.series.length - 1]?.label}</span>
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4 mb-6">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Parcours de conversion
            </h2>
            <div className="space-y-2">
              {stats.funnel.map((f, i) => {
                const pct = Math.round((f.count / funnelBase) * 100);
                const prev = i > 0 ? stats.funnel[i - 1].count : f.count;
                const dropPct = prev > 0 ? Math.round(((prev - f.count) / prev) * 100) : 0;
                return (
                  <div key={f.event}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-text-secondary)]">{f.step}</span>
                      <span className="font-mono text-[var(--color-text-primary)]">
                        {fmt(f.count)}
                        {i > 0 && dropPct > 0 && (
                          <span className="text-[var(--color-text-tertiary)] ml-2 text-xs">−{dropPct}%</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: i === 3 ? "var(--color-success)" : "var(--color-accent-blue)",
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
            <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Pages les plus visitées
              </h2>
              {stats.topPages.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Aucune page vue enregistrée.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topPages.map((p) => (
                    <li key={p.path} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--color-text-primary)] truncate font-mono text-xs">{p.path}</span>
                        <span className="text-[var(--color-text-secondary)] font-mono shrink-0">{fmt(p.count)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] mt-1 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-accent-blue)]" style={{ width: `${Math.round((p.count / maxPage) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top produits */}
            <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Produits les plus consultés
              </h2>
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Aucune vue produit enregistrée.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topProducts.map((p) => (
                    <li key={p.slug} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/collection/${p.slug}`} className="text-[var(--color-text-primary)] truncate hover:underline font-mono text-xs">
                          {p.slug}
                        </Link>
                        <span className="text-[var(--color-text-secondary)] font-mono shrink-0">{fmt(p.count)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] mt-1 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-accent-amber)]" style={{ width: `${Math.round((p.count / maxProduct) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Événements */}
          <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-4 mt-6">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Répartition des événements</h2>
            <div className="flex flex-wrap gap-2">
              {stats.eventsBreakdown.map((e) => (
                <span key={e.event} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-primary)]">
                  <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{e.event}</span>
                  <span className="font-mono font-bold">{fmt(e.count)}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
