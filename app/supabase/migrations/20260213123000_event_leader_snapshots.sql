-- Migration: 20260213123000_event_leader_snapshots.sql
-- Stores snapshots of event leaders for awards/history.

CREATE TABLE IF NOT EXISTS public.event_leader_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  leader_beer_count INT DEFAULT 0,
  leader_points INT DEFAULT 0,
  leader_last_beer_at TIMESTAMPTZ,
  leaderboard JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_leader_snapshots_event_id
  ON public.event_leader_snapshots(event_id);

CREATE INDEX IF NOT EXISTS idx_event_leader_snapshots_snapshot_at
  ON public.event_leader_snapshots(snapshot_at DESC);

ALTER TABLE public.event_leader_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_leader_snapshots'
      AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
      ON public.event_leader_snapshots
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_leader_snapshots TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime'
        AND c.relname = 'event_leader_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_leader_snapshots;
  END IF;
END$$;
