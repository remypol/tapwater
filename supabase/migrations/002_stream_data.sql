-- ============================================================
-- Stream Water Data Portal integration
-- ============================================================

-- Postcode-to-LSOA mapping (seeded from ONS NSPL)
CREATE TABLE IF NOT EXISTS postcode_lsoa (
  postcode    TEXT NOT NULL PRIMARY KEY,  -- full postcode: 'DE21 4AA'
  lsoa_code   TEXT NOT NULL,              -- 'E01013062'
  lsoa_name   TEXT                        -- 'Derby 001A'
);

CREATE INDEX IF NOT EXISTS idx_postcode_lsoa_lsoa
  ON postcode_lsoa (lsoa_code);

-- Functional index for postcode district prefix lookups
-- Extracts the district part (everything before the space)
CREATE INDEX IF NOT EXISTS idx_postcode_lsoa_district
  ON postcode_lsoa (split_part(postcode, ' ', 1));

-- Update drinking_water_readings source constraint to allow 'stream_portal'
ALTER TABLE drinking_water_readings
  DROP CONSTRAINT IF EXISTS drinking_water_readings_source_check;

ALTER TABLE drinking_water_readings
  ADD CONSTRAINT drinking_water_readings_source_check
  CHECK (source IN ('dwi_annual', 'company_scrape', 'stream_portal'));

-- Add new columns to page_data for dual-layer data
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'ea-only';
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS drinking_water_readings JSONB;
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS sample_count INTEGER DEFAULT 0;
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS date_range_from DATE;
ALTER TABLE page_data ADD COLUMN IF NOT EXISTS date_range_to DATE;
