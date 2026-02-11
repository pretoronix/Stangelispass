-- Migration: 003_api_instead_of_triggers.sql
-- Create INSTEAD OF INSERT triggers on api views to forward writes to public tables

CREATE OR REPLACE FUNCTION api.users_insert_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (name, is_admin, subscription_tier, created_at)
  VALUES (NEW.name, COALESCE(NEW.is_admin, false), COALESCE(NEW.subscription_tier, 'pilsner'), COALESCE(NEW.created_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS users_insert_instead ON api.users;
CREATE TRIGGER users_insert_instead INSTEAD OF INSERT ON api.users
FOR EACH ROW EXECUTE FUNCTION api.users_insert_trigger();

-- Beers
CREATE OR REPLACE FUNCTION api.beers_insert_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.beers (user_id, event_id, added_by, created_at)
  VALUES (NEW.user_id, NEW.event_id, NEW.added_by, COALESCE(NEW.created_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS beers_insert_instead ON api.beers;
CREATE TRIGGER beers_insert_instead INSTEAD OF INSERT ON api.beers
FOR EACH ROW EXECUTE FUNCTION api.beers_insert_trigger();

-- Events
CREATE OR REPLACE FUNCTION api.events_insert_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.events (name, created_by, is_active, pass_type, expires_at, created_at)
  VALUES (NEW.name, NEW.created_by, COALESCE(NEW.is_active,true), COALESCE(NEW.pass_type,'free'), NEW.expires_at, COALESCE(NEW.created_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS events_insert_instead ON api.events;
CREATE TRIGGER events_insert_instead INSTEAD OF INSERT ON api.events
FOR EACH ROW EXECUTE FUNCTION api.events_insert_trigger();

-- Achievements
CREATE OR REPLACE FUNCTION api.achievements_insert_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.achievements (user_id, badge_type, created_at)
  VALUES (NEW.user_id, NEW.badge_type, COALESCE(NEW.created_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS achievements_insert_instead ON api.achievements;
CREATE TRIGGER achievements_insert_instead INSTEAD OF INSERT ON api.achievements
FOR EACH ROW EXECUTE FUNCTION api.achievements_insert_trigger();

-- Wall of fame
CREATE OR REPLACE FUNCTION api.wall_of_fame_insert_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wall_of_fame (event_id, winner_id, total_stängeli, image_url, created_at)
  VALUES (NEW.event_id, NEW.winner_id, COALESCE(NEW.total_stängeli,0), NEW.image_url, COALESCE(NEW.created_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS wall_of_fame_insert_instead ON api.wall_of_fame;
CREATE TRIGGER wall_of_fame_insert_instead INSTEAD OF INSERT ON api.wall_of_fame
FOR EACH ROW EXECUTE FUNCTION api.wall_of_fame_insert_trigger();

-- Toasts
CREATE OR REPLACE FUNCTION api.toasts_insert_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.toasts (wall_id, user_id, created_at)
  VALUES (NEW.wall_id, NEW.user_id, COALESCE(NEW.created_at, now()))
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS toasts_insert_instead ON api.toasts;
CREATE TRIGGER toasts_insert_instead INSTEAD OF INSERT ON api.toasts
FOR EACH ROW EXECUTE FUNCTION api.toasts_insert_trigger();

-- Grant execute to anon/authenticated as needed
GRANT EXECUTE ON FUNCTION api.users_insert_trigger() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.beers_insert_trigger() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.events_insert_trigger() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.achievements_insert_trigger() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.wall_of_fame_insert_trigger() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.toasts_insert_trigger() TO anon, authenticated;
