-- Semillas para Fase 4 (Amenities & Reservation Types)

-- 1. Insertar Amenities
INSERT INTO public.amenities (name, description, capacity, photo_url)
VALUES 
('Quincho Central', 'Espacio para asados con parrilla y mesas.', 20, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000'),
('Sala de Eventos', 'Salón multiuso para celebraciones y reuniones.', 50, 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000'),
('Piscina', 'Piscina al aire libre (temporada verano).', 15, 'https://images.unsplash.com/photo-1572331165267-854da2b00ca1?auto=format&fit=crop&q=80&w=1000')
ON CONFLICT (id) DO NOTHING; -- Assuming ID won't conflict if auto-generated, but good practice if hardcoding IDs.
-- Note: schema uses IDENTITY, so we let it auto-gen.

-- 2. Insertar Reservation Types (Reglas de precio)
-- Necesitamos los IDs de los amenities. Como son auto-gen, usamos sub-selects.

WITH q AS (SELECT id FROM amenities WHERE name = 'Quincho Central' LIMIT 1),
     s AS (SELECT id FROM amenities WHERE name = 'Sala de Eventos' LIMIT 1),
     p AS (SELECT id FROM amenities WHERE name = 'Piscina' LIMIT 1)
INSERT INTO public.reservation_types (amenity_id, name, fee_amount, deposit_amount, max_duration_minutes, min_advance_hours)
VALUES
((SELECT id FROM q), 'Uso General', 15000, 30000, 240, 24),
((SELECT id FROM s), 'Evento Completo', 50000, 100000, 360, 48),
((SELECT id FROM p), 'Turno Mañana', 0, 0, 180, 0);

-- 3. Asegurar que existan algunas Unidades (si users/profiles están vacíos)
INSERT INTO public.units (name, alicuota)
VALUES 
('101', 1.5), ('102', 1.5), ('201', 2.0), ('202', 2.0)
ON CONFLICT (name) DO NOTHING;
