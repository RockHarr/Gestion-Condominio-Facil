-- Fix missing foreign key on reservations table to allow joining with profiles
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;

ALTER TABLE reservations
ADD CONSTRAINT reservations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
