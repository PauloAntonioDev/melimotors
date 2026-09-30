begin;

alter table public.vehicle_proposals
  add column image_storage_path text
    check (image_storage_path is null or length(trim(image_storage_path)) > 0);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'proposal-images',
  'proposal-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy proposal_images_storage_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'proposal-images' and public.is_admin());

create policy proposal_images_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proposal-images' and public.is_admin());

create policy proposal_images_storage_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'proposal-images' and public.is_admin())
  with check (bucket_id = 'proposal-images' and public.is_admin());

create policy proposal_images_storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'proposal-images' and public.is_admin());

commit;
