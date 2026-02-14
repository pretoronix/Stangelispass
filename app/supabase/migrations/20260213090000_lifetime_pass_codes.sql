-- Lifetime Pass Codes
-- Enables app owners to issue free lifetime pass codes to colleagues

ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_pass BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_pass_granted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_pass_code TEXT;

CREATE TABLE IF NOT EXISTS lifetime_pass_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifetime_pass_codes_code ON lifetime_pass_codes(code);
CREATE INDEX IF NOT EXISTS idx_lifetime_pass_codes_redeemed_by ON lifetime_pass_codes(redeemed_by);

ALTER TABLE lifetime_pass_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'lifetime_pass_codes') THEN
      CREATE POLICY "Public Access" ON lifetime_pass_codes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'lifetime_pass_codes'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE lifetime_pass_codes';
    END IF;
  END IF;
END$$;

COMMENT ON TABLE lifetime_pass_codes IS 'Owner-issued codes that grant lifetime passes';
COMMENT ON COLUMN lifetime_pass_codes.code IS 'Redeemable lifetime pass code';
