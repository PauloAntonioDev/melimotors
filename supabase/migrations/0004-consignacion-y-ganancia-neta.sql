begin;

drop view public.vehicle_margin_summary;

alter table public.vehicle_costs
  rename column commission_cost_clp to commission_amount_clp;

alter table public.vehicle_costs
  drop column total_cost_clp;

alter table public.vehicle_costs
  add column total_cost_clp bigint generated always as (
    purchase_cost_clp
    + transfer_cost_clp
    + reconditioning_cost_clp
    + transport_cost_clp
    + other_cost_clp
    + inspection_pre_purchase_cost_clp
    + advertising_cost_clp
  ) stored;

create or replace function public.sync_vehicle_commission()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_price bigint;
  acquisition_mode text;
begin
  select sale_price_clp, acquisition_type
    into vehicle_price, acquisition_mode
  from public.vehicles
  where id = new.vehicle_id;

  new.commission_amount_clp := case
    when acquisition_mode = 'consignacion'
      then round((vehicle_price::numeric * new.commission_pct) / 100)::bigint
    else 0
  end;
  return new;
end;
$$;

drop trigger if exists sync_vehicle_commission_before_write on public.vehicle_costs;

create trigger sync_vehicle_commission_before_write
  before insert or update of commission_pct, vehicle_id on public.vehicle_costs
  for each row execute procedure public.sync_vehicle_commission();

drop trigger if exists refresh_vehicle_commission_after_price_change on public.vehicles;

create trigger refresh_vehicle_commission_after_price_change
  after update of sale_price_clp, acquisition_type on public.vehicles
  for each row
  when (
    old.sale_price_clp is distinct from new.sale_price_clp
    or old.acquisition_type is distinct from new.acquisition_type
  )
  execute procedure public.refresh_vehicle_commission();

update public.vehicle_costs c
set commission_pct = c.commission_pct
from public.vehicles v
where v.id = c.vehicle_id;

create view public.vehicle_margin_summary as
select
  v.id as vehicle_id,
  v.acquisition_type,
  v.sale_price_clp,
  v.minimum_sale_price_clp,
  coalesce(c.total_cost_clp, 0)::bigint as total_cost_clp,
  coalesce(c.commission_amount_clp, 0)::bigint as commission_amount_clp,
  case
    when v.acquisition_type = 'consignacion'
      then (v.sale_price_clp - coalesce(c.commission_amount_clp, 0))::bigint
    else null
  end as client_estimated_proceeds_clp,
  case
    when v.acquisition_type = 'consignacion'
      then (coalesce(c.commission_amount_clp, 0) - coalesce(c.total_cost_clp, 0))::bigint
    else (v.sale_price_clp - coalesce(c.total_cost_clp, 0))::bigint
  end as dealer_estimated_earnings_clp,
  case
    when v.acquisition_type = 'consignacion'
      then (v.minimum_sale_price_clp - round((v.minimum_sale_price_clp::numeric * coalesce(c.commission_pct, 0)::numeric) / 100)::bigint)
    else null
  end as minimum_client_estimated_proceeds_clp,
  case
    when v.acquisition_type = 'consignacion'
      then (round((v.minimum_sale_price_clp::numeric * coalesce(c.commission_pct, 0)::numeric) / 100)::bigint - coalesce(c.total_cost_clp, 0))::bigint
    else (v.minimum_sale_price_clp - coalesce(c.total_cost_clp, 0))::bigint
  end as minimum_dealer_estimated_earnings_clp,
  case
    when v.acquisition_type = 'consignacion'
      then (coalesce(c.commission_amount_clp, 0) - coalesce(c.total_cost_clp, 0))::bigint
    else (v.sale_price_clp - coalesce(c.total_cost_clp, 0))::bigint
  end as gross_margin_clp,
  round((
    case
      when v.acquisition_type = 'consignacion'
        then (coalesce(c.commission_amount_clp, 0) - coalesce(c.total_cost_clp, 0))::numeric
      else (v.sale_price_clp - coalesce(c.total_cost_clp, 0))::numeric
    end / v.sale_price_clp::numeric
  ) * 100, 2) as margin_pct,
  coalesce(c.commission_pct, 0)::numeric(5, 2) as commission_pct,
  coalesce((select (value #>> '{}')::numeric from public.site_settings where key = 'margin_threshold_pct'), 10) as margin_threshold_pct
from public.vehicles v
left join public.vehicle_costs c on c.vehicle_id = v.id
where public.is_admin();

alter view public.vehicle_margin_summary set (security_invoker = true);
grant select on public.vehicle_margin_summary to authenticated;

commit;
