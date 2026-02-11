-- Migration: 005_award_achievements.sql

-- 1) Add unique constraint on achievements (user_id, badge_type)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'achievements_user_badge_unique') THEN
    ALTER TABLE public.achievements ADD CONSTRAINT achievements_user_badge_unique UNIQUE (user_id, badge_type);
  END IF;
END$$;

-- 2) Create award function
CREATE OR REPLACE FUNCTION public.award_achievements()
RETURNS trigger AS $$
DECLARE
  user_uuid UUID := NEW.user_id;
  created timestamptz := NEW.created_at;
  badges text[] := ARRAY[]::text[];
  cnt int;
  tmp_arr timestamptz[];
BEGIN
  -- Early Bird: between 06:00 and 17:59
  IF EXTRACT(HOUR FROM created) >= 6 AND EXTRACT(HOUR FROM created) < 18 THEN
    badges := array_append(badges, 'early_bird');
  END IF;

  -- Night Owl: 02:00-05:59
  IF EXTRACT(HOUR FROM created) >= 2 AND EXTRACT(HOUR FROM created) < 6 THEN
    badges := array_append(badges, 'night_owl');
  END IF;

  -- Weekend Warrior: Fri(5) or Sat(6)
  IF EXTRACT(DOW FROM created) IN (5,6) THEN
    badges := array_append(badges, 'weekend_warrior');
  END IF;

  -- Century Club: check total beers for user (after insert)
  SELECT COUNT(*) INTO cnt FROM public.beers WHERE user_id = user_uuid;
  IF cnt = 100 THEN
    badges := array_append(badges, 'century_club');
  END IF;

  -- Hat Trick: last 3 beers within 1 hour
  SELECT array_agg(b.created_at ORDER BY b.created_at DESC) INTO tmp_arr
  FROM (
    SELECT created_at FROM public.beers WHERE user_id = user_uuid ORDER BY created_at DESC LIMIT 3
  ) b;

  IF array_length(tmp_arr,1) IS NOT NULL AND array_length(tmp_arr,1) >= 3 THEN
    IF (tmp_arr[1] - tmp_arr[3]) <= INTERVAL '1 hour' THEN
      badges := array_append(badges, 'hat_trick');
    END IF;
  END IF;

  -- First Blood: first beer in an event (if event_id present)
  IF NEW.event_id IS NOT NULL THEN
    SELECT COUNT(*) INTO cnt FROM public.beers WHERE event_id = NEW.event_id;
    IF cnt = 1 THEN
      badges := array_append(badges, 'first_blood');
    END IF;
  END IF;

  -- Dedup badges array
  badges := (SELECT ARRAY(SELECT DISTINCT UNNEST(badges)));

  -- Insert badges that don't already exist
  IF array_length(badges,1) IS NOT NULL THEN
    INSERT INTO public.achievements (user_id, badge_type)
    SELECT user_uuid, unnest(badges)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.achievements a WHERE a.user_id = user_uuid AND a.badge_type = unnest(badges)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Create trigger on public.beers AFTER INSERT
DROP TRIGGER IF EXISTS award_achievements_on_insert ON public.beers;
CREATE TRIGGER award_achievements_on_insert
AFTER INSERT ON public.beers
FOR EACH ROW EXECUTE FUNCTION public.award_achievements();

-- Grant execute to the DB role used by PostgREST (the anon role requires no EXECUTE; security definer runs as owner)
GRANT EXECUTE ON FUNCTION public.award_achievements() TO authenticated, anon;
