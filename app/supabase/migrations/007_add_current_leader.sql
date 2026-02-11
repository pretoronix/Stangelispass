-- Migration: 007_add_current_leader.sql

-- Add a column to track the current leader for an event
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS current_leader UUID REFERENCES public.users(id);

-- Optionally initialize current_leader for existing events (leave null)
