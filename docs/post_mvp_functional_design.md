# Diseño Funcional Post-MVP v1: "Comunidad Transparente"

Este documento define el diseño funcional para dos nuevos módulos a implementar después de estabilizar el MVP actual. El enfoque es mantener la integridad de los datos existentes y extender la funcionalidad sin romper la lógica actual de Tickets, Reservas o Gastos Comunes.

---

## Módulo 1: Gestión de Proyectos y Mantenciones Mayores
**(Cotizaciones → Selección → Orden de Trabajo → Cierre)**

### A) Objetivo del Módulo
*   **Centralizar la gestión de gastos no rutinarios:** Formalizar el flujo de reparaciones mayores o mejoras que requieren cotizaciones múltiples.
*   **Transparencia en la elección:** Permitir que la comunidad o el comité visualice y compare opciones antes de adjudicar un gasto.
*   **Trazabilidad del gasto:** Vincular el gasto final (Expense) con la decisión original y los documentos de respaldo.
*   **Validación comunitaria:** Integrar el sistema de votaciones existente para decisiones de alto costo que requieren aprobación de la asamblea.
*   **Control de ejecución:** Monitorear el estado del trabajo desde la selección del proveedor hasta la recepción conforme.

### B) Roles y Permisos
*   **Administrador:**
    *   Crear Proyecto/Solicitud.
    *   Cargar cotizaciones (PDFs, montos).
    *   Iniciar votación (vinculación con el módulo Polls).
    *   Adjudicar cotización (crear Orden de Trabajo).
    *   Cerrar proyecto y cargar factura final (genera Expense).
*   **Comité (si existe rol diferenciado, sino Admin):**
    *   Visualizar comparativa de cotizaciones.
    *   Votar/Aprobar selección (si la regla de negocio lo define).
*   **Residente:**
    *   Solo lectura de proyectos marcados como "Públicos" o "En Votación".
    *   Votar en la selección de cotización si se activa una Encuesta (Poll) vinculada.
    *   Recibir notificaciones de inicio/fin de obra.

### C) Flujo End-to-End (State Machine)
Entidad principal: `Projects` (o `MaintenanceProjects`)

1.  **BORRADOR (Draft):** El admin redacta la necesidad. Puede venir derivado de un Ticket existente.
2.  **COTIZANDO (Quoting):** Se abre la ventana para recibir presupuestos. Se cargan N cotizaciones (Mínimo 1 para avanzar).
3.  **EN_SELECCION (Selection):**
    *   *Ruta A (Directa):* Admin/Comité selecciona una opción.
    *   *Ruta B (Votación):* Se genera una Poll automática con las cotizaciones como opciones. Estado cambia a `VOTING`. Al cerrar la Poll, la ganadora se pre-selecciona.
4.  **ADJUDICADO (Awarded):** Se selecciona una cotización ganadora. Se genera la Orden de Trabajo (Work Order).
5.  **EN_EJECUCION (In Progress):** El proveedor está trabajando. Se pueden registrar hitos o bitácora.
6.  **POR_PAGAR (Pending Payment):** Trabajo recibido conforme. Se vincula/genera el registro en el motor financiero (Expense).
7.  **CERRADO (Closed):** Proceso finalizado, garantía activa si aplica.
8.  **CANCELADO (Cancelled):** Flujo abortado.

### D) Modelo de Datos Mínimo
Tablas sugeridas para extender el schema actual:

1.  **`project_requests`** (o `maintenance_projects`)
    *   `id`: PK
    *   `title`: Text
    *   `description`: Text
    *   `origin_ticket_id`: FK a tickets (opcional, trazabilidad)
    *   `status`: Enum (DRAFT, QUOTING, SELECTION, VOTING, AWARDED, IN_PROGRESS, COMPLETED, CANCELLED)
    *   `budget_limit`: Numeric (Opcional)
    *   `selected_quote_id`: FK a `project_quotes` (nullable)

2.  **`project_quotes`**
    *   `id`: PK
    *   `project_id`: FK a `project_requests`
    *   `provider_name`: Text
    *   `provider_tax_id`: Text (RUT)
    *   `amount`: Numeric
    *   `duration_days`: Integer
    *   `document_url`: Text (PDF obligatorio)
    *   `is_winner`: Boolean

3.  **Relación con Tablas Existentes:**
    *   **Tickets:** Un ticket puede tener `resolved_by_project_id`.
    *   **Polls:** Se agrega columna `related_project_id` en la tabla `polls` para vincular la votación al proyecto.
    *   **Financial/Expenses:** Al cerrar, se crea un `expense` donde `reference_id` es el `project_id`.

### E) Reglas de Negocio
*   **Umbral de Votación:** Si el monto menor de las cotizaciones supera X UF (configurable), el sistema sugiere/obliga pasar a votación (integración con Polls).
*   **Mínimo de Cotizaciones:** Para avanzar de `QUOTING` a `SELECTION` debe haber al menos 1 cotización cargada (idealmente 3 recomendadas).
*   **Bloqueo de Edición:** Una vez en `VOTING`, las cotizaciones no se pueden editar (montos fijos) para no viciar la votación.
*   **Adjuntos Obligatorios:** No se puede crear una cotización sin adjuntar el PDF de respaldo (“Sin papel no hay cotización”).

### F) Checklist QA (10 Casos Críticos + 3 Borde)
**Críticos:**
1.  Crear Proyecto desde cero correctamente.
2.  Crear Proyecto derivado de un Ticket existente.
3.  Cargar 3 cotizaciones con PDF y montos distintos.
4.  Visualizar comparativa "Lado a Lado" de cotizaciones.
5.  Flujo A: Admin adjudica "a dedo" una cotización -> Estado pasa a ADJUDICADO.
6.  Flujo B: Admin envía a Votación -> Se crea Poll correctamente con las 3 opciones.
7.  Residente vota en la Poll vinculada al proyecto.
8.  Cierre de Poll actualiza el estado del Proyecto y marca la cotización ganadora.
9.  Transición de En Ejecución a Cerrado genera el `Expense` borrador en finanzas.
10. Validar que Residentes NO pueden ver cotizaciones en estado BORRADOR.

**Casos Borde:**
1.  Intentar borrar una cotización que ya está en una votación activa (Debe fallar).
2.  Empate en votación: El sistema debe permitir al Admin desempatar (voto dirimente) o reabrir.
3.  Proyecto se cancela teniendo una Poll activa (Debe cerrar/cancelar la Poll automáticamente).

### G) Fuera del Alcance v1 (Out of Scope)
*   Portal de Proveedores (Los proveedores no se loguean, el admin carga todo).
*   Generación automática de PDFs de Orden de Compra (Solo registro digital simple).
*   Desglose de pagos por hitos (Milestones) automatizados. Se manejará como un pago único o manual.
*   Licitaciones públicas abiertas.

---

## Módulo 2: Colaboradores y Contratos
**(Gestión Documental + Alertas)**

### A) Objetivo del Módulo
*   **Repositorio Digital:** Eliminar carpetas físicas. Centralizar contratos, anexos y liquidaciones históricos.
*   **Prevención de Multas:** Evitar vencimientos de contratos a plazo fijo inadvertidos.
*   **Directorio de Contacto:** Acceso rápido a datos de emergencia del personal.
*   **Compliance Laboral:** Asegurar que cada colaborador tenga su carpeta al día (Contrato firmado subido).
*   **Seguridad:** Controlar quién trabaja efectivamente en el recinto (Activo vs Desvinculado).

### B) Roles y Permisos
*   **Administrador:** Acceso total (Crear fichas, subir sueldos/contratos, ver datos sensibles).
*   **Comité:** Acceso de lectura (Auditoría), generalmente con datos sensibles (sueldo) ofuscados o restringidos según política.
*   **Conserje/Staff:** *NO tiene acceso a este módulo* (Su privacidad es resguardada).
*   **Residente:** Sin acceso.

### C) Flujo End-to-End (State Machine)
Entidad: `Collaborator` (y `Contract`)

1.  **ACTIVO (Active):** Personal trabajando actualmente. Genera alertas de vencimiento.
2.  **LICENCIA (Medical Leave):** Suspendido temporalmente, excluido de turnos, pero activo contractual.
3.  **VACACIONES (Vacation):** Similar a Licencia.
4.  **DESVINCULADO (Terminated):** Histórico. Requiere subir finiquito para cierre total.

### D) Modelo de Datos Mínimo
1.  **`collaborators`**
    *   `id`: PK
    *   `full_name`: Text
    *   `rut`: Text (Unique)
    *   `role`: Text (Conserje, Aseo, Mayordomo)
    *   `phone`: Text
    *   `email`: Text
    *   `status`: Enum (ACTIVE, LEAVE, TERMINATED)

2.  **`contracts`**
    *   `id`: PK
    *   `collaborator_id`: FK
    *   `type`: Enum (INDEFINITE, FIXED_TERM, HONORARIUM)
    *   `start_date`: Date
    *   `end_date`: Date (Nullable para indefinido)
    *   `doc_url`: Text (PDF contrato escaneado)
    *   `is_current`: Boolean

3.  **`staff_documents`** (Para anexos, certificados, etc.)
    *   `id`: PK
    *   `collaborator_id`: FK
    *   `doc_type`: Enum (SETTLEMENT, WARNING, MEDICAL_LEAVE, OTHER)
    *   `doc_url`: Text

4.  **Relación con Tablas Existentes:**
    *   **Financial:** No se calcula sueldo, pero se podría registrar el *gasto* de sueldo manual en `expenses` linkeado al colaborador ("Gasto Sueldo Juan Perez").

### E) Reglas de Negocio
*   **Alerta de Vencimiento:** Si `contract.type` es FIXED_TERM y `end_date` está a 30, 15 y 5 días → Generar notificación al Admin (Email o In-App).
*   **Unicidad Vigente:** Un colaborador solo puede tener UN contrato marcado como `is_current = true`.
*   **Documentación Obligatoria:** Al crear un colaborador, se debe subir al menos 1 documento (Contrato o ficha).
*   **Privacidad:** Rut y Sueldos (si se anotan en notas) deben ser visibles solo para `super_admin` o roles explícitos de RRHH.

### F) Checklist QA (10 Casos Críticos + 3 Borde)
**Críticos:**
1.  Crear Ficha de Colaborador con datos básicos.
2.  Cargar un Contrato a Plazo Fijo con fecha futura.
3.  Verificar que el sistema muestra alerta visual si la fecha de fin de contrato está próxima.
4.  Cargar un Contrato Indefinido (sin fecha fin).
5.  Subir documento anexo (ej: Certificado antecedentes).
6.  Busqueda de colaborador por nombre o RUT.
7.  Pasar Colaborador a "Desvinculado" y subir Finiquito.
8.  Verificar que colaborador desvinculado no aparece en listas de selección rápida (ej: asignar conserje).
9.  Descargar PDF de contrato adjunto.
10. Validar validación de formato de RUT.

**Casos Borde:**
1.  Intentar crear dos contratos vigentes simultáneos para la misma persona (Debe bloquear o archivar el anterior).
2.  Renovar contrato: El sistema debe permitir extender fecha o crear nuevo contrato "continuidad" sin perder histórico.
3.  Colaborador re-contratado: Alguien que fue desvinculado hace 1 año vuelve a ser contratado (Reactivación de ficha).

### G) Fuera del Alcance v1 (Out of Scope)
*   **Motor de Remuneraciones:** NO se calculan sueldos, imposiciones, ni leyes sociales. Eso se hace externo. Solo documental.
*   **Control de Asistencia (Reloj control):** No se registran marcas de entrada/salida biométricas o manuales por ahora.
*   **Portal del Empleado:** El colaborador no entra al sistema a ver sus liquidaciones.
*   **Turnos Rotativos:** Gestión de calendario de turnos compleja.
