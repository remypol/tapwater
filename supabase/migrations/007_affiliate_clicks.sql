-- First-party affiliate click log.
--
-- GA4 sits on an account we cannot read, Amazon cannot report per product for
-- plain /dp/ links, and the partner dashboards sit behind their own logins.
-- This table is the one record of which product was clicked, on which page,
-- toward which programme, that the site itself controls. Deliberately no
-- visitor identity: no IP, no user agent, no cookie id.
create table if not exists affiliate_clicks (
  id bigint generated always as identity primary key,
  clicked_at timestamptz not null default now(),
  product_slug text not null,
  partner text not null,
  page text not null,
  placement text,
  campaign text
);

create index if not exists affiliate_clicks_clicked_at_idx
  on affiliate_clicks (clicked_at desc);
create index if not exists affiliate_clicks_product_slug_idx
  on affiliate_clicks (product_slug);

-- RLS on with no policies: the anon key can do nothing here. The API route
-- writes with the service role, which bypasses RLS.
alter table affiliate_clicks enable row level security;
