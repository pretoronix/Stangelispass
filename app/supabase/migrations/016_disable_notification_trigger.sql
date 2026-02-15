-- Migration: 016_disable_notification_trigger.sql
-- Purpose: Remove fragile DB->HTTP trigger; notifications are processed by a scheduled Edge Function instead.

DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;
DROP FUNCTION IF EXISTS public.trigger_process_notifications();

