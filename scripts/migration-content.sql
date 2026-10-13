-- ============================================================
-- Contenus édités inline (textes rigides) — migration showroom
-- Table clé→valeur des surcharges de textes des pages.
-- Lecture anonyme (SSR), écriture via service role (API admin).
-- ============================================================

create table if not exists public.showcase_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists idx_showcase_content_updated on public.showcase_content(updated_at);

-- Lecture publique (nécessaire au rendu SSR des surcharges pour tous les visiteurs).
alter table public.showcase_content enable row level security;

drop policy if exists "showcase_content_anon_read" on public.showcase_content;
create policy "showcase_content_anon_read"
  on public.showcase_content
  for select
  using (true);
