-- Add missing columns to reservation_types
ALTER TABLE reservation_types 
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;
