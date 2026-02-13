-- Migration: 014_add_beer_price_to_events.sql
-- Add beer_price column to events table for configurable pricing per event

-- Add beer_price column with default value for backward compatibility.
-- NOTE: The default value (5.00) must be kept in sync with DEFAULT_BEER_PRICE
-- in app/src/utils/costCalculator.ts.
ALTER TABLE events ADD COLUMN IF NOT EXISTS beer_price DECIMAL(10, 2) DEFAULT 5.00;

-- Add check constraint to ensure price is positive
ALTER TABLE events ADD CONSTRAINT beer_price_positive CHECK (beer_price > 0);

-- Comment for documentation
COMMENT ON COLUMN events.beer_price IS 'Price per beer in CHF for this event (default: 5.00). Keep in sync with DEFAULT_BEER_PRICE in app/src/utils/costCalculator.ts';
