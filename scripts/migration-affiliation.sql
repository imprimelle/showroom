-- ============================================================
-- Affiliation & Réseau de revente — v1
-- Table `showcase_resellers` (affiliés + points de vente)
-- + colonnes d'attribution sur `showcase_orders`
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table des revendeurs (affiliés digitaux + points de vente)
-- ------------------------------------------------------------
create table if not exists public.showcase_resellers (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('affiliate', 'store')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'rejected')),

  -- Identité
  name text not null,
  contact_name text,
  email text,
  phone text,

  -- Affiliation (type = affiliate)
  ref_code text unique,
  promo_code text unique,
  promo_discount_percent numeric,
  commission_rate numeric not null default 8,
  level text default 'standard' check (level in ('standard', 'performance', 'vip')),

  -- Point de vente (type = store)
  store_model text check (store_model in ('showroom', 'b2b', 'corner')),
  city text,
  country text,
  address text,
  lat numeric,
  lng numeric,
  website text,
  social text,
  is_published boolean not null default false,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resellers_type on public.showcase_resellers (type);
create index if not exists idx_resellers_status on public.showcase_resellers (status);
create index if not exists idx_resellers_ref_code on public.showcase_resellers (ref_code);
create index if not exists idx_resellers_promo_code on public.showcase_resellers (promo_code);

-- ------------------------------------------------------------
-- 2. Colonnes d'attribution sur showcase_orders
-- ------------------------------------------------------------
alter table public.showcase_orders add column if not exists reseller_id uuid references public.showcase_resellers(id) on delete set null;
alter table public.showcase_orders add column if not exists ref_code text;
alter table public.showcase_orders add column if not exists promo_code text;
alter table public.showcase_orders add column if not exists promo_discount_fcfa integer;
alter table public.showcase_orders add column if not exists commission_rate numeric;
alter table public.showcase_orders add column if not exists commission_fcfa integer;
alter table public.showcase_orders add column if not exists commission_status text;

create index if not exists idx_orders_reseller_id on public.showcase_orders (reseller_id);
create index if not exists idx_orders_commission_status on public.showcase_orders (commission_status);

-- ------------------------------------------------------------
-- 3. Table de tracking des clics affiliés (stats de portée)
-- ------------------------------------------------------------
create table if not exists public.showcase_affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null,
  landing_path text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliate_clicks_ref on public.showcase_affiliate_clicks (ref_code);
create index if not exists idx_affiliate_clicks_created on public.showcase_affiliate_clicks (created_at desc);

-- ------------------------------------------------------------
-- 4. RLS — lecture publique limitée aux points de vente publiés ;
--    écritures service-role uniquement (bypass).
-- ------------------------------------------------------------
alter table public.showcase_resellers enable row level security;
alter table public.showcase_affiliate_clicks enable row level security;

drop policy if exists "resellers_public_stores" on public.showcase_resellers;
create policy "resellers_public_stores" on public.showcase_resellers
  for select
  using (type = 'store' and is_published = true);

-- La table des clics est en écriture service-role (API) et lecture service-role uniquement.
-- Aucune politique anon : ni SELECT ni INSERT côté client.
