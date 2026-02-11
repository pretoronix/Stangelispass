-- Stängelispass Database Schema
-- Migration: 001_init.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'pilsner', -- 'pilsner' (free) or 'craft' (premium)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure name is unique for ON CONFLICT logic (with data-preserving cleanup)
DO $$
DECLARE
    r RECORD;
    master_id UUID;
BEGIN
    -- 1. Identify and merge duplicates (preserving history)
    FOR r IN (SELECT name FROM users GROUP BY name HAVING COUNT(*) > 1) LOOP
        -- Pick the oldest record as the master
        SELECT id INTO master_id FROM users WHERE name = r.name ORDER BY created_at ASC LIMIT 1;
        
        -- Reassign references in all tables
        UPDATE beers SET user_id = master_id WHERE user_id IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        UPDATE beers SET added_by = master_id WHERE added_by IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
            UPDATE events SET created_by = master_id WHERE created_by IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        END IF;
        
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
            UPDATE achievements SET user_id = master_id WHERE user_id IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wall_of_fame') THEN
            UPDATE wall_of_fame SET winner_id = master_id WHERE winner_id IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'toasts') THEN
            UPDATE toasts SET user_id = master_id WHERE user_id IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        END IF;
        
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'beer_stamps') THEN
            UPDATE beer_stamps SET user_id = master_id WHERE user_id IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
            UPDATE beer_stamps SET issued_by = master_id WHERE issued_by IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
            UPDATE beer_stamps SET consumed_by = master_id WHERE consumed_by IN (SELECT id FROM users WHERE name = r.name AND id <> master_id);
        END IF;
        
        -- Delete duplicates (now safe because FKs are reassigned or handled)
        DELETE FROM users WHERE name = r.name AND id <> master_id;
    END LOOP;

    -- 2. Apply Unique Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_name_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_name_unique UNIQUE (name);
    END IF;
END$$;

-- 2. Events table (Lifecycle tracking)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  pass_type TEXT DEFAULT 'free',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Beers table (Central logging)
CREATE TABLE IF NOT EXISTS beers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist for migration/idempotency
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'pilsner';
ALTER TABLE beers ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- 4. Achievements table (Gamification)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Wall of Fame (Historical Wins)
CREATE TABLE IF NOT EXISTS wall_of_fame (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_stängeli INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Toasts (Social Reactions)
CREATE TABLE IF NOT EXISTS toasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wall_id UUID REFERENCES wall_of_fame(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Beer Stamps (One-time redeemable +1 beer QR)
CREATE TABLE IF NOT EXISTS beer_stamps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  consumed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- PERFORMANCE INDEXING ---
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_beers_user_event ON beers(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_beers_created_at ON beers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user_badge ON achievements(user_id, badge_type);
CREATE INDEX IF NOT EXISTS idx_wall_event ON wall_of_fame(event_id);
CREATE INDEX IF NOT EXISTS idx_beer_stamps_event_consumed ON beer_stamps(event_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_beer_stamps_expires_at ON beer_stamps(expires_at);

-- --- SECURITY (RLS) ---
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_of_fame ENABLE ROW LEVEL SECURITY;
ALTER TABLE toasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE beer_stamps ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Helper
DO $$
BEGIN
    -- Public Access Policies (Development/Public Mode)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'users') THEN
        CREATE POLICY "Public Access" ON users FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'beers') THEN
        CREATE POLICY "Public Access" ON beers FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'events') THEN
        CREATE POLICY "Public Access" ON events FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'achievements') THEN
        CREATE POLICY "Public Access" ON achievements FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'wall_of_fame') THEN
        CREATE POLICY "Public Access" ON wall_of_fame FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'toasts') THEN
        CREATE POLICY "Public Access" ON toasts FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'beer_stamps') THEN
        CREATE POLICY "Public Access" ON beer_stamps FOR ALL USING (true) WITH CHECK (true);
    END IF;
END$$;

-- --- REALTIME ENABLEMENT ---
DO $$
DECLARE
  tab RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR tab IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'beers', 'events', 'achievements', 'wall_of_fame', 'toasts', 'beer_stamps'))
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON pr.prrelid = c.oid
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = tab.tablename
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tab.tablename);
      END IF;
    END LOOP;
  END IF;
END$$;

-- --- INITIAL DATA ---
INSERT INTO users (name, is_admin, subscription_tier) 
VALUES ('Admin', true, 'craft') 
ON CONFLICT (name) DO UPDATE SET is_admin = true, subscription_tier = 'craft';
