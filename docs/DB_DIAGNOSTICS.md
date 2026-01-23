# Diagnóstico express: Reservas

## A) ¿Hay datos?
```sql
select id, amenity_id, status, start_at, user_id, unit_id
from public.reservations
order by id desc
limit 20;

B) ¿Hay datos + joins sanos?
select 
  r.id, r.amenity_id, r.status, r.start_at,
  p.nombre as user_name,
  u.name as unit_name
from public.reservations r
left join public.profiles p on r.user_id = p.id
left join public.units u on r.unit_id = u.id
order by r.id desc
limit 20;

C) ¿RLS está activo?
select tablename, rowsecurity
from pg_tables
where tablename in ('reservations','profiles','units','amenities');

D) Si el Frontend muestra 400 "relationship not found"

=> Falta FK real o el query embebido apunta a la tabla equivocada.
Solución: crear FK o ajustar el .select().

Créditos: Rockwell Harrison Hernández + Spark
