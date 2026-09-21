-- Environment Agency river classifications (Water Framework Directive), one row per
-- river catchment, estuary and coastal water in England, plus the catchment each postcode district
-- sits in. Refreshed monthly by /api/cron/river-status.

create table if not exists river_status (
  water_body_id                  text primary key,
  name                           text not null,
  modified                       text,
  river_basin_district           text not null default '',
  management_catchment           text not null default '',
  operational_catchment          text not null default '',
  classification_year            integer not null,
  ecological_class               text,
  chemical_class                 text,
  priority_hazardous_class       text,
  ecological_change              text,
  drinking_water_protected_area  text,
  elements                       jsonb not null default '[]'::jsonb,
  updated_at                     timestamptz not null default now()
);

create index if not exists idx_river_status_eco on river_status (ecological_class);

create table if not exists district_river_status (
  postcode_district  text primary key,
  water_body_id      text not null references river_status (water_body_id) on delete cascade,
  updated_at         timestamptz not null default now()
);

create index if not exists idx_district_river_wb on district_river_status (water_body_id);

-- Estuaries and coastal waters sit in the same table; districts on the tidal Thames,
-- the Mersey or the coast have no river catchment and take the nearest water body.
alter table river_status add column if not exists water_body_type text not null default 'River';
alter table district_river_status add column if not exists match_type text not null default 'within';
alter table district_river_status add column if not exists distance_km real;

-- Read and written only by the server with the service role key.
alter table river_status enable row level security;
alter table district_river_status enable row level security;
