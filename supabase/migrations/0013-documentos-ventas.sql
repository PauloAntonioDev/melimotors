begin;

create table public.vehicle_sale_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicle_sales(vehicle_id) on delete cascade,
  document_type text not null
    check (document_type in ('nota_venta', 'autofact', 'contrato_compraventa', 'otro')),
  file_name text not null check (length(trim(file_name)) > 0),
  storage_path text not null unique check (length(trim(storage_path)) > 0),
  mime_type text,
  file_size_bytes bigint not null
    check (file_size_bytes between 1 and 15728640),
  uploaded_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index vehicle_sale_documents_vehicle_created_idx
  on public.vehicle_sale_documents (vehicle_id, created_at desc);

create trigger audit_vehicle_sale_documents
  after insert or update or delete on public.vehicle_sale_documents
  for each row execute procedure public.audit_row_change();

alter table public.vehicle_sale_documents enable row level security;

grant select, insert, update, delete on public.vehicle_sale_documents to authenticated;

create policy vehicle_sale_documents_admin_all on public.vehicle_sale_documents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'sale-documents',
  'sale-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy sale_documents_storage_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'sale-documents' and public.is_admin());

create policy sale_documents_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sale-documents' and public.is_admin());

create policy sale_documents_storage_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'sale-documents' and public.is_admin())
  with check (bucket_id = 'sale-documents' and public.is_admin());

create policy sale_documents_storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'sale-documents' and public.is_admin());

commit;
