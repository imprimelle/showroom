-- ============================================================
-- Analytics showroom — RPC d'agrégation serveur
-- Remplace l'agrégation JS (limit 20000 / PostgREST 1000 lignes)
-- par une agrégation SQL exacte et efficace (1 aller-retour).
-- Sessions « visite » = rafales d'activité avec idle max 30 min
-- par session_id (UUID persistant = appareil/visiteur).
-- ============================================================

drop function if exists public.showroom_analytics(timestamptz, timestamptz, text);

create or replace function public.showroom_analytics(
  p_since timestamptz,
  p_until timestamptz,
  p_granularity text default 'day'
)
returns jsonb
language sql
stable
as $$
with ev as (
  select session_id, event, path, referrer, product_slug, created_at
  from public.showroom_events
  where created_at >= p_since and created_at < p_until
),
labeled as (
  select
    session_id, event, path, referrer, product_slug, created_at,
    lag(created_at) over (partition by session_id order by created_at) as prev_ts
  from ev
),
sessions as (
  select
    session_id, event, path, referrer, product_slug, created_at,
    sum(case when prev_ts is null or created_at - prev_ts > interval '30 minutes'
             then 1 else 0 end)
      over (partition by session_id order by created_at) as sess_num
  from labeled
),
visits_stat as (
  select count(distinct (session_id, sess_num))::bigint as visits
  from sessions
),
purchase_stat as (
  select count(distinct (session_id, sess_num))::bigint as purchase_visits
  from sessions where event = 'purchase'
),
session_pv as (
  select session_id, sess_num, count(*) filter (where event = 'page_view')::bigint as n_pv
  from sessions
  group by session_id, sess_num
),
bounce_stat as (
  select count(*) filter (where n_pv = 1)::bigint as bounces
  from session_pv
),
totals as (
  select
    count(*)::bigint as total_events,
    count(*) filter (where event = 'page_view')::bigint as page_views,
    count(distinct session_id)::bigint as visitors
  from ev
),
breakdown as (
  select coalesce(
    jsonb_agg(jsonb_build_object('event', event, 'count', c) order by c desc, event),
    '[]'::jsonb
  ) as arr
  from (select event, count(*)::bigint as c from ev group by event) t
),
funnel_counts as (
  select event, count(distinct (session_id, sess_num))::bigint as cnt
  from sessions
  where event in ('view_item', 'add_to_cart', 'begin_checkout', 'purchase')
  group by event
),
funnel as (
  select coalesce(
    jsonb_agg(jsonb_build_object('step', s.step, 'event', s.event, 'count', coalesce(fc.cnt, 0)) order by s.ord),
    '[]'::jsonb
  ) as arr
  from (values
    ('view_item', 'Vue produit', 1),
    ('add_to_cart', 'Ajout panier', 2),
    ('begin_checkout', 'Checkout', 3),
    ('purchase', 'Commande', 4)
  ) as s(event, step, ord)
  left join funnel_counts fc on fc.event = s.event
),
top_pages as (
  select coalesce(
    jsonb_agg(jsonb_build_object('path', path, 'count', c) order by c desc, path),
    '[]'::jsonb
  ) as arr
  from (
    select coalesce(path, '/') as path, count(*)::bigint as c
    from ev
    where event = 'page_view'
    group by 1 order by c desc limit 10
  ) t
),
top_products as (
  select coalesce(
    jsonb_agg(jsonb_build_object('slug', product_slug, 'count', c) order by c desc, product_slug),
    '[]'::jsonb
  ) as arr
  from (
    select product_slug, count(*)::bigint as c
    from ev
    where event = 'view_item' and product_slug is not null
    group by product_slug order by c desc limit 10
  ) t
),
top_referrers as (
  select coalesce(
    jsonb_agg(jsonb_build_object('host', host, 'count', c) order by c desc, host),
    '[]'::jsonb
  ) as arr
  from (
    select host, count(distinct session_id)::bigint as c
    from (
      select session_id,
             nullif(lower(substring(referrer from '^[a-z]+://([^/:]+)')), '') as host
      from ev
      where event = 'page_view' and referrer is not null and referrer <> ''
    ) r
    where host is not null
    group by host order by c desc limit 10
  ) t
),
series as (
  select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) as map
  from (
    select
      case p_granularity
        when 'hour' then to_char(created_at at time zone 'UTC', 'YYYY-MM-DD HH24')
        when 'month' then to_char(created_at at time zone 'UTC', 'YYYY-MM')
        else to_char(created_at at time zone 'UTC', 'YYYY-MM-DD')
      end as k,
      count(*)::bigint as c
    from ev
    where event = 'page_view'
    group by 1
  ) t
)
select jsonb_build_object(
  'total_events',  (select total_events from totals),
  'page_views',    (select page_views from totals),
  'visitors',      (select visitors from totals),
  'visits',        (select visits from visits_stat),
  'purchase_visits', (select purchase_visits from purchase_stat),
  'bounces',       (select bounces from bounce_stat),
  'events_breakdown', (select arr from breakdown),
  'funnel',        (select arr from funnel),
  'top_pages',     (select arr from top_pages),
  'top_products',  (select arr from top_products),
  'top_referrers', (select arr from top_referrers),
  'series',        (select map from series)
);
$$;
