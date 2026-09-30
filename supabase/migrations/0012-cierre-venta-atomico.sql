begin;

create or replace function public.register_vehicle_sale(
  p_vehicle_id uuid,
  p_sold_at timestamptz,
  p_final_sale_price_clp bigint,
  p_buyer_name text default null,
  p_buyer_phone text default null,
  p_notes text default null
)
returns public.vehicle_sales
language plpgsql
set search_path = public
as $$
declare
  saved_sale public.vehicle_sales;
begin
  if not public.is_admin() then
    raise exception 'only admins can register sales' using errcode = '42501';
  end if;

  insert into public.vehicle_sales (
    vehicle_id,
    sold_at,
    final_sale_price_clp,
    buyer_name,
    buyer_phone,
    notes,
    created_by
  ) values (
    p_vehicle_id,
    p_sold_at,
    p_final_sale_price_clp,
    nullif(trim(p_buyer_name), ''),
    nullif(trim(p_buyer_phone), ''),
    nullif(trim(p_notes), ''),
    auth.uid()
  )
  on conflict (vehicle_id) do update
  set
    sold_at = excluded.sold_at,
    final_sale_price_clp = excluded.final_sale_price_clp,
    buyer_name = excluded.buyer_name,
    buyer_phone = excluded.buyer_phone,
    notes = excluded.notes
  returning * into saved_sale;

  update public.vehicles
  set status = 'vendido', updated_by = auth.uid()
  where id = p_vehicle_id;

  if not found then
    raise exception 'vehicle not found' using errcode = 'P0002';
  end if;

  return saved_sale;
end;
$$;

grant execute on function public.register_vehicle_sale(uuid, timestamptz, bigint, text, text, text)
  to authenticated;

commit;
