# UX Audit Report — Gestión Condominio Fácil (MVP)
**Equipo:** RockCode + Spark
**Fecha:** 2026-01-09
**Versión auditada:** Local Dev Environment

## 1) Resumen ejecutivo
*   **Top 3 problemas (High)**:
    1.  **Accesibilidad Crítica en Reservas**: La disponibilidad de horarios depende 100% del color (Rojo/Verde/Gris), lo que excluye a usuarios con daltonismo.
    2.  **Escalabilidad en Admin Unidades**: Falta de búsqueda o paginación. En condominios grandes, encontrar una unidad será muy lento.
    3.  **Accesibilidad en Formularios (Login)**: Uso de placeholders como única etiqueta visible en algunos campos, lo que dificulta la accesibilidad y usabilidad.

*   **Quick wins (alto impacto / bajo esfuerzo)**:
    1.  Añadir texto visible o iconos en los botones de reserva (ej: "Ocupado", "Libre").
    2.  Implementar barra de búsqueda simple en "Directorio de Unidades".
    3.  Añadir `aria-label` a botones de iconos (flechas, menús).

## 2) Hallazgos por severidad

### High (Bloqueante)
**H-01 — Dependencia de Color en Reservas**
- **Dónde:** `ReservationsScreen.tsx` (Grilla de horarios)
- **Tarea afectada:** Reservar espacio común.
- **Problema:** Los botones usan solo color (verde/rojo/gris) para indicar estado. Usuarios con deficiencia de visión de color no podrán distinguir horarios libres de ocupados.
- **Evidencia:** Código muestra clases condicionales de color sin texto de respaldo.
- **Impacto:** Bloqueante para usuarios daltónicos.
- **Recomendación:** Añadir texto dentro del botón (ej: "10:00 - Libre") o un icono distintivo.
- **Esfuerzo estimado:** S (Small)

**H-02 — Falta de Búsqueda en Unidades**
- **Dónde:** `AdminUnits.tsx`
- **Tarea afectada:** Gestionar unidades (editar/eliminar/ver pagos).
- **Problema:** Se renderizan todas las unidades en una grilla plana. Con 50+ unidades, el scroll será excesivo y la gestión ineficiente.
- **Evidencia:** `users.map` directo sin filtro de búsqueda.
- **Impacto:** Fricción alta para administradores en condominios reales.
- **Recomendación:** Añadir un input de búsqueda por "Número de Unidad" o "Nombre".
- **Esfuerzo estimado:** S (Small)

### Medium (Fricción)
**M-01 — Etiquetas de Formulario Invisibles**
- **Dónde:** `LoginScreen.tsx` y otros formularios.
- **Problema:** Se usa `sr-only` para labels y se confía en `placeholder`. Si el usuario escribe, pierde el contexto del campo.
- **Recomendación:** Hacer visibles los labels o usar patrón "floating label".

**M-02 — Navegación de Fechas Limitada**
- **Dónde:** `ReservationsScreen.tsx`
- **Problema:** Solo se puede navegar día anterior/siguiente. Reservar para "el próximo mes" requiere 30 clics.
- **Recomendación:** Implementar un selector de fecha nativo (`input type="date"`).

### Low (Pulido)
**L-01 — Checkbox de "Simulación" Visible**
- **Dónde:** `AdminDashboard.tsx` (Modal Cargar Gasto)
- **Problema:** El checkbox "Marcar como con evidencia (simulado)" es confuso para usuarios finales.
- **Recomendación:** Ocultar en producción o renombrar si es una feature real de "bypass".

## 3) Accesibilidad (check rápido)
- [x] **Foco visible**: Tailwind `focus:ring` está presente en la mayoría de inputs.
- [ ] **Contraste**: Placeholder gris claro sobre blanco podría fallar WCAG AA.
- [x] **Labels/aria**: Uso inconsistente. Algunos botones de solo icono faltan `aria-label`.
- [ ] **Navegación teclado**: El menú dropdown en `AdminUnits` podría no atrapar el foco correctamente.

## 4) Consistencia y copy
- **Terminología**: Se usa "Ticket" e "Incidente" indistintamente en el código. Unificar a "Ticket" o "Solicitud".
- **Estados**: El estado "NUEVO" en tickets es claro, pero "EN_PROCESO" usa color amarillo que a veces se asocia a "Advertencia".

## 5) Recomendaciones priorizadas (Impacto x Esfuerzo)
### Quick wins (S)
1.  **Fix Reservas**: Añadir texto/icono a slots.
2.  **Search Unidades**: Input de filtro simple.
3.  **Labels Login**: Quitar clase `sr-only` de los labels.

### Iteración 2 (M)
1.  **Date Picker**: Mejorar navegación de fechas en reservas.
2.  **Pagination**: Implementar paginación real si la lista de unidades/pagos crece mucho.

### Post-piloto (L)
1.  **Dashboard Personalizable**: Permitir al admin elegir qué métricas ver.

