# Release Checklist (Producción)

## 0) Antes de tocar producción
- [ ] Si hay cambios DB: están en un script SQL versionado (ej: `supabase/migrations/...`)
- [ ] Confirmar que el cambio es compatible con datos existentes (backfill si aplica)

## 1) Validación DB (Supabase)
### Relaciones (PostgREST)
Ejecutar y verificar que existan FKs:
- `reservations.user_id -> profiles.id`
- `reservations.unit_id -> units.id` (si aplica)
- `reservations.amenity_id -> amenities.id` (si aplica)

### RLS
- [ ] `reservations` tiene `SELECT` permitido para admin autenticado.

## 2) Smoke test Runtime (Vercel)
- [ ] Login admin
- [ ] Dashboard carga sin errores
- [ ] Gestión de Reservas carga:
  - [ ] Lista o vacío correcto
  - [ ] Network 200 (sin 400 de relationship)

## 3) Rollback
- [ ] Si el cambio es solo FE: revert commit y redeploy
- [ ] Si hay DB: tener script de rollback o plan (deshabilitar feature / revert policies)

Créditos: Rockwell Harrison Hernández + Spark
