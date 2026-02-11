-- Migration: 011_notification_prefs_and_milestones.sql
-- Adds per-user notification preferences and milestone queueing.

-- Per-user notification settings
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb
  DEFAULT jsonb_build_object(
    'leader_change', true,
    'milestones', jsonb_build_array(5, 10, 20)
  );

UPDATE public.users
SET notification_prefs = jsonb_build_object(
  'leader_change', true,
  'milestones', jsonb_build_array(5, 10, 20)
)
WHERE notification_prefs IS NULL;

-- Generalize queue rows to any target user (leader-change or milestone)
ALTER TABLE IF EXISTS public.notifications
  ADD COLUMN IF NOT EXISTS target_user uuid REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_processed_created_at
  ON public.notifications(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user
  ON public.notifications(target_user);

-- Ensure leader-change notifications have type metadata and recipient
CREATE OR REPLACE FUNCTION public.enqueue_leader_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.current_leader IS DISTINCT FROM NEW.current_leader) THEN
    INSERT INTO public.notifications (event_id, previous_leader, new_leader, target_user, payload)
    VALUES (
      NEW.id,
      OLD.current_leader,
      NEW.current_leader,
      NEW.current_leader,
      jsonb_build_object(
        'type', 'leader_change',
        'event_id', NEW.id,
        'old', OLD.current_leader,
        'new', NEW.current_leader
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enqueue_leader_change_trigger ON public.events;
CREATE TRIGGER enqueue_leader_change_trigger
AFTER UPDATE OF current_leader ON public.events
FOR EACH ROW
WHEN (OLD.current_leader IS DISTINCT FROM NEW.current_leader)
EXECUTE PROCEDURE public.enqueue_leader_change();

-- Enqueue notifications when a participant reaches milestone counts in an event
CREATE OR REPLACE FUNCTION public.enqueue_beer_milestone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  event_beer_count integer;
BEGIN
  IF NEW.event_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::int
    INTO event_beer_count
  FROM public.beers
  WHERE user_id = NEW.user_id
    AND event_id = NEW.event_id;

  IF event_beer_count IN (5, 10, 20) THEN
    INSERT INTO public.notifications (event_id, target_user, payload)
    VALUES (
      NEW.event_id,
      NEW.user_id,
      jsonb_build_object(
        'type', 'milestone',
        'event_id', NEW.event_id,
        'user_id', NEW.user_id,
        'milestone', event_beer_count
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enqueue_beer_milestone_trigger ON public.beers;
CREATE TRIGGER enqueue_beer_milestone_trigger
AFTER INSERT ON public.beers
FOR EACH ROW
EXECUTE PROCEDURE public.enqueue_beer_milestone();
