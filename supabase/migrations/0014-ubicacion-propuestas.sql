begin;

alter table public.vehicle_proposals
  add column location text;

update public.vehicle_proposals
set location = 'Sin ubicacion informada'
where location is null;

alter table public.vehicle_proposals
  alter column location set not null,
  add constraint vehicle_proposals_location_check
    check (length(trim(location)) between 2 and 120);

create index vehicle_proposals_location_idx
  on public.vehicle_proposals (lower(location));

commit;
