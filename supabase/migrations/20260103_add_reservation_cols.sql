-- Add missing columns to reservation_types
-- We wrap this in a DO block to ensure reservation_types exists
-- This fixes migration issues if this file runs before phase4_schema in some environments
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reservation_types') THEN
        ALTER TABLE reservation_types
        ADD COLUMN IF NOT EXISTS rules TEXT,
        ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
