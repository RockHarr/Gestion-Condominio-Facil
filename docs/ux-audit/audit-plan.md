# UX Audit Plan — Gestión Condominio Fácil

## 1. Alcance
Auditoría de Experiencia de Usuario (UX) enfocada en el MVP del sistema "Gestión Condominio Fácil".
El objetivo es identificar fricciones, errores y áreas de mejora para asegurar un piloto exitoso.

### Roles y Escenarios
*   **Residente**: Uso móvil/desktop para tareas cotidianas (pagos, reservas, tickets).
*   **Administrador**: Gestión operativa del condominio (pagos, unidades, comunicación).

## 2. Metodología
Se utilizarán 3 lentes de evaluación en paralelo:

1.  **Heurísticas (Nielsen 10)**: Evaluación de principios generales de usabilidad (consistencia, visibilidad del estado, control del usuario, prevención de errores, etc.).
2.  **Cognitive Walkthrough (Paso a paso)**: Simulación de tareas críticas preguntando: "¿El usuario sabe qué hacer en este paso?", "¿El sistema da feedback claro?".
3.  **Accesibilidad Base (WCAG AA "Lite")**: Verificación rápida de:
    *   Foco visible en navegación por teclado.
    *   Contraste de colores.
    *   Etiquetas (labels) en formularios.
    *   Estados de error y feedback.

## 3. Definición de Severidad
Se utilizará la siguiente rúbrica para clasificar los hallazgos:

*   **High (Bloqueante)**: Impide completar una tarea clave o genera errores frecuentes/datos incorrectos. Requiere corrección inmediata antes del piloto.
*   **Medium (Fricción)**: La tarea se puede completar, pero con confusión, pasos extra o riesgo de error. Debe corregirse para mejorar la adopción.
*   **Low (Pulido)**: Mejoras de claridad, estética o consistencia. No impacta directamente el éxito de la tarea pero mejora la percepción de calidad.

### Priorización (Impacto x Esfuerzo)
*   **Quick Win**: Alto Impacto / Bajo Esfuerzo.
*   **Proyecto**: Alto Impacto / Alto Esfuerzo.
*   **Postergable**: Bajo Impacto.

## 4. Tareas Críticas a Auditar

### Residente
*   [ ] Ver estado de cuenta / deuda.
*   [ ] Pagar (o registrar pago / ver recibo).
*   [ ] Reservar (ver disponibilidad, confirmar, cancelar).
*   [ ] Votar en encuestas.
*   [ ] Crear ticket y ver estado.

### Admin
*   [ ] Crear/editar unidad y alícuota.
*   [ ] Cerrar mes (generar gasto común).
*   [ ] Registrar pago manual.
*   [ ] Gestión de reservas (aprobar, incidentes, depósito).
*   [ ] Crear encuesta y ver resultados.

## 5. Entregables
*   `audit-plan.md`: Este documento de planificación.
*   `task.md`: Checklist de ejecución.
*   `report.md`: Informe detallado de hallazgos y recomendaciones.
*   `evidence/`: Capturas de pantalla y videos de soporte.

## 6. Criterio de "Audit Completo"
El audit se considera completo cuando:
1.  Se han recorrido todas las tareas críticas.
2.  Se ha completado el checklist en `task.md`.
3.  Se ha generado el `report.md` con al menos los hallazgos de severidad High y Medium.
4.  Se ha generado una lista de "Quick Wins" para implementación inmediata.
