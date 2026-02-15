-- Migration: 015_reconcile_notifications_table.sql
-- Purpose: Reconcile `notifications` table shape across older/newer migrations.
-- Some older migrations used a leader-change queue shape (previous_leader/new_leader),
-- while newer code expects a push queue shape (target_user/payload/processed/attempts/created_at).

-- Ensure required columns exist without dropping legacy columns.
DO $$
BEGIN
  -- Required by app/services + edge processor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'target_user'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN target_user UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'payload'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN payload JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'processed'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN processed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'attempts'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN attempts INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;
END$$;

-- Ensure indexes exist for queue processing.
CREATE INDEX IF NOT EXISTS idx_notifications_processed ON public.notifications(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON public.notifications(target_user);

-- Ensure RLS and a permissive dev policy exist (consistent with existing schema posture).
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public Access' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Public Access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

