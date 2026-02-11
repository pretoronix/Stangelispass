-- 009_notifications_queue.sql
-- Create a durable notifications queue and trigger to enqueue leader changes

-- Table to hold notifications (queue)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  previous_leader uuid,
  new_leader uuid,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamptz,
  attempts int DEFAULT 0
);

-- Grant minimal privileges to authenticated/anon as needed (adjust to your security posture)
GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.notifications TO anon;

-- Function to enqueue a leader change when events.current_leader changes
CREATE OR REPLACE FUNCTION public.enqueue_leader_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enqueue if leader actually changed
  IF TG_OP = 'UPDATE' AND (OLD.current_leader IS DISTINCT FROM NEW.current_leader) THEN
    INSERT INTO public.notifications (event_id, previous_leader, new_leader, payload)
    VALUES (NEW.id, OLD.current_leader, NEW.current_leader, jsonb_build_object('event_id', NEW.id, 'old', OLD.current_leader, 'new', NEW.current_leader));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to run after update on events
DROP TRIGGER IF EXISTS enqueue_leader_change_trigger ON public.events;
CREATE TRIGGER enqueue_leader_change_trigger
AFTER UPDATE OF current_leader ON public.events
FOR EACH ROW
WHEN (OLD.current_leader IS DISTINCT FROM NEW.current_leader)
EXECUTE PROCEDURE public.enqueue_leader_change();
