-- Add alicuota column to profiles table
-- This represents the percentage of participation in common expenses (e.g., 2.50 for 2.5%)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS alicuota numeric(5,2) DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN public.profiles.alicuota IS 'Percentage of participation in common expenses (0-100)';
