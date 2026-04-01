-- TapWater.uk Initial Schema Migration
-- 001_initial_schema.sql

-- ============================================================
-- Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Updated-at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- water_suppliers (~25 rows)
-- ============================================================

CREATE TABLE water_suppliers (
  id                   TEXT PRIMARY KEY,              -- slug e.g. 'thames-water'
  name                 TEXT NOT NULL,
  region               TEXT,
  customers_m          DECIMAL(4,1),
  website              TEXT,
  postcode_lookup_url  TEXT,
  scraper_type         TEXT CHECK (scraper_type IN ('playwright', 'api', 'none')),
  compliance_rate      DECIMAL(5,2),
  last_scraped         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_water_suppliers_updated_at
  BEFORE UPDATE ON water_suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- postcode_districts (2,979 rows)
-- ============================================================

CREATE TABLE postcode_districts (
  id              TEXT PRIMARY KEY,                   -- e.g. 'SW1A', 'E1'
  area_name       TEXT NOT NULL,
  city            TEXT,
  region          TEXT,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  geom            GEOMETRY(Point, 4326),
  supplier_id     TEXT REFERENCES water_suppliers(id),
  supply_zone     TEXT,
  population_est  INTEGER,
  has_page        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postcode_districts_geom        ON postcode_districts USING GIST (geom);
CREATE INDEX idx_postcode_districts_supplier_id ON postcode_districts (supplier_id);
CREATE INDEX idx_postcode_districts_has_page    ON postcode_districts (has_page);

CREATE TRIGGER trg_postcode_districts_updated_at
  BEFORE UPDATE ON postcode_districts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- drinking_water_readings
-- ============================================================

CREATE TABLE drinking_water_readings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postcode_district   TEXT REFERENCES postcode_districts(id),
  supplier_id         TEXT REFERENCES water_suppliers(id),
  supply_zone         TEXT,
  determinand         TEXT NOT NULL,
  value               DECIMAL(12,6),
  unit                TEXT NOT NULL,
  uk_limit            DECIMAL(12,6),
  who_guideline       DECIMAL(12,6),
  sample_date         DATE NOT NULL,
  source              TEXT NOT NULL CHECK (source IN ('dwi_annual', 'company_scrape')),
  source_ref          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dwr_postcode_district             ON drinking_water_readings (postcode_district);
CREATE INDEX idx_dwr_determinand                   ON drinking_water_readings (determinand);
CREATE INDEX idx_dwr_sample_date                   ON drinking_water_readings (sample_date DESC);
CREATE INDEX idx_dwr_postcode_district_determinand ON drinking_water_readings (postcode_district, determinand);

-- ============================================================
-- environmental_readings
-- ============================================================

CREATE TABLE environmental_readings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sampling_point_id     TEXT NOT NULL,
  sampling_point_label  TEXT,
  sampling_point_type   TEXT,
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,
  geom                  GEOMETRY(Point, 4326),
  determinand_id        TEXT NOT NULL,
  determinand_label     TEXT,
  value                 DECIMAL(12,6),
  unit                  TEXT,
  sample_date           DATE NOT NULL,
  source_ref            TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_env_readings_geom               ON environmental_readings USING GIST (geom);
CREATE INDEX idx_env_readings_determinand_id     ON environmental_readings (determinand_id);
CREATE INDEX idx_env_readings_sample_date        ON environmental_readings (sample_date DESC);
CREATE INDEX idx_env_readings_sampling_point_id  ON environmental_readings (sampling_point_id);

-- ============================================================
-- page_data (denormalized per-page data)
-- ============================================================

CREATE TABLE page_data (
  postcode_district       TEXT PRIMARY KEY REFERENCES postcode_districts(id),
  safety_score            DECIMAL(3,1) NOT NULL,
  score_grade             TEXT NOT NULL,
  contaminants_tested     INTEGER,
  contaminants_flagged    INTEGER,
  pfas_detected           BOOLEAN DEFAULT FALSE,
  pfas_level              DECIMAL(12,6),
  pfas_source             TEXT,
  top_concerns            JSONB,
  all_readings            JSONB,
  environmental_context   JSONB,
  filter_recommendations  JSONB,
  summary_text            TEXT,
  nearby_postcodes        TEXT[],
  last_data_update        TIMESTAMPTZ,
  last_page_build         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_page_data_updated_at
  BEFORE UPDATE ON page_data
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- filters (water filter products)
-- ============================================================

CREATE TABLE filters (
  id                TEXT PRIMARY KEY,
  brand             TEXT NOT NULL,
  model             TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('jug', 'under_sink', 'whole_house', 'countertop')),
  removes           TEXT[] NOT NULL,
  certifications    TEXT[],
  price_gbp         DECIMAL(8,2),
  affiliate_url     TEXT,
  affiliate_program TEXT,
  image_url         TEXT,
  rating            DECIMAL(2,1),
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_filters_category ON filters (category);
CREATE INDEX idx_filters_active   ON filters (active);

CREATE TRIGGER trg_filters_updated_at
  BEFORE UPDATE ON filters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- subscribers
-- ============================================================

CREATE TABLE subscribers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL,
  postcode_district    TEXT REFERENCES postcode_districts(id),
  verified             BOOLEAN DEFAULT FALSE,
  verification_token   TEXT,
  unsubscribed         BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscribers_email_postcode ON subscribers (email, postcode_district);

-- ============================================================
-- scrape_log
-- ============================================================

CREATE TABLE scrape_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_fetched  INTEGER,
  records_updated  INTEGER,
  error_message    TEXT,
  duration_ms      INTEGER,
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ
);
