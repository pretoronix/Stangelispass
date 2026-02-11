-- Migration: 010_profile_and_beer_stamps.sql
-- Purpose: backfill schema changes introduced after initial rollout without
-- editing previously-applied migrations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- User profile fields used by BAC calculation UI.
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION DEFAULT 80.0,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'neutral';

-- One-time QR stamp redemptions (+1 beer) per event.
CREATE TABLE IF NOT EXISTS public.beer_stamps (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  consumed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beer_stamps_event_consumed
  ON public.beer_stamps(event_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_beer_stamps_expires_at
  ON public.beer_stamps(expires_at);

ALTER TABLE IF EXISTS public.beer_stamps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'beer_stamps'
      AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
      ON public.beer_stamps
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beer_stamps TO anon, authenticated;

-- Keep Realtime feed aligned with stamp scans.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime'
        AND c.relname = 'beer_stamps'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beer_stamps;
  END IF;
END
$$;
