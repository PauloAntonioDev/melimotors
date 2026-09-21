begin;

create extension if not exists pgcrypto;

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values
  ('admin_email', to_jsonb(''::text)),
  ('margin_threshold_pct', to_jsonb(10::numeric)),
  ('financing_terms_months', '[12, 24, 36, 48, 60]'::jsonb),
  ('financing_default_annual_rate_pct', to_jsonb(10::numeric)),
  ('company_name', to_jsonb('Melimotors'::text)),
  ('company_whatsapp', to_jsonb(''::text)),
  ('company_address', to_jsonb(''::text)),
  ('company_hours', to_jsonb(''::text));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'seller'
    check (role in ('admin', 'seller', 'finance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_unique
  on public.profiles (lower(email));

alter table public.site_settings
  add constraint site_settings_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  stock_code text not null unique check (length(trim(stock_code)) > 0),
  slug text not null unique check (length(trim(slug)) > 0),
  brand text not null default '',
  model text not null default '',
  model_year smallint not null check (model_year between 1900 and 2100),
  mileage_km integer not null default 0 check (mileage_km >= 0),
  fuel_type text not null default 'other'
    check (fuel_type in ('benzina', 'diesel', 'hybrid', 'electric', 'other')),
  transmission text not null default 'other'
    check (transmission in ('manual', 'automatic', 'cvt', 'other')),
  description text not null default '',
  sale_price_clp bigint not null check (sale_price_clp > 0),
  status text not null default 'borrador'
    check (status in ('borrador', 'disponible', 'reservado', 'vendido', 'archivado')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index vehicle_images_one_cover
  on public.vehicle_images (vehicle_id)
  where is_cover;

create index vehicle_images_vehicle_order
  on public.vehicle_images (vehicle_id, sort_order, created_at);

create table public.vehicle_costs (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  purchase_cost_clp bigint not null default 0 check (purchase_cost_clp >= 0),
  transfer_cost_clp bigint not null default 0 check (transfer_cost_clp >= 0),
  reconditioning_cost_clp bigint not null default 0 check (reconditioning_cost_clp >= 0),
  transport_cost_clp bigint not null default 0 check (transport_cost_clp >= 0),
  commission_cost_clp bigint not null default 0 check (commission_cost_clp >= 0),
  other_cost_clp bigint not null default 0 check (other_cost_clp >= 0),
  total_cost_clp bigint generated always as (
    purchase_cost_clp
    + transfer_cost_clp
    + reconditioning_cost_clp
    + transport_cost_clp
    + commission_cost_clp
    + other_cost_clp
  ) stored,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.vehicle_reservations (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'cancelled')),
  notes text,
  reserved_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
);

create unique index vehicle_reservations_one_active
  on public.vehicle_reservations (vehicle_id)
  where status = 'active';

create table public.vehicle_sales (
  vehicle_id uuid primary key references public.vehicles(id) on delete restrict,
  sold_at timestamptz not null,
  final_sale_price_clp bigint not null check (final_sale_price_clp > 0),
  buyer_name text,
  buyer_phone text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  source text not null default 'general'
    check (source in ('general', 'vehicle_detail', 'whatsapp')),
  name text not null check (length(trim(name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  email text,
  message text,
  status text not null default 'nueva'
    check (status in ('nueva', 'contactada', 'en seguimiento', 'cerrada', 'perdida')),
  internal_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_vehicle_source_consistency check (
    (source = 'vehicle_detail' and vehicle_id is not null)
    or (source <> 'vehicle_detail')
  )
);

create index vehicles_status_idx on public.vehicles (status);
create index vehicles_public_filters_idx
  on public.vehicles (brand, model, model_year, sale_price_clp)
  where status in ('disponible', 'reservado');
create index leads_status_created_idx on public.leads (status, created_at desc);
create index reservations_vehicle_status_idx
  on public.vehicle_reservations (vehicle_id, status);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text not null,
  entity_id uuid,
  entity_key text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.calculate_financing_payment(
  p_price_clp bigint,
  p_down_payment_clp bigint,
  p_annual_rate_pct numeric,
  p_term_months integer
)
returns numeric(14, 2)
language plpgsql
immutable
set search_path = public
as $$
declare
  principal numeric;
  monthly_rate numeric;
  factor numeric;
begin
  if p_price_clp <= 0 then
    raise exception 'price must be greater than zero' using errcode = '22023';
  end if;
  if p_down_payment_clp < 0 or p_down_payment_clp > p_price_clp then
    raise exception 'down payment must be between zero and price' using errcode = '22023';
  end if;
  if p_annual_rate_pct < 0 then
    raise exception 'annual rate cannot be negative' using errcode = '22023';
  end if;
  if p_term_months <= 0 then
    raise exception 'term must be greater than zero' using errcode = '22023';
  end if;

  principal := p_price_clp - p_down_payment_clp;
  if principal = 0 then
    return 0.00;
  end if;

  monthly_rate := (p_annual_rate_pct / 100) / 12;
  if monthly_rate = 0 then
    return round(principal / p_term_months, 2);
  end if;

  factor := power(1 + monthly_rate, p_term_months);
  return round(principal * ((monthly_rate * factor) / (factor - 1)), 2);
end;
$$;

grant execute on function public.calculate_financing_payment(bigint, bigint, numeric, integer)
  to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  configured_admin_email text;
begin
  select lower(coalesce(value #>> '{}', ''))
    into configured_admin_email
  from public.site_settings
  where key = 'admin_email';

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case
      when lower(coalesce(new.email, '')) = configured_admin_email
        and configured_admin_email <> '' then 'admin'
      else 'seller'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.validate_site_setting()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  numeric_value numeric;
  term jsonb;
begin
  if new.key in ('margin_threshold_pct', 'financing_default_annual_rate_pct') then
    if jsonb_typeof(new.value) <> 'number' then
      raise exception 'setting % must be numeric', new.key using errcode = '22023';
    end if;
    numeric_value := (new.value #>> '{}')::numeric;
    if numeric_value < 0 then
      raise exception 'setting % cannot be negative', new.key using errcode = '22023';
    end if;
    if new.key = 'margin_threshold_pct' and numeric_value > 100 then
      raise exception 'margin threshold cannot exceed 100' using errcode = '22023';
    end if;
  elsif new.key = 'financing_terms_months' then
    if jsonb_typeof(new.value) <> 'array' or jsonb_array_length(new.value) = 0 then
      raise exception 'financing terms must be a non-empty array' using errcode = '22023';
    end if;
    for term in select value from jsonb_array_elements(new.value) loop
      if jsonb_typeof(term) <> 'number' or (term #>> '{}')::integer <= 0 then
        raise exception 'financing terms must contain positive numbers' using errcode = '22023';
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger validate_site_setting_before_write
  before insert or update on public.site_settings
  for each row execute procedure public.validate_site_setting();

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
      raise exception 'vehicle is missing required publication fields'
        using errcode = '23514';
    end if;

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

  if new.status in ('disponible', 'reservado', 'vendido')
     and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

create trigger validate_vehicle_state_before_write
  before insert or update of status, brand, model, description, sale_price_clp
  on public.vehicles
  for each row execute procedure public.validate_vehicle_state();

create or replace function public.validate_reservation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_status text;
begin
  if new.status = 'active' then
    select status into vehicle_status
    from public.vehicles
    where id = new.vehicle_id;
    if vehicle_status not in ('disponible', 'reservado') then
      raise exception 'only available or reserved vehicles can have an active reservation'
        using errcode = '23514';
    end if;
    new.cancelled_at = null;
  elsif new.cancelled_at is null then
    new.cancelled_at = now();
  end if;
  return new;
end;
$$;

create trigger validate_reservation_before_write
  before insert or update on public.vehicle_reservations
  for each row execute procedure public.validate_reservation();

create or replace function public.sync_vehicle_after_reservation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  affected_vehicle_id uuid;
  vehicle_status text;
  has_active_reservation boolean;
begin
  if tg_op = 'DELETE' then
    affected_vehicle_id := old.vehicle_id;
  else
    affected_vehicle_id := new.vehicle_id;
  end if;
  select status into vehicle_status
  from public.vehicles
  where id = affected_vehicle_id;

  select exists (
    select 1 from public.vehicle_reservations
    where vehicle_id = affected_vehicle_id and status = 'active'
  ) into has_active_reservation;

  if has_active_reservation and vehicle_status = 'disponible' then
    update public.vehicles set status = 'reservado' where id = affected_vehicle_id;
  elsif not has_active_reservation and vehicle_status = 'reservado' then
    update public.vehicles set status = 'disponible' where id = affected_vehicle_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_vehicle_after_reservation_change
  after insert or update or delete on public.vehicle_reservations
  for each row execute procedure public.sync_vehicle_after_reservation();

create or replace function public.validate_sale()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_status text;
begin
  select status into vehicle_status from public.vehicles where id = new.vehicle_id;
  if vehicle_status not in ('disponible', 'reservado', 'vendido') then
    raise exception 'sale requires an available, reserved or sold vehicle'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validate_sale_before_write
  before insert or update on public.vehicle_sales
  for each row execute procedure public.validate_sale();

create or replace function public.prevent_sale_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_status text;
begin
  select status into vehicle_status from public.vehicles where id = old.vehicle_id;
  if vehicle_status = 'vendido' then
    raise exception 'sale record cannot be deleted while vehicle is sold'
      using errcode = '23514';
  end if;
  return old;
end;
$$;

create trigger prevent_sale_delete_before_write
  before delete on public.vehicle_sales
  for each row execute procedure public.prevent_sale_delete();

create or replace function public.validate_lead()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  vehicle_status text;
begin
  if new.source = 'vehicle_detail' then
    select status into vehicle_status from public.vehicles where id = new.vehicle_id;
    if vehicle_status not in ('disponible', 'reservado') then
      raise exception 'vehicle detail leads require a public vehicle'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger validate_lead_before_write
  before insert or update on public.leads
  for each row execute procedure public.validate_lead();

create or replace function public.promote_cover_after_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  replacement_id uuid;
begin
  if old.is_cover then
    select id into replacement_id
    from public.vehicle_images
    where vehicle_id = old.vehicle_id
    order by sort_order, created_at, id
    limit 1;

    if replacement_id is null then
      raise exception 'a cover image cannot be deleted without a replacement'
        using errcode = '23514';
    end if;

    update public.vehicle_images
    set is_cover = true
    where id = replacement_id;
  end if;
  return old;
end;
$$;

create trigger promote_cover_after_delete
  after delete on public.vehicle_images
  for each row execute procedure public.promote_cover_after_delete();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  before_json jsonb;
  after_json jsonb;
  key_value text;
  id_value uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    before_json := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    after_json := to_jsonb(new);
  end if;
  key_value := coalesce(after_json ->> 'id', before_json ->> 'id', after_json ->> 'vehicle_id', before_json ->> 'vehicle_id', after_json ->> 'key', before_json ->> 'key');

  if tg_table_name <> 'site_settings' then
    id_value := nullif(key_value, '')::uuid;
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, entity_key, before_data, after_data)
  values (auth.uid(), tg_op, tg_table_name, id_value, key_value, before_json, after_json);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger vehicles_updated_at before update on public.vehicles
  for each row execute procedure public.set_updated_at();
create trigger leads_updated_at before update on public.leads
  for each row execute procedure public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute procedure public.set_updated_at();
create trigger vehicle_costs_updated_at before update on public.vehicle_costs
  for each row execute procedure public.set_updated_at();

create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute procedure public.audit_row_change();
create trigger audit_vehicles after insert or update or delete on public.vehicles
  for each row execute procedure public.audit_row_change();
create trigger audit_vehicle_images after insert or update or delete on public.vehicle_images
  for each row execute procedure public.audit_row_change();
create trigger audit_vehicle_costs after insert or update or delete on public.vehicle_costs
  for each row execute procedure public.audit_row_change();
create trigger audit_reservations after insert or update or delete on public.vehicle_reservations
  for each row execute procedure public.audit_row_change();
create trigger audit_sales after insert or update or delete on public.vehicle_sales
  for each row execute procedure public.audit_row_change();
create trigger audit_leads after insert or update or delete on public.leads
  for each row execute procedure public.audit_row_change();
create trigger audit_site_settings after insert or update or delete on public.site_settings
  for each row execute procedure public.audit_row_change();

create view public.public_vehicle_catalog as
select
  v.id,
  v.stock_code,
  v.slug,
  v.brand,
  v.model,
  v.model_year,
  v.mileage_km,
  v.fuel_type,
  v.transmission,
  v.description,
  v.sale_price_clp,
  v.status,
  v.published_at,
  cover.storage_path as cover_storage_path
from public.vehicles v
left join public.vehicle_images cover
  on cover.vehicle_id = v.id and cover.is_cover
where v.status in ('disponible', 'reservado');

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

alter view public.public_vehicle_catalog set (security_invoker = true);
alter view public.vehicle_margin_summary set (security_invoker = true);

grant select on public.public_vehicle_catalog to anon, authenticated;
grant select on public.vehicle_margin_summary to authenticated;

alter table public.site_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_costs enable row level security;
alter table public.vehicle_reservations enable row level security;
alter table public.vehicle_sales enable row level security;
alter table public.leads enable row level security;
alter table public.audit_events enable row level security;

grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.vehicles, public.vehicle_images to anon;
grant select, insert, update, delete on public.vehicles, public.vehicle_images to authenticated;
grant select, insert, update, delete on public.vehicle_costs to authenticated;
grant select, insert, update, delete on public.vehicle_reservations to authenticated;
grant select, insert, update, delete on public.vehicle_sales to authenticated;
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant select on public.audit_events to authenticated;

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated
  using (key in ('company_name', 'company_whatsapp', 'company_address', 'company_hours', 'financing_terms_months', 'financing_default_annual_rate_pct'));
create policy site_settings_admin_all on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy vehicles_public_read on public.vehicles
  for select to anon, authenticated
  using (status in ('disponible', 'reservado'));
create policy vehicles_admin_all on public.vehicles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy vehicle_images_public_read on public.vehicle_images
  for select to anon, authenticated
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and v.status in ('disponible', 'reservado')));
create policy vehicle_images_admin_all on public.vehicle_images
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy vehicle_costs_admin_all on public.vehicle_costs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy reservations_admin_all on public.vehicle_reservations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy sales_admin_all on public.vehicle_sales
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy leads_public_insert on public.leads
  for insert to anon, authenticated
  with check (
    status = 'nueva'
    and internal_notes is null
    and created_by is null
    and updated_by is null
  );
create policy leads_admin_all on public.leads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy audit_events_admin_read on public.audit_events
  for select to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do update set public = true;

create policy vehicle_images_storage_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vehicle-images');
create policy vehicle_images_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vehicle-images' and public.is_admin());
create policy vehicle_images_storage_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'vehicle-images' and public.is_admin())
  with check (bucket_id = 'vehicle-images' and public.is_admin());
create policy vehicle_images_storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicle-images' and public.is_admin());

commit;
