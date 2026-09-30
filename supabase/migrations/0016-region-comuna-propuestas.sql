begin;

alter table public.vehicle_proposals
  add column region text;

update public.vehicle_proposals
set region = case
  when location = 'Talca' then 'Región del Maule'
  else 'Sin región informada'
end
where region is null;

alter table public.vehicle_proposals
  alter column region set not null,
  add constraint vehicle_proposals_region_check
    check (length(trim(region)) between 2 and 120);

create index vehicle_proposals_region_location_idx
  on public.vehicle_proposals (lower(region), lower(location));

commit;
