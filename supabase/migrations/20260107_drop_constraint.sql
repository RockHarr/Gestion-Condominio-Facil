-- Drop the exclusion constraint to see if it unblocks the RPC
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS no_overlap_reservations;
