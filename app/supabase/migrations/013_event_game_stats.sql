-- Migration: 013_event_game_stats.sql
-- Adds event-scoped competitive stats (points, streaks, leader tracking).

CREATE TABLE IF NOT EXISTS public.event_game_stats (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  beer_count INT DEFAULT 0,
  points INT DEFAULT 0,
  streak_count INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_beer_at TIMESTAMPTZ,
  lead_changes INT DEFAULT 0,
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_game_stats_event_id
  ON public.event_game_stats(event_id);

CREATE INDEX IF NOT EXISTS idx_event_game_stats_event_points
  ON public.event_game_stats(event_id, points DESC);

CREATE TABLE IF NOT EXISTS public.event_leader_state (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  beer_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_leader_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_game_stats'
      AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
      ON public.event_game_stats
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_leader_state'
      AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
      ON public.event_leader_state
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_game_stats TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_leader_state TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_event_game_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior_last TIMESTAMPTZ;
  prior_streak INT;
  next_streak INT;
  streak_bonus INT;
  leader_rec RECORD;
  current_leader RECORD;
BEGIN
  IF NEW.event_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.event_game_stats(event_id, user_id)
  VALUES (NEW.event_id, NEW.user_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  SELECT last_beer_at, streak_count
    INTO prior_last, prior_streak
  FROM public.event_game_stats
  WHERE event_id = NEW.event_id
    AND user_id = NEW.user_id
  FOR UPDATE;

  IF prior_last IS NULL OR NEW.created_at IS NULL THEN
    next_streak := 1;
  ELSIF NEW.created_at - prior_last <= interval '30 minutes' THEN
    next_streak := COALESCE(prior_streak, 0) + 1;
  ELSE
    next_streak := 1;
  END IF;

  streak_bonus := CASE
    WHEN next_streak = 3 THEN 1
    WHEN next_streak = 5 THEN 2
    WHEN next_streak = 7 THEN 3
    ELSE 0
  END;

  UPDATE public.event_game_stats
  SET beer_count = beer_count + 1,
      points = points + 1 + streak_bonus,
      streak_count = next_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), next_streak),
      last_beer_at = COALESCE(NEW.created_at, NOW())
  WHERE event_id = NEW.event_id
    AND user_id = NEW.user_id;

  SELECT user_id, points, beer_count, last_beer_at
    INTO leader_rec
  FROM public.event_game_stats
  WHERE event_id = NEW.event_id
  ORDER BY points DESC, beer_count DESC, last_beer_at ASC NULLS LAST
  LIMIT 1;

  IF leader_rec.user_id IS NOT NULL THEN
    SELECT user_id, beer_count
      INTO current_leader
    FROM public.event_leader_state
    WHERE event_id = NEW.event_id;

    IF current_leader.user_id IS NULL OR current_leader.user_id <> leader_rec.user_id THEN
      UPDATE public.event_game_stats
      SET lead_changes = lead_changes + 1,
          points = points + 3
      WHERE event_id = NEW.event_id
        AND user_id = leader_rec.user_id;
    END IF;

    INSERT INTO public.event_leader_state(event_id, user_id, beer_count, updated_at)
    VALUES (NEW.event_id, leader_rec.user_id, leader_rec.beer_count, NOW())
    ON CONFLICT (event_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      beer_count = EXCLUDED.beer_count,
      updated_at = EXCLUDED.updated_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_event_game_stats ON public.beers;
CREATE TRIGGER trigger_update_event_game_stats
AFTER INSERT ON public.beers
FOR EACH ROW
EXECUTE PROCEDURE public.update_event_game_stats();

-- Backfill points and beer counts for existing events (streaks will rebuild going forward).
INSERT INTO public.event_game_stats(event_id, user_id, beer_count, points, last_beer_at)
SELECT event_id,
       user_id,
       COUNT(*)::INT AS beer_count,
       COUNT(*)::INT AS points,
       MAX(created_at) AS last_beer_at
FROM public.beers
WHERE event_id IS NOT NULL
GROUP BY event_id, user_id
ON CONFLICT (event_id, user_id)
DO UPDATE SET
  beer_count = EXCLUDED.beer_count,
  points = EXCLUDED.points,
  last_beer_at = EXCLUDED.last_beer_at;

INSERT INTO public.event_leader_state(event_id, user_id, beer_count, updated_at)
SELECT event_id, user_id, beer_count, NOW()
FROM (
  SELECT event_id,
         user_id,
         beer_count,
         ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY points DESC, beer_count DESC, last_beer_at ASC NULLS LAST) AS rn
  FROM public.event_game_stats
) ranked
WHERE rn = 1
ON CONFLICT (event_id)
DO UPDATE SET
  user_id = EXCLUDED.user_id,
  beer_count = EXCLUDED.beer_count,
  updated_at = EXCLUDED.updated_at;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime'
        AND c.relname = 'event_game_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_game_stats;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime'
        AND c.relname = 'event_leader_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_leader_state;
  END IF;
END$$;
