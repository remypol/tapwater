-- Incidents table: stores all detected water incidents and their articles
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  source_hash text unique not null,
  title text not null,
  type text not null check (type in ('boil_notice', 'supply_interruption', 'pollution', 'enforcement', 'pfas_discovery', 'general')),
  severity text not null default 'info' check (severity in ('critical', 'warning', 'info')),
  status text not null default 'active' check (status in ('active', 'resolved')),
  source text not null check (source in ('water_company', 'environment_agency', 'dwi', 'news')),
  source_url text,
  supplier_id text,
  affected_postcodes text[] not null default '{}',
  affected_cities text[] not null default '{}',
  households_affected int,
  summary text not null,
  action_required text,
  article_markdown text not null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  last_checked timestamptz not null default now(),
  source_data jsonb,
  created_at timestamptz not null default now()
);

-- Index for querying active incidents by postcode (used on every postcode page render)
create index if not exists idx_incidents_active_postcodes
  on incidents using gin (affected_postcodes)
  where status = 'active';

-- Index for querying active incidents by city (used on every city page render)
create index if not exists idx_incidents_active_cities
  on incidents using gin (affected_cities)
  where status = 'active';

-- Index for slug lookups (article pages)
create index if not exists idx_incidents_slug on incidents (slug);

-- Index for news hub listing (ordered by date)
create index if not exists idx_incidents_detected_at on incidents (detected_at desc);

-- Source checks: logs every poll of every source for health monitoring
create table if not exists source_checks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_name text not null,
  status_code int,
  items_found int not null default 0,
  error text,
  checked_at timestamptz not null default now()
);

-- Index for consecutive failure detection
create index if not exists idx_source_checks_recent
  on source_checks (source, source_name, checked_at desc);

-- Incident logs: audit trail for every state transition
create table if not exists incident_logs (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  action text not null check (action in ('detected', 'updated', 'resolved', 'enriched', 'stale_alert')),
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_incident_logs_incident
  on incident_logs (incident_id, created_at desc);
