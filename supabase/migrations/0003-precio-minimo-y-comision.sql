begin;

drop view public.vehicle_margin_summary;

alter table public.vehicles
  add column minimum_sale_price_clp bigint not null default 0
    check (minimum_sale_price_clp >= 0 and minimum_sale_price_clp <= sale_price_clp);

alter table public.vehicle_costs
  add column commission_pct numeric(5, 2) not null default 0
    check (commission_pct >= 0 and commission_pct <= 100);

update public.vehicle_costs c
set commission_pct = round((c.commission_cost_clp::numeric / nullif(v.sale_price_clp, 0)) * 100, 2)
from public.vehicles v
where v.id = c.vehicle_id
  and c.commission_cost_clp > 0;

create or replace function public.sync_vehicle_commission()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_price bigint;
begin
  select sale_price_clp into vehicle_price from public.vehicles where id = new.vehicle_id;
  new.commission_cost_clp := round((vehicle_price::numeric * new.commission_pct) / 100)::bigint;
  return new;
end;
$$;

create trigger sync_vehicle_commission_before_write
  before insert or update of commission_pct on public.vehicle_costs
  for each row execute procedure public.sync_vehicle_commission();

create or replace function public.refresh_vehicle_commission()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.vehicle_costs
  set commission_pct = commission_pct
  where vehicle_id = new.id;
  return new;
end;
$$;

create trigger refresh_vehicle_commission_after_price_change
  after update of sale_price_clp on public.vehicles
  for each row when (old.sale_price_clp is distinct from new.sale_price_clp)
  execute procedure public.refresh_vehicle_commission();

create view public.vehicle_margin_summary as
select
  v.id as vehicle_id,
  v.sale_price_clp,
  v.minimum_sale_price_clp,
  coalesce(c.total_cost_clp, 0)::bigint as total_cost_clp,
  (v.sale_price_clp - coalesce(c.total_cost_clp, 0))::bigint as gross_margin_clp,
  (v.minimum_sale_price_clp - coalesce(c.total_cost_clp, 0))::bigint as minimum_gross_margin_clp,
  coalesce(c.commission_pct, 0)::numeric(5, 2) as commission_pct,
  round(((v.sale_price_clp - coalesce(c.total_cost_clp, 0))::numeric / v.sale_price_clp::numeric) * 100, 2) as margin_pct,
  coalesce((select (value #>> '{}')::numeric from public.site_settings where key = 'margin_threshold_pct'), 10) as margin_threshold_pct
from public.vehicles v
left join public.vehicle_costs c on c.vehicle_id = v.id
where public.is_admin();

alter view public.vehicle_margin_summary set (security_invoker = true);
grant select on public.vehicle_margin_summary to authenticated;

commit;
