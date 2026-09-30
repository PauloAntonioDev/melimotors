begin;

alter table public.vehicle_proposals
  add column business_purchase_price_min_clp bigint,
  add column business_purchase_price_max_clp bigint,
  add column market_sale_price_min_clp bigint,
  add column market_sale_price_max_clp bigint,
  add column sellability_score numeric(2, 1) not null default 0,
  add constraint vehicle_proposals_business_purchase_range_check
    check (
      (business_purchase_price_min_clp is null and business_purchase_price_max_clp is null)
      or (
        business_purchase_price_min_clp is not null
        and business_purchase_price_max_clp is not null
        and business_purchase_price_min_clp >= 0
        and business_purchase_price_max_clp >= business_purchase_price_min_clp
      )
    ),
  add constraint vehicle_proposals_market_sale_range_check
    check (
      (market_sale_price_min_clp is null and market_sale_price_max_clp is null)
      or (
        market_sale_price_min_clp is not null
        and market_sale_price_max_clp is not null
        and market_sale_price_min_clp >= 0
        and market_sale_price_max_clp >= market_sale_price_min_clp
      )
    ),
  add constraint vehicle_proposals_sellability_score_check
    check (
      sellability_score between 0 and 5
      and mod(sellability_score, 0.5) = 0
    );

commit;
