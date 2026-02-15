-- Enable UUID extension (fix for missing uuid_generate_v4)
-- This should have been applied in 001_init.sql but may have been skipped
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
