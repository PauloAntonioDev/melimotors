begin;

alter table public.vehicle_proposals
  add column whatsapp_id text;

update public.vehicle_proposals
set whatsapp_id = case
  when regexp_replace(seller_phone, '\D', '', 'g') like '56%'
    then '+' || regexp_replace(seller_phone, '\D', '', 'g')
  else '+56' || ltrim(regexp_replace(seller_phone, '\D', '', 'g'), '0')
end;

alter table public.vehicle_proposals
  alter column whatsapp_id set not null,
  add constraint vehicle_proposals_whatsapp_id_check
    check (length(whatsapp_id) between 8 and 16 and whatsapp_id ~ '^\+[0-9]+$');

create index vehicle_proposals_whatsapp_id_idx
  on public.vehicle_proposals (whatsapp_id);

commit;
