# UX Audit Checklist — Gestión Condominio Fácil (RockCode + Spark)

## Auth
- [x] Login (errores, estados, recordar sesión)
- [ ] Logout (visibilidad, confirmación)
- [ ] Recuperación password / magic link (copy y feedback)

## Navegación / IA
- [x] Menú residente: encuentra Reservas / Pagos / Tickets / Votos
- [x] Menú admin: encuentra Cerrar Mes / Pagos / Reservas / Unidades
- [ ] Breadcrumbs o contexto (¿dónde estoy?)

## Residente
- [x] Home / Dashboard: estado claro (deuda, avisos, reservas)
- [x] Reservas: ver disponibilidad, solicitar, pagar cargos, cancelar
- [x] Tickets: crear, adjuntar, ver estado
- [x] Pagos: ver deuda, historial, recibos
- [ ] Votaciones: votar, ver resultados según regla

## Admin
- [x] Dashboard: métricas y accesos rápidos
- [x] Unidades: CRUD + alícuotas + validaciones
- [x] Reservas: aprobar/rechazar, system blocks, depósito, incidentes
- [x] Pagos: registro rápido, comprobante, reversa/ajuste (si aplica)
- [ ] Avisos/Encuestas: crear, publicar, cerrar anticipado

## General UX
- [x] Responsivo móvil
- [x] Accesibilidad básica (teclado, foco, labels)
- [x] Feedback (loading, success, error, empty states)
- [x] Consistencia visual y terminológica
