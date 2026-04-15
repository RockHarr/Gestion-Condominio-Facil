-- ROBUST FK FIX (Handling Orphans)
-- 1. Identify and Fix Orphans (Set to NULL)
-- This prevents the "insert or update on table violates foreign key constraint" error
UPDATE public.reservations
SET user_id = NULL
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM public.profiles);

-- 2. Create Foreign Key Constraint (Safe Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservations_user_id_fkey' 
        AND table_name = 'reservations'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT reservations_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Reload PostgREST Cache
NOTIFY pgrst, 'reload config';
