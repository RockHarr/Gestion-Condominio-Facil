-- Re-add the exclusion constraint to confirm if it causes the hang
ALTER TABLE reservations
ADD CONSTRAINT no_overlap_reservations
EXCLUDE USING GIST (
    amenity_id WITH =,
    tstzrange(start_at, end_at) WITH &&
)
WHERE (status IN ('REQUESTED', 'APPROVED_PENDING_PAYMENT', 'CONFIRMED') OR is_system = TRUE);
