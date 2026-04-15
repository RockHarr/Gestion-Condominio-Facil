-- RESTORE FOREIGN KEY: reservations -> profiles
-- The error "PGRST200" means the API cannot join these tables because the Foreign Key is missing.

DO $$
BEGIN
    -- Check if constraint exists, if not create it
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
        ON DELETE CASCADE;
    END IF;
END $$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';
