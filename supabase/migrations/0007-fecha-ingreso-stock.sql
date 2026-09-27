begin;

alter table public.vehicles
  add column inventory_entry_date date;

-- Existing vehicles keep a meaningful stock start date based on their creation.
update public.vehicles
set inventory_entry_date = created_at::date
where inventory_entry_date is null;

alter table public.vehicles
  alter column inventory_entry_date set default current_date,
  alter column inventory_entry_date set not null;

commit;
