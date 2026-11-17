-- Installer marketplace: installers pick postcode areas, get their first leads
-- free, then buy lead credits by card. Every hand-over of a homeowner's details
-- is recorded in lead_deliveries.

ALTER TABLE installer_partners
  ADD COLUMN IF NOT EXISTS coverage_areas TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lead_credits   INTEGER NOT NULL DEFAULT 3 CHECK (lead_credits >= 0),
  ADD COLUMN IF NOT EXISTS access_token   TEXT,
  ADD COLUMN IF NOT EXISTS approved_at    TIMESTAMPTZ;

-- The original table required a region list; the signup now asks for postcode areas.
ALTER TABLE installer_partners ALTER COLUMN coverage_regions SET DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_installer_partners_areas ON installer_partners USING GIN (coverage_areas);

CREATE TABLE IF NOT EXISTS lead_deliveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES softener_leads (id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES installer_partners (id) ON DELETE CASCADE,
  -- 'sent': contact details emailed, one credit used.
  -- 'withheld': partner had no credits; only the district and hardness were shown.
  status      TEXT NOT NULL CHECK (status IN ('sent', 'withheld')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at     TIMESTAMPTZ,
  UNIQUE (lead_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_deliveries_partner ON lead_deliveries (partner_id, status);

CREATE TABLE IF NOT EXISTS partner_credit_purchases (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id         UUID NOT NULL REFERENCES installer_partners (id) ON DELETE CASCADE,
  credits            INTEGER NOT NULL CHECK (credits > 0),
  amount_pence       INTEGER NOT NULL,
  -- Unique so a webhook Stripe retries cannot add the same credits twice.
  stripe_session_id  TEXT NOT NULL UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only the server (service role) touches these tables.
ALTER TABLE lead_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Take one credit, or report that there was none to take. One statement, so two
-- leads arriving together cannot both spend the last credit.
CREATE OR REPLACE FUNCTION consume_partner_credit(p_partner UUID)
RETURNS BOOLEAN
LANGUAGE sql
SET search_path = public
AS $$
  WITH spent AS (
    UPDATE installer_partners
       SET lead_credits = lead_credits - 1
     WHERE id = p_partner AND lead_credits > 0 AND status = 'active'
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM spent);
$$;

CREATE OR REPLACE FUNCTION add_partner_credits(p_partner UUID, p_credits INTEGER)
RETURNS INTEGER
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE installer_partners
     SET lead_credits = lead_credits + p_credits
   WHERE id = p_partner
  RETURNING lead_credits;
$$;

REVOKE EXECUTE ON FUNCTION consume_partner_credit(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION add_partner_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
