CREATE TABLE IF NOT EXISTS installer_partners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT NOT NULL,
  contact_name     TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  website          TEXT,
  coverage_regions TEXT[] NOT NULL,
  coverage_postcodes TEXT[],
  desired_volume   TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installer_partners_status ON installer_partners (status);
CREATE INDEX IF NOT EXISTS idx_installer_partners_regions ON installer_partners USING GIN (coverage_regions);
