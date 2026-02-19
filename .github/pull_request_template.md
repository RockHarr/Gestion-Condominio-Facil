# PR: <título corto>

## Contexto
- Problema:
- Causa raíz (si aplica):
- Solución:

## Cambios
- [ ] Frontend
- [ ] Backend / Supabase (SQL/RLS/RPC)
- [ ] Config / Env / Deploy

## Riesgos
- Qué podría romperse:
- Plan de rollback:

---

# ✅ Checklist “Blindaje” (OBLIGATORIO)

## A) Base de datos / PostgREST / Relaciones
- [ ] Si hay `.select('..., profiles(...)')` o joins embebidos: **existe relación FK** en DB (no solo “a mano”).
- [ ] FKs validadas:
  - [ ] `reservations.user_id -> public.profiles.id`
  - [ ] `reservations.unit_id -> public.units.id` (si se usa)
  - [ ] `reservations.amenity_id -> public.amenities.id` (si aplica)
- [ ] Nombres de columnas coinciden con el runtime (`start_at`, etc.) y los mappers (camelCase/snake_case) están correctos.
- [ ] Si hay RPC: probada en runtime (Network 200 + JSON esperado).

## B) RLS (Row Level Security)
- [ ] Tabla(s) afectadas tienen política(s) de `SELECT` para rol correcto:
  - [ ] admin puede leer lo que necesita
  - [ ] resident solo lo suyo (si aplica)
- [ ] Probado con usuario autenticado real (no solo SQL Editor).

## C) Frontend: datos y tolerancia a fallos
- [ ] Si falla fetch: UI muestra estado vacío/alerta y **no revienta** la vista.
- [ ] Se registran errores con contexto (endpoint/tabla) en consola (solo dev).
- [ ] No hay “infinite loading”.

## D) Smoke test rápido (ANTES de merge)
- [ ] Abrir Dashboard → no hay errores rojos en Console.
- [ ] Ir a “Gestión de Reservas”:
  - [ ] Carga lista (o muestra vacío “No hay reservas”)
  - [ ] Tabs funcionan (Pendientes/Próximas/Historial/Todas)
- [ ] Network:
  - [ ] Request `reservations` devuelve 200
  - [ ] No hay 400 con “Could not find a relationship …”

## E) Evidencias
- [ ] Screenshot de Console (sin errores) o copia del error resuelto.
- [ ] Si fue DB: SQL de migración adjunto o link al script.

---

## Notas
- Créditos: Rockwell Harrison Hernández + Spark
