-- Database triggers for automatic push notification generation
-- This migration adds triggers to detect events that should trigger notifications

-- First, add current_leader column to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'current_leader'
    ) THEN
        ALTER TABLE events ADD COLUMN current_leader UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END$$;

-- Helper function to get event member IDs
CREATE OR REPLACE FUNCTION get_event_member_ids(p_event_id UUID)
RETURNS UUID[] AS $$
DECLARE
    member_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT user_id)
    INTO member_ids
    FROM beers
    WHERE event_id = p_event_id;
    
    RETURN COALESCE(member_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for leader change
CREATE OR REPLACE FUNCTION notify_leader_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the leader actually changed
    IF OLD.current_leader IS DISTINCT FROM NEW.current_leader AND NEW.current_leader IS NOT NULL THEN
        INSERT INTO notifications (event_id, target_user, payload)
        VALUES (
            NEW.id,
            NEW.current_leader,
            jsonb_build_object(
                'type', 'leader_change',
                'new_leader', NEW.current_leader,
                'old_leader', OLD.current_leader,
                'event_name', NEW.name
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on leader change in events table
DROP TRIGGER IF EXISTS on_leader_change ON events;
CREATE TRIGGER on_leader_change
AFTER UPDATE ON events
FOR EACH ROW
WHEN (OLD.current_leader IS DISTINCT FROM NEW.current_leader)
EXECUTE FUNCTION notify_leader_change();

-- Function to check for milestone notifications
CREATE OR REPLACE FUNCTION check_milestone_notification()
RETURNS TRIGGER AS $$
DECLARE
    total_count INT;
    milestone_values INT[] := ARRAY[5, 10, 20, 50, 100];
BEGIN
    -- Get total count for user in this event
    SELECT COUNT(*) INTO total_count
    FROM beers
    WHERE user_id = NEW.user_id AND event_id = NEW.event_id;
    
    -- Check if this count is a milestone
    IF total_count = ANY(milestone_values) THEN
        INSERT INTO notifications (event_id, target_user, payload)
        VALUES (
            NEW.event_id,
            NEW.user_id,
            jsonb_build_object(
                'type', 'milestone',
                'user_id', NEW.user_id,
                'milestone', total_count,
                'event_id', NEW.event_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on beer insertion for milestones
DROP TRIGGER IF EXISTS on_beer_milestone ON beers;
CREATE TRIGGER on_beer_milestone
AFTER INSERT ON beers
FOR EACH ROW
EXECUTE FUNCTION check_milestone_notification();

-- Function to automatically update event leader when beers are added/removed
CREATE OR REPLACE FUNCTION update_event_leader()
RETURNS TRIGGER AS $$
DECLARE
    v_event_id UUID;
    v_new_leader UUID;
    v_max_count INT;
BEGIN
    -- Determine which event to update
    v_event_id := COALESCE(NEW.event_id, OLD.event_id);
    
    -- Find the user with the most beers in this event
    SELECT user_id, COUNT(*) INTO v_new_leader, v_max_count
    FROM beers
    WHERE event_id = v_event_id
    GROUP BY user_id
    ORDER BY COUNT(*) DESC, MIN(created_at) ASC
    LIMIT 1;
    
    -- Update the event's current leader
    UPDATE events
    SET current_leader = v_new_leader
    WHERE id = v_event_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leader on beer changes
DROP TRIGGER IF EXISTS on_beer_update_leader ON beers;
CREATE TRIGGER on_beer_update_leader
AFTER INSERT OR DELETE ON beers
FOR EACH ROW
EXECUTE FUNCTION update_event_leader();
