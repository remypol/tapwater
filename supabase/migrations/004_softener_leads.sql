CREATE TABLE IF NOT EXISTS softener_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  postcode_district TEXT NOT NULL,
  hardness_value   REAL,
  hardness_label   TEXT,
  source           TEXT NOT NULL DEFAULT 'postcode_page',
  status           TEXT NOT NULL DEFAULT 'new',
  forwarded_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_softener_leads_status ON softener_leads (status);
CREATE INDEX IF NOT EXISTS idx_softener_leads_created ON softener_leads (created_at DESC);
