-- B2B data product: address-level water reports over an API key.
--
-- Keys are stored hashed (sha256) so a database read never yields a usable key;
-- the plaintext is shown once at creation by scripts/create-api-key.ts. Usage is
-- one row per call so a pilot conversation can show the customer exactly what
-- they used, and so quotas can be enforced per calendar month.
create table if not exists api_keys (
  id bigint generated always as identity primary key,
  key_hash text not null unique,
  key_prefix text not null,               -- first 8 chars, for support conversations
  customer text not null,
  contact_email text,
  plan text not null default 'pilot',     -- pilot | starter | growth | enterprise
  monthly_quota integer not null default 1000,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists api_usage (
  id bigint generated always as identity primary key,
  key_id bigint not null references api_keys(id) on delete cascade,
  called_at timestamptz not null default now(),
  path text not null,
  postcode text,
  status integer not null
);

create index if not exists api_usage_key_month_idx on api_usage (key_id, called_at desc);

-- Enquiries from /for-business. Same shape as installer partner enquiries:
-- stored first, emailed second, so a mail failure never loses the lead.
create table if not exists business_enquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company text not null,
  contact_name text not null,
  email text not null,
  website text,
  use_case text not null,
  expected_volume text,
  status text not null default 'new'
);

alter table api_keys enable row level security;
alter table api_usage enable row level security;
alter table business_enquiries enable row level security;
-- No policies: only the service role (server routes and scripts) touches these.
