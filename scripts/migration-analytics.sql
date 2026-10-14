-- ============================================================
-- Analytics first-party — table d'événements showroom
-- Ingestion via POST /api/events (service role), lecture admin
-- via service role (bypass RLS). Aucun accès anon (vie privée).
-- ============================================================

create table if not exists public.showroom_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  event text not null,
  path text,
  referrer text,
  product_slug text,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_showroom_events_created on public.showroom_events (created_at desc);
create index if not exists idx_showroom_events_event on public.showroom_events (event);
create index if not exists idx_showroom_events_session on public.showroom_events (session_id);
create index if not exists idx_showroom_events_path on public.showroom_events (path);

alter table public.showroom_events enable row level security;
