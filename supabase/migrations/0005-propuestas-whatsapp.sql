begin;

create table public.vehicle_proposals (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'whatsapp'
    check (source in ('whatsapp', 'presencial', 'referido', 'otro')),
  status text not null default 'nueva'
    check (status in ('nueva', 'en_revision', 'contactada', 'aceptada', 'rechazada', 'archivada')),
  acquisition_type text not null default 'consignacion'
    check (acquisition_type in ('compra_directa', 'consignacion')),
  seller_name text not null check (length(trim(seller_name)) > 0),
  seller_phone text not null check (length(trim(seller_phone)) > 0),
  seller_email text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_plate text,
  vehicle_brand text not null check (length(trim(vehicle_brand)) > 0),
  vehicle_model text not null check (length(trim(vehicle_model)) > 0),
  vehicle_year smallint check (vehicle_year is null or vehicle_year between 1900 and 2100),
  vehicle_mileage_km integer not null default 0 check (vehicle_mileage_km >= 0),
  expected_price_clp bigint not null default 0 check (expected_price_clp >= 0),
  vehicle_description text,
  conversation_summary text,
  internal_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicle_proposals_status_created_idx
  on public.vehicle_proposals (status, created_at desc);

create trigger vehicle_proposals_updated_at
  before update on public.vehicle_proposals
  for each row execute procedure public.set_updated_at();

create trigger audit_vehicle_proposals
  after insert or update or delete on public.vehicle_proposals
  for each row execute procedure public.audit_row_change();

alter table public.vehicle_proposals enable row level security;

grant select, insert, update, delete on public.vehicle_proposals to authenticated;

create policy vehicle_proposals_admin_all on public.vehicle_proposals
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
