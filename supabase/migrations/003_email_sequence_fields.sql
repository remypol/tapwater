-- Add email drip sequence fields to subscribers
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS water_data_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS last_email_sent INTEGER,
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

-- Index for cron job query efficiency
CREATE INDEX IF NOT EXISTS idx_subscribers_email_sequence
  ON subscribers (verified, unsubscribed, last_email_sent)
  WHERE verified = true AND unsubscribed = false;
