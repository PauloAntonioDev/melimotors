begin;

alter table public.vehicle_proposals
  drop constraint if exists vehicle_proposals_whatsapp_id_check;

alter table public.vehicle_proposals
  add constraint vehicle_proposals_whatsapp_id_check
    check (
      length(whatsapp_id) between 8 and 16
      and left(whatsapp_id, 1) = '+'
      and substring(whatsapp_id from 2) ~ '^[0-9]+$'
    );

commit;
