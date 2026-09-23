begin;

alter table public.vehicles
  add column acquisition_type text not null default 'compra_directa'
  check (acquisition_type in ('compra_directa', 'consignacion'));

alter table public.vehicle_costs
  add column inspection_pre_purchase_cost_clp bigint not null default 0
    check (inspection_pre_purchase_cost_clp >= 0),
  add column advertising_cost_clp bigint not null default 0
    check (advertising_cost_clp >= 0);

drop view public.vehicle_margin_summary;

alter table public.vehicle_costs drop column total_cost_clp;

alter table public.vehicle_costs
  add column total_cost_clp bigint generated always as (
    purchase_cost_clp
    + transfer_cost_clp
    + reconditioning_cost_clp
    + transport_cost_clp
    + commission_cost_clp
    + other_cost_clp
    + inspection_pre_purchase_cost_clp
    + advertising_cost_clp
  ) stored;

create view public.vehicle_margin_summary as
select
  v.id as vehicle_id,
  v.sale_price_clp,
  coalesce(c.total_cost_clp, 0)::bigint as total_cost_clp,
  (v.sale_price_clp - coalesce(c.total_cost_clp, 0))::bigint as gross_margin_clp,
  round(((v.sale_price_clp - coalesce(c.total_cost_clp, 0))::numeric / v.sale_price_clp::numeric) * 100, 2) as margin_pct,
  coalesce((select (value #>> '{}')::numeric from public.site_settings where key = 'margin_threshold_pct'), 10) as margin_threshold_pct
from public.vehicles v
left join public.vehicle_costs c on c.vehicle_id = v.id
where public.is_admin();

alter view public.vehicle_margin_summary set (security_invoker = true);
grant select on public.vehicle_margin_summary to authenticated;

commit;
