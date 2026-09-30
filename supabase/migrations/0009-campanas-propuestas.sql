begin;

alter table public.vehicle_proposals
  add column campaign_name text,
  add column campaign_code text;

alter table public.vehicle_proposals
  add constraint vehicle_proposals_campaign_name_check
    check (campaign_name is null or length(trim(campaign_name)) between 1 and 120),
  add constraint vehicle_proposals_campaign_code_check
    check (campaign_code is null or (length(campaign_code) between 1 and 32 and campaign_code ~ '^[A-Z0-9]+$')),
  add constraint vehicle_proposals_campaign_assignment_check
    check (campaign_name is null or campaign_code is not null);

create index vehicle_proposals_campaign_code_idx
  on public.vehicle_proposals (campaign_code)
  where campaign_code is not null;

commit;
