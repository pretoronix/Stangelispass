-- Event pass credits and promo codes

ALTER TABLE users ADD COLUMN IF NOT EXISTS free_event_credits INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_event_credits_day INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_event_credits_weekend INTEGER DEFAULT 0;

UPDATE users SET free_event_credits = 1 WHERE free_event_credits IS NULL;
UPDATE users SET paid_event_credits_day = 0 WHERE paid_event_credits_day IS NULL;
UPDATE users SET paid_event_credits_weekend = 0 WHERE paid_event_credits_weekend IS NULL;

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('event_day', 'event_weekend', 'lifetime')),
  credits INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_redeemed_by ON promo_codes(redeemed_by);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'promo_codes') THEN
      CREATE POLICY "Public Access" ON promo_codes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'promo_codes'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE promo_codes';
    END IF;
  END IF;
END$$;

COMMENT ON TABLE promo_codes IS 'Promo codes for event credits or lifetime access';
COMMENT ON COLUMN promo_codes.type IS 'event_day, event_weekend, or lifetime';
