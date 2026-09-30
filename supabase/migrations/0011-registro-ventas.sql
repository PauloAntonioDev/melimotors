begin;

alter table public.vehicle_sales
  add column commission_amount_clp bigint not null default 0
    check (commission_amount_clp >= 0),
  add column client_proceeds_clp bigint
    check (client_proceeds_clp is null or client_proceeds_clp >= 0),
  add column dealer_profit_clp bigint not null default 0,
  add column updated_at timestamptz not null default now();

update public.vehicle_sales s
set
  commission_amount_clp = case
    when v.acquisition_type = 'consignacion'
      then round((s.final_sale_price_clp::numeric * coalesce(c.commission_pct, 0)) / 100)::bigint
    else 0
  end,
  client_proceeds_clp = case
    when v.acquisition_type = 'consignacion'
      then s.final_sale_price_clp - round((s.final_sale_price_clp::numeric * coalesce(c.commission_pct, 0)) / 100)::bigint
    else null
  end,
  dealer_profit_clp = case
    when v.acquisition_type = 'consignacion'
      then round((s.final_sale_price_clp::numeric * coalesce(c.commission_pct, 0)) / 100)::bigint - coalesce(c.total_cost_clp, 0)
    else s.final_sale_price_clp - coalesce(c.total_cost_clp, 0)
  end
from public.vehicles v
left join public.vehicle_costs c on c.vehicle_id = v.id
where v.id = s.vehicle_id;

create or replace function public.calculate_sale_financials()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_acquisition_type text;
  operating_cost_total bigint;
  commission_percentage numeric;
begin
  select
    v.acquisition_type,
    coalesce(c.total_cost_clp, 0),
    coalesce(c.commission_pct, 0)
  into
    vehicle_acquisition_type,
    operating_cost_total,
    commission_percentage
  from public.vehicles v
  left join public.vehicle_costs c on c.vehicle_id = v.id
  where v.id = new.vehicle_id;

  if vehicle_acquisition_type = 'consignacion' then
    new.commission_amount_clp := round((new.final_sale_price_clp::numeric * commission_percentage) / 100)::bigint;
    new.client_proceeds_clp := new.final_sale_price_clp - new.commission_amount_clp;
    new.dealer_profit_clp := new.commission_amount_clp - operating_cost_total;
  else
    new.commission_amount_clp := 0;
    new.client_proceeds_clp := null;
    new.dealer_profit_clp := new.final_sale_price_clp - operating_cost_total;
  end if;

  return new;
end;
$$;

create trigger calculate_sale_financials_before_write
  before insert or update of vehicle_id, final_sale_price_clp on public.vehicle_sales
  for each row execute procedure public.calculate_sale_financials();

create trigger vehicle_sales_updated_at
  before update on public.vehicle_sales
  for each row execute procedure public.set_updated_at();

create or replace function public.validate_sale()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_status text;
begin
  select status into vehicle_status from public.vehicles where id = new.vehicle_id;
  if vehicle_status not in ('borrador', 'disponible', 'reservado', 'vendido') then
    raise exception 'sale requires a draft, available, reserved or sold vehicle'
      using errcode = '23514';
  end if;
  if new.sold_at > now() then
    raise exception 'sale date cannot be in the future'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.validate_vehicle_state()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  image_count integer;
  cover_count integer;
begin
  if tg_op = 'UPDATE'
     and old.status = 'vendido'
     and new.status not in ('vendido', 'archivado') then
    raise exception 'sold vehicle requires an explicit correction before reopening'
      using errcode = '23514';
  end if;

  if new.status in ('disponible', 'reservado', 'vendido') then
    if length(trim(new.brand)) = 0
       or length(trim(new.model)) = 0
       or length(trim(new.description)) = 0
       or new.sale_price_clp <= 0 then
      raise exception 'vehicle is missing required commercial fields'
        using errcode = '23514';
    end if;
  end if;

  if new.status in ('disponible', 'reservado') then
    select count(*), count(*) filter (where is_cover)
      into image_count, cover_count
    from public.vehicle_images
    where vehicle_id = new.id;

    if image_count = 0 or cover_count <> 1 then
      raise exception 'published vehicle requires images and exactly one cover'
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'reservado'
     and not exists (
       select 1 from public.vehicle_reservations
       where vehicle_id = new.id and status = 'active'
     ) then
    raise exception 'reserved vehicle requires an active reservation'
      using errcode = '23514';
  end if;

  if new.status = 'disponible'
     and exists (
       select 1 from public.vehicle_reservations
       where vehicle_id = new.id and status = 'active'
     ) then
    raise exception 'available vehicle cannot have an active reservation'
      using errcode = '23514';
  end if;

  if new.status = 'vendido'
     and not exists (
       select 1 from public.vehicle_sales
       where vehicle_id = new.id
     ) then
    raise exception 'sold vehicle requires a sale record'
      using errcode = '23514';
  end if;

  if new.status in ('disponible', 'reservado')
     and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

commit;
