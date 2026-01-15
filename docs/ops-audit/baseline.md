# Baseline Operacional v1

**Fecha:** 2026-01-10
**Versión:** 1.0
**Estado:** Draft

Este documento describe el estado actual del sistema "Gestión Condominio Fácil" para servir como base de pruebas de auditoría funcional.

## 1) Fuentes de verdad (Source of Truth)

| Dominio | Fuente de Verdad (Tabla/RPC) | Modelo Heredado / Dualidad |
| :--- | :--- | :--- |
| **Deudas / Morosidad** | `common_expense_debts`, `parking_debts` | **SÍ**. Existe tabla `charges` (con tipos `COMMON_EXPENSE`, `PARKING`) pero el bloqueo de reservas usa las tablas heredadas. |
| **Cobros** | `charges` (para Reservas/Multas) | `common_expense_debts` (para Gastos Comunes). |
| **Pagos** | `payments` (Historial/Caja) | `charges.status='PAID'` (Lógica de Negocio). **Riesgo**: Dualidad. |
| **Reservas** | `reservations` | No. |
| **Depósitos** | `deposit_decisions` + `charges` | No. |
| **Incidentes** | `incidents` + `charges` | No. |
| **Votaciones** | `polls`, `poll_responses` | No. |

### Detalles Técnicos

*   **Deudas / Morosidad**:
    *   **Cálculo**: Se consulta directamente `common_expense_debts` y `parking_debts`.
    *   **Bloqueo**: RPC `request_reservation` verifica `EXISTS(... WHERE pagado = false)` en estas dos tablas.
*   **Cobros y Pagos**:
    *   **Definición de "Pago"**:
        *   Para **Reservas**: Se considera pagado cuando el registro en `charges` tiene `status='PAID'`.
        *   Para **KPIs/Dashboard**: Se considera pagado lo que está en la tabla `payments`.
    *   **Sincronización**: El servicio `confirmReservationPayment` inserta en `payments` Y actualiza `charges`. Si se paga por otro medio, podría haber desalineación.
    *   `paid_at`: Se guarda en `charges.paid_at` y `payments.fecha_pago`.
*   **Reservas**:
    *   **Relación con cobros**: `charges.reference_id` = `reservations.id` (donde `reference_type='RESERVATION'`).
    *   **Disponibilidad**: Constraint `EXCLUDE` en DB sobre `(amenity_id, tstzrange(start_at, end_at))` filtrando por estados activos (`REQUESTED`, `APPROVED_PENDING_PAYMENT`, `CONFIRMED`).
*   **Depósitos**:
    *   **Custodia**: Charge tipo `RESERVATION_DEPOSIT` en estado `PAID`.
    *   **Liberación/Retención**: Tabla `deposit_decisions` registra la decisión (`RELEASE`, `RETAIN_PARTIAL`, `RETAIN_FULL`).
*   **Incidentes**:
    *   RPC `report_incident` crea 1 registro en `incidents` y 1 registro en `charges` (tipo `FINE`). Relación 1:1.
*   **Votaciones**:
    *   Resultados expuestos solo por RPC `get_poll_results`.
    *   Residentes tienen política RLS "Read own response" en `poll_responses`. No pueden leer respuestas de otros.

## 2) Definiciones de KPIs (exactas)

### Total Recaudado (Dashboard Admin)
*   **Fórmula**: Suma de `monto` en tabla `payments`.
*   **Filtros**: `periodo` (YYYY-MM) coincide con el mes actual.
*   **Fuente**: Frontend (`AdminDashboard.tsx`) filtra `paymentHistory` (que viene de `payments`).
*   **Notas**:
    *   Incluye `RESERVATION_FEE` si se usó el flujo `confirmReservationPayment`.
    *   Incluye `RESERVATION_DEPOSIT` como ingreso (Caja), no lo separa como pasivo/custodia en este KPI visual.

### Ingresos vs Gastos (Gráfico Financiero)
*   **Ingresos (Caja)**: Suma de `payments.monto` agrupado por mes de `fecha_pago`.
*   **Gastos (Devengado)**: Suma de `expenses.monto` donde `status='Aprobado'`, agrupado por mes de `fecha`.

### Morosidad
*   **Definición**: Unidad que tiene al menos un registro con `pagado=false` en `common_expense_debts` O `parking_debts`.
*   **Verificación**: RPC `request_reservation` lanza excepción si esto se cumple.

## 3) Estados y transiciones

### ReservationStatus
*   `REQUESTED` (Inicial)
*   `APPROVED_PENDING_PAYMENT` (Admin aprueba -> crea Charges)
*   `CONFIRMED` (Pago de Fee + Deposit detectado por Trigger/RPC)
*   `CANCELLED` (Usuario o Admin cancela)
*   `COMPLETED` (Fecha fin < Ahora)
*   `NO_SHOW` (Admin marca manualmente)

### ChargeStatus
*   `PENDING` (Creado)
*   `PAID` (Pagado)
*   `RELEASED` (Depósito devuelto)
*   `RETAINED` (Depósito retenido)
*   `CANCELLED` (Anulado)

## 4) Flujos críticos (paso a paso + asserts)

### Flujo A: Reserva
1.  **Solicitud**: Residente llama `request_reservation`.
    *   *Assert*: Registro en `reservations` con status `REQUESTED`.
    *   *Assert*: No existen registros en `charges` asociados aún.
2.  **Aprobación**: Admin llama `approve_reservation`.
    *   *Assert*: `reservations.status` = `APPROVED_PENDING_PAYMENT`.
    *   *Assert*: 2 registros en `charges` (`RESERVATION_FEE`, `RESERVATION_DEPOSIT`) con status `PENDING`.
3.  **Pago**: Se registra pago (simulado o real).
    *   *Assert*: `charges.status` pasa a `PAID`.
    *   *Assert*: Trigger actualiza `reservations.status` a `CONFIRMED`.
    *   *Assert*: Registro creado en tabla `payments` (para reflejar en caja).
4.  **Cierre**: Admin decide depósito (`decide_deposit`).
    *   *Assert*: Registro en `deposit_decisions`.
    *   *Assert*: `charges` (depósito) pasa a `RELEASED` o `RETAINED`.

### Flujo B: Cierre de mes
1.  **Cierre**: Admin llama `closeMonthAndGenerateStatement` (actualmente en `dataService`/Frontend logic, migrando a RPC).
    *   *Assert*: Se genera registro en `financial_statements`.
    *   *Assert*: Se generan registros en `common_expense_debts` para todos los residentes.
2.  **Pago Gasto Común**: Residente paga.
    *   *Assert*: `common_expense_debts.pagado` = `true`.
    *   *Assert*: Nuevo registro en `payments`.
    *   *Assert*: KPI "Total Recaudado" incrementa.

## 5) Evidencia mínima (SQL)

**Ver charges de una reserva:**
```sql
SELECT * FROM charges 
WHERE reference_type = 'RESERVATION' 
AND reference_id = :reservation_id;
```

**Validar confirmación automática (Trigger Logic):**
```sql
-- Verificar si ambos cargos están pagados
SELECT count(*) FROM charges 
WHERE reference_type = 'RESERVATION' 
AND reference_id = :reservation_id 
AND status = 'PAID';
-- Debería ser 2 (Fee + Deposit) para que la reserva pase a CONFIRMED
```

**KPI Total Recaudado (Query equivalente a lógica actual):**
```sql
SELECT SUM(monto) 
FROM payments 
WHERE periodo = to_char(now(), 'YYYY-MM');
```

## 6) Ambigüedades / Riesgos

1.  **Dualidad de Pagos**: Existe la tabla `charges` (nueva, robusta) y la tabla `payments` (histórica, usada para KPIs).
    *   **Riesgo**: Si se actualiza `charges` a `PAID` sin insertar en `payments`, el dinero "desaparece" del dashboard financiero.
    *   **Riesgo**: Si se inserta en `payments` sin actualizar `charges`, la reserva nunca se confirma.
2.  **Dualidad de Deudas**: `common_expense_debts` vs `charges` (tipo `COMMON_EXPENSE`).
    *   El sistema usa las tablas legacy para bloquear morosos, ignorando la tabla `charges` para este fin.
3.  **Depósitos en Caja**: Actualmente el depósito se suma a "Ingresos" (en `payments`). Contablemente esto es incorrecto (es un pasivo hasta que se retiene), inflando la recaudación visible.

## 7) Definiciones Aprobadas para v2 (Frozen)

Estas definiciones reemplazan la lógica actual para la próxima iteración del Dashboard Admin:

1.  **Fuente de Verdad Financiera**:
    *   Se dejará de calcular KPIs en el frontend desde `payments`.
    *   Se consumirá exclusivamente el RPC `get_financial_kpis(period)`.

2.  **KPI: Total Recaudado (Flow)**:
    *   **Definición**: Suma de `amount` en tabla `charges`.
    *   **Filtros**:
        *   `status` = 'PAID'
        *   `paid_at` dentro del mes consultado.
        *   `type` IN ('COMMON_EXPENSE', 'FINE', 'RESERVATION_FEE', 'PARKING').
    *   **Exclusión**: NO incluye `RESERVATION_DEPOSIT`.

3.  **KPI: Garantías en Custodia (Stock)**:
    *   **Definición**: Suma de `amount` en tabla `charges`.
    *   **Filtros**:
        *   `type` = 'RESERVATION_DEPOSIT'
        *   `status` = 'PAID' (dinero en poder de la comunidad).
        *   NO ha sido liberado (`RELEASED`) ni retenido (`RETAINED`) aún.
    *   **Nota**: Es un saldo vivo (balance), no un flujo mensual.
