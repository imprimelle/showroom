-- ============================================================
-- Groupage (achat groupé) — migration showroom
-- Table + colonnes commandes + RPC atomique + RLS
-- ============================================================

create table if not exists public.showcase_groupages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  round int not null default 1,
  status text not null default 'open',          -- open | full | closed
  max_places int not null default 60,
  places_taken int not null default 0,
  reduction_fcfa int not null default 0,
  group_price_fcfa int not null default 0,
  deposit_percent int not null default 70,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_groupages_product on public.showcase_groupages(product_id, status);

alter table public.showcase_orders
  add column if not exists groupage_id uuid,
  add column if not exists deposit_fcfa int,
  add column if not exists balance_fcfa int;

create index if not exists idx_orders_groupage on public.showcase_orders(groupage_id);

-- RPC atomique : rejoint le groupage ouvert du produit (crée un nouveau tour si plein).
create or replace function public.join_groupage(
  p_product_id uuid,
  p_reduction_fcfa int,
  p_group_price_fcfa int,
  p_max_places int,
  p_deposit_percent int
) returns public.showcase_groupages
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.showcase_groupages;
begin
  select * into g
  from public.showcase_groupages
  where product_id = p_product_id and status = 'open'
  order by round desc
  limit 1
  for update;

  if g.id is null then
    insert into public.showcase_groupages
      (product_id, round, status, max_places, places_taken, reduction_fcfa, group_price_fcfa, deposit_percent)
    values (p_product_id, 1, 'open', p_max_places, 1, p_reduction_fcfa, p_group_price_fcfa, p_deposit_percent)
    returning * into g;
  elsif g.places_taken >= g.max_places then
    update public.showcase_groupages set status = 'full', closed_at = now() where id = g.id;
    insert into public.showcase_groupages
      (product_id, round, status, max_places, places_taken, reduction_fcfa, group_price_fcfa, deposit_percent)
    values (p_product_id, g.round + 1, 'open', p_max_places, 1, p_reduction_fcfa, p_group_price_fcfa, p_deposit_percent)
    returning * into g;
  else
    update public.showcase_groupages
    set places_taken = places_taken + 1
    where id = g.id
    returning * into g;
  end if;

  return g;
end;
$$;

-- RLS : lecture/écriture via service role uniquement (comme showcase_orders).
alter table public.showcase_groupages enable row level security;
