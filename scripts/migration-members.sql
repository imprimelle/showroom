-- ============================================================
-- Espace membre — v1
-- Identité unifiée clients / affiliés / points de vente
-- + OTP téléphone + liaison membre sur commandes & revendeurs
-- ============================================================

-- ------------------------------------------------------------
-- 1. Identité membre (téléphone normalisé OU email social)
-- ------------------------------------------------------------
create table if not exists public.showroom_members (
  id uuid primary key default gen_random_uuid(),
  phone text unique,             -- normalisé (chiffres uniquement), null pour social-only
  email text unique,             -- identité Google/Facebook (null pour téléphone-only)
  name text,
  avatar_url text,
  oauth_provider text,           -- 'google' | 'facebook' | null (téléphone)
  oauth_id text,                 -- subject du provider OAuth
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
create index if not exists idx_members_phone on public.showroom_members (phone);
create index if not exists idx_members_email on public.showroom_members (email);

-- ------------------------------------------------------------
-- 2. OTP (un code actif par téléphone, consommé après usage)
-- ------------------------------------------------------------
create table if not exists public.showroom_otp (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,       -- sha256(phone:code:MEMBER_JWT_SECRET)
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_phone on public.showroom_otp (phone, created_at desc);

-- ------------------------------------------------------------
-- 3. Liaison membre (commande / revendeur)
-- ------------------------------------------------------------
alter table public.showcase_orders add column if not exists member_id uuid references public.showroom_members(id) on delete set null;
alter table public.showcase_resellers add column if not exists member_id uuid references public.showroom_members(id) on delete set null;
create index if not exists idx_orders_member_id on public.showcase_orders (member_id);
create index if not exists idx_resellers_member_id on public.showcase_resellers (member_id);

-- ------------------------------------------------------------
-- 4. RLS — service-role uniquement (bypass), aucune politique anon.
--    L'espace membre suit le pattern admin (JWT jose + middleware Next.js).
-- ------------------------------------------------------------
alter table public.showroom_members enable row level security;
alter table public.showroom_otp enable row level security;
