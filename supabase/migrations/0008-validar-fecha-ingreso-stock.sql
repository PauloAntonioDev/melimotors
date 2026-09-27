begin;

alter table public.vehicles
  alter column inventory_entry_date set default ((now() at time zone 'America/Santiago')::date);

create or replace function public.validate_vehicle_inventory_entry_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.inventory_entry_date > (now() at time zone 'America/Santiago')::date then
    raise exception 'inventory_entry_date cannot be in the future';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_vehicle_inventory_entry_date on public.vehicles;
create trigger validate_vehicle_inventory_entry_date
before insert or update of inventory_entry_date on public.vehicles
for each row execute function public.validate_vehicle_inventory_entry_date();

commit;
