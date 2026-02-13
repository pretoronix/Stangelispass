-- Comments System Migration
-- Enables social commenting on beer logs

-- Enable UUID extension if not already enabled (using pgcrypto which is standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing table if it has errors
DROP TABLE IF EXISTS comments CASCADE;

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beer_id UUID NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
    CONSTRAINT valid_beer_id CHECK (beer_id IS NOT NULL),
    CONSTRAINT valid_user_id CHECK (user_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_beer_id ON comments(beer_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_composite ON comments(beer_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view comments (since beers are visible to event members)
CREATE POLICY "Anyone can view comments"
    ON comments FOR SELECT
    USING (true);

-- Users can create comments (we'll rely on app logic for event membership)
CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (true);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ));

-- Users can delete their own comments, or admins can delete any
CREATE POLICY "Users can delete own comments or admins can delete any"
    ON comments FOR DELETE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ));

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();

-- Add comment for documentation
COMMENT ON TABLE comments IS 'User comments on beer logs';
COMMENT ON COLUMN comments.text IS 'Comment text, max 500 characters';
COMMENT ON COLUMN comments.beer_id IS 'Reference to the beer being commented on';
COMMENT ON COLUMN comments.user_id IS 'User who created the comment';
