-- Migration: 002_api_views.sql
-- Create api schema and views mapping to public tables so PostgREST can find api.*

CREATE SCHEMA IF NOT EXISTS api;

CREATE OR REPLACE VIEW api.users AS SELECT * FROM public.users;
CREATE OR REPLACE VIEW api.beers AS SELECT * FROM public.beers;
CREATE OR REPLACE VIEW api.events AS SELECT * FROM public.events;
CREATE OR REPLACE VIEW api.achievements AS SELECT * FROM public.achievements;
CREATE OR REPLACE VIEW api.wall_of_fame AS SELECT * FROM public.wall_of_fame;
CREATE OR REPLACE VIEW api.toasts AS SELECT * FROM public.toasts;

-- Grant usage/select on api schema to anon role (optional, makes views visible)
GRANT USAGE ON SCHEMA api TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO anon, authenticated;
