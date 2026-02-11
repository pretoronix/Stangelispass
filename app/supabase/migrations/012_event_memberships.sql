-- Migration: 012_event_memberships.sql
-- Adds event-scoped membership roles for permissions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.event_memberships (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'removed')),
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_memberships_event_id ON public.event_memberships(event_id);
CREATE INDEX IF NOT EXISTS idx_event_memberships_user_id ON public.event_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_event_memberships_role ON public.event_memberships(role);

ALTER TABLE public.event_memberships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_memberships'
      AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
      ON public.event_memberships
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_memberships TO anon, authenticated;

-- Ensure event creator always becomes owner for that event.
CREATE OR REPLACE FUNCTION public.ensure_event_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.event_memberships(event_id, user_id, role, status, invited_by, joined_at)
    VALUES (NEW.id, NEW.created_by, 'owner', 'active', NEW.created_by, now())
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET role = 'owner', status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_event_owner_membership_trigger ON public.events;
CREATE TRIGGER ensure_event_owner_membership_trigger
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE PROCEDURE public.ensure_event_owner_membership();

-- Backfill owners for existing events.
INSERT INTO public.event_memberships(event_id, user_id, role, status, invited_by, joined_at)
SELECT e.id, e.created_by, 'owner', 'active', e.created_by, e.created_at
FROM public.events e
WHERE e.created_by IS NOT NULL
ON CONFLICT (event_id, user_id)
DO UPDATE SET role = 'owner', status = 'active';

-- Add to realtime publication if available.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime'
        AND c.relname = 'event_memberships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_memberships;
  END IF;
END$$;
