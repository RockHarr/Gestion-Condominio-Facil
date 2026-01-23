-- DIAGNOSTIC SCRIPT
-- Run this in the Supabase SQL Editor to see what is actually in the table.

SELECT 
    r.id,
    r.amenity_id,
    r.status,
    r.start_at,
    p.nombre as user_name,
    u.name as unit_name
FROM public.reservations r
LEFT JOIN public.profiles p ON r.user_id = p.id
LEFT JOIN public.units u ON r.unit_id = u.id
ORDER BY r.id DESC
LIMIT 5;

-- Also check RLS Status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'reservations';
