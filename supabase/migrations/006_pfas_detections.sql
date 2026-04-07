CREATE TABLE IF NOT EXISTS pfas_detections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sampling_point_id     TEXT NOT NULL,
  sampling_point_label  TEXT NOT NULL,
  lat                   REAL NOT NULL,
  lng                   REAL NOT NULL,
  city                  TEXT NOT NULL,
  region                TEXT NOT NULL,
  compound              TEXT NOT NULL,
  determinand_notation  TEXT NOT NULL,
  value                 REAL NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 'µg/L',
  sample_date           DATE NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sampling_point_id, determinand_notation, sample_date)
);

CREATE INDEX IF NOT EXISTS idx_pfas_city ON pfas_detections (city);
CREATE INDEX IF NOT EXISTS idx_pfas_date ON pfas_detections (sample_date DESC);
CREATE INDEX IF NOT EXISTS idx_pfas_compound ON pfas_detections (compound);
CREATE INDEX IF NOT EXISTS idx_pfas_point ON pfas_detections (sampling_point_id);
