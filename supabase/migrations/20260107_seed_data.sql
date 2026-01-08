-- Seed Amenities
INSERT INTO amenities (name, description, capacity, photo_url)
VALUES 
('Quincho', 'Espacio para asados y eventos al aire libre', 20, 'https://images.unsplash.com/photo-1555244162-803834f70033'),
('Sala de Eventos', 'Salón multiuso para celebraciones', 50, 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3'),
('Piscina', 'Piscina temperada', 10, 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7')
ON CONFLICT DO NOTHING;

-- Seed Reservation Types
-- We need to get IDs dynamically
DO $$
DECLARE
    v_quincho_id BIGINT;
    v_sala_id BIGINT;
    v_piscina_id BIGINT;
BEGIN
    SELECT id INTO v_quincho_id FROM amenities WHERE name = 'Quincho';
    SELECT id INTO v_sala_id FROM amenities WHERE name = 'Sala de Eventos';
    SELECT id INTO v_piscina_id FROM amenities WHERE name = 'Piscina';

    IF v_quincho_id IS NOT NULL THEN
        INSERT INTO reservation_types (amenity_id, name, fee_amount, deposit_amount, max_duration_minutes, min_advance_hours)
        VALUES (v_quincho_id, 'Asado Familiar', 10000, 20000, 240, 24);
    END IF;

    IF v_sala_id IS NOT NULL THEN
        INSERT INTO reservation_types (amenity_id, name, fee_amount, deposit_amount, max_duration_minutes, min_advance_hours)
        VALUES (v_sala_id, 'Cumpleaños', 30000, 50000, 300, 48);
    END IF;

    IF v_piscina_id IS NOT NULL THEN
        INSERT INTO reservation_types (amenity_id, name, fee_amount, deposit_amount, max_duration_minutes, min_advance_hours)
        VALUES (v_piscina_id, 'Uso General', 0, 0, 60, 1);
    END IF;
END $$;

-- Ensure Units exist
INSERT INTO units (name, alicuota)
VALUES 
('101', 1.5),
('102', 1.5),
('201', 1.5)
ON CONFLICT (name) DO NOTHING;

-- Note: We cannot easily link auth.users to profiles here without knowing the UUIDs.
-- However, the application logic should handle unit assignment if the profile has 'unidad' text set.
-- The migration 20260103_phase4_schema.sql handles the linking.
-- We assume the test users have 'unidad' set in their profiles.
