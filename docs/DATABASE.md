# Database Schema Documentation

> Gestion Condominio Facil - PostgreSQL Database Schema
> Version: 1.0 | Last Updated: January 2026

## Table of Contents

1. [Overview](#1-overview)
2. [Entity-Relationship Diagram](#2-entity-relationship-diagram)
3. [Tables Reference](#3-tables-reference)
   - [3.1 Core Tables](#31-core-tables)
   - [3.2 Financial Tables](#32-financial-tables)
   - [3.3 Reservation Tables](#33-reservation-tables)
   - [3.4 Voting Tables](#34-voting-tables)
   - [3.5 Communication Tables](#35-communication-tables)
4. [Custom Types](#4-custom-types)
5. [Relationships](#5-relationships)
6. [RPC Functions](#6-rpc-functions)
7. [Triggers](#7-triggers)
8. [Constraints](#8-constraints)
9. [Indexes](#9-indexes)
10. [Row-Level Security](#10-row-level-security)
11. [Business Rules](#11-business-rules)
12. [Migration Guide](#12-migration-guide)
13. [Appendices](#appendices)

---

## 1. Overview

The database schema is built on **PostgreSQL 15+** via **Supabase** and consists of **20 tables** organized into 5 functional areas:

| Area              | Tables                                               | Purpose                                |
| ----------------- | ---------------------------------------------------- | -------------------------------------- |
| **Core**          | profiles, units, community_settings                  | User management and configuration      |
| **Financial**     | charges, payments, debts, expenses, statements       | Money tracking and accounting          |
| **Reservations**  | amenities, reservations, types, decisions, incidents | Booking system with deposit management |
| **Voting**        | polls, poll_options, poll_responses                  | Community voting with weighted ballots |
| **Communication** | tickets, notices                                     | Support and announcements              |

### Key Features

- **Row-Level Security (RLS)**: Data isolation between residents and admins
- **15 RPC Functions**: Server-side business logic with transactions
- **Exclusion Constraints**: Prevents double-booking with PostgreSQL's temporal ranges
- **Automatic Triggers**: Profile creation, payment confirmation, role protection
- **8 Custom Enums**: Type-safe status tracking

### Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- Exclusion constraints
```

---

## 2. Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION                               │
│                     auth.users (Supabase)                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ 1:1 (ON DELETE CASCADE)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          CORE ENTITIES                               │
│                                                                      │
│  ┌──────────┐         ┌──────────┐         ┌───────────────────┐   │
│  │ profiles │◄────────┤  units   │────────►│ community_settings│   │
│  └────┬─────┘   M:1   └────┬─────┘         └───────────────────┘   │
│       │                    │                                        │
└───────┼────────────────────┼────────────────────────────────────────┘
        │                    │
        │ (user_id)          │ (unit_id)
        │                    │
┌───────┼────────────────────┼────────────────────────────────────────┐
│       │  FINANCIAL SYSTEM  │                                        │
│       │                    │                                        │
│  ┌────▼──────┐        ┌───▼───────┐       ┌──────────────┐         │
│  │  tickets  │        │  charges  │──────►│  payments    │         │
│  │  notices  │        └─────┬─────┘       └──────────────┘         │
│  └───────────┘              │ (reference)                           │
│                             │                                       │
│  ┌───────────────────┐  ┌───▼───────────┐  ┌─────────────────┐    │
│  │common_expense_debts│  │   expenses    │  │financial_statements│ │
│  │  parking_debts    │  │ reserve_fund  │  └─────────────────┘    │
│  └───────────────────┘  └───────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     RESERVATION SYSTEM                              │
│                                                                     │
│  ┌──────────┐         ┌──────────────┐         ┌──────────────┐   │
│  │amenities │◄────────┤ reservations │────────►│ reservation_ │   │
│  │          │   M:1   │              │   M:1   │    types     │   │
│  └──────────┘         └──────┬───────┘         └──────────────┘   │
│                              │                                     │
│                              │ 1:1                                 │
│                              ▼                                     │
│                   ┌──────────────────────┐                         │
│                   │ deposit_decisions    │                         │
│                   └──────────────────────┘                         │
│                              │                                     │
│                              │ M:1                                 │
│                              ▼                                     │
│                   ┌──────────────────────┐                         │
│                   │    incidents         │                         │
│                   └──────────────────────┘                         │
│                              │                                     │
│                              └────► charges (FINE)                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       VOTING SYSTEM                                 │
│                                                                     │
│  ┌──────────┐         ┌──────────────┐         ┌──────────────┐   │
│  │  polls   │────────►│poll_options  │         │    units     │   │
│  └────┬─────┘   1:M   └──────┬───────┘         └──────┬───────┘   │
│       │                      │                        │           │
│       │                      │                        │           │
│       │         M:1          ▼          M:1           │           │
│       └─────────────►┌──────────────┐◄────────────────┘           │
│                      │poll_responses│                             │
│                      └──────────────┘                             │
│                   (UNIQUE: poll_id, unit_id)                      │
└─────────────────────────────────────────────────────────────────────┘

Legend:
  ──►  Foreign Key
  ◄──  One-to-Many
  ◄─► Many-to-One
```

---

## 3. Tables Reference

### 3.1 Core Tables

#### profiles

**Purpose**: User profiles linked to Supabase Auth, managing residents and administrators.

| Column      | Type        | Constraints         | Description                |
| ----------- | ----------- | ------------------- | -------------------------- |
| id          | UUID        | PK, FK → auth.users | User ID from Supabase Auth |
| email       | TEXT        | UNIQUE, NOT NULL    | User email                 |
| nombre      | TEXT        | NOT NULL            | Full name                  |
| unidad      | TEXT        |                     | Legacy unit name field     |
| unit_id     | BIGINT      | FK → units.id       | Normalized unit reference  |
| role        | TEXT        |                     | 'admin' or 'resident'      |
| has_parking | BOOLEAN     | DEFAULT false       | Parking space assignment   |
| created_at  | TIMESTAMPTZ | NOT NULL            | Creation timestamp         |

**Relationships**:

- 1:1 with `auth.users` (CASCADE on delete)
- M:1 with `units` via `unit_id`

**RLS**:

- SELECT: All authenticated users
- UPDATE: Own profile only (role changes protected by trigger)

**Example**:

```sql
-- Get all residents
SELECT id, nombre, unidad FROM profiles WHERE role = 'resident';

-- Check if user has parking
SELECT has_parking FROM profiles WHERE id = auth.uid();
```

---

#### units

**Purpose**: Normalized table for condominium units with voting weights.

| Column     | Type        | Constraints      | Description                           |
| ---------- | ----------- | ---------------- | ------------------------------------- |
| id         | BIGINT      | PK, IDENTITY     | Auto-increment ID                     |
| name       | TEXT        | UNIQUE, NOT NULL | Unit identifier (e.g., "101", "A-23") |
| alicuota   | NUMERIC     | DEFAULT 0        | Proportional ownership % for voting   |
| created_at | TIMESTAMPTZ | NOT NULL         | Creation timestamp                    |

**Relationships**:

- 1:M with `profiles` via `unit_id` (residents belong to units)
- 1:M with `charges` (charges assigned to units, not users)
- 1:M with `reservations` (reservations made by units)

**Business Rule**:

- `alicuota` values should sum to 100 across all units (validated at application level)

**RLS**:

- SELECT: Public (all authenticated users need to see units)

**Example**:

```sql
-- Get all units with their total alicuota
SELECT SUM(alicuota) as total_weight FROM units;

-- Find unit by name
SELECT id, alicuota FROM units WHERE name = '101';
```

---

#### community_settings

**Purpose**: Global condominium configuration (singleton table).

| Column                | Type        | Constraints             | Description               |
| --------------------- | ----------- | ----------------------- | ------------------------- |
| id                    | SERIAL      | PK                      | Always 1 (single row)     |
| common_expense_amount | INTEGER     | NOT NULL, DEFAULT 65000 | Base common expense (CLP) |
| parking_cost_amount   | INTEGER     | NOT NULL, DEFAULT 12000 | Monthly parking fee (CLP) |
| updated_at            | TIMESTAMPTZ |                         | Last update timestamp     |

**RLS**:

- SELECT: All authenticated
- UPDATE/DELETE: Admin only

**Example**:

```sql
-- Get current settings
SELECT * FROM community_settings WHERE id = 1;

-- Update parking cost (admin only)
UPDATE community_settings SET parking_cost_amount = 15000 WHERE id = 1;
```

---

### 3.2 Financial Tables

#### charges

**Purpose**: Unified charge system for all types of fees, deposits, and fines. Replaces legacy debt tables.

| Column         | Type                  | Constraints                   | Description                                        |
| -------------- | --------------------- | ----------------------------- | -------------------------------------------------- |
| id             | UUID                  | PK, DEFAULT gen_random_uuid() | Unique charge ID                                   |
| unit_id        | BIGINT                | FK → units.id, NOT NULL       | Unit responsible for payment                       |
| amount         | NUMERIC               | NOT NULL, CHECK >= 0          | Amount in currency                                 |
| currency       | TEXT                  | DEFAULT 'CLP'                 | Currency code                                      |
| type           | charge_type           | NOT NULL                      | ENUM: FEE, DEPOSIT, FINE, COMMON_EXPENSE, PARKING  |
| status         | charge_status         | NOT NULL, DEFAULT 'PENDING'   | ENUM: PENDING, PAID, CANCELLED, RELEASED, RETAINED |
| reference_type | charge_reference_type | NOT NULL                      | ENUM: RESERVATION, INCIDENT, MONTH                 |
| reference_id   | BIGINT                | NOT NULL                      | ID of referenced entity                            |
| created_by     | UUID                  | FK → auth.users               | Admin who created                                  |
| created_at     | TIMESTAMPTZ           | NOT NULL                      | Creation timestamp                                 |
| paid_at        | TIMESTAMPTZ           |                               | Payment timestamp                                  |
| notes          | TEXT                  |                               | Admin notes                                        |

**Indexes**:

- `idx_charges_unit_status` ON (unit_id, status)
- `idx_charges_reference` ON (reference_type, reference_id)
- `idx_charges_created_at` ON (created_at DESC)

**Unique Constraints**:

- One FEE and one DEPOSIT per reservation: `(reference_id, type)` WHERE reference_type='RESERVATION'

**RLS**:

- SELECT: Residents see own unit's charges, admins see all
- INSERT/UPDATE/DELETE: Admin only

**Example**:

```sql
-- Get pending charges for a unit
SELECT * FROM charges
WHERE unit_id = 5 AND status = 'PENDING'
ORDER BY created_at DESC;

-- Calculate deposits in custody
SELECT SUM(amount) FROM charges
WHERE type = 'RESERVATION_DEPOSIT' AND status = 'PAID';
```

---

#### payments

**Purpose**: Payment records linked to charges.

| Column      | Type        | Constraints             | Description                                    |
| ----------- | ----------- | ----------------------- | ---------------------------------------------- |
| id          | SERIAL      | PK                      | Auto-increment ID                              |
| user_id     | UUID        | FK → profiles.id        | Resident who paid                              |
| charge_id   | UUID        | FK → charges.id, UNIQUE | Link to charge (one payment per charge)        |
| type        | TEXT        |                         | Legacy: 'Gasto Común', 'Estacionamiento', etc. |
| periodo     | TEXT        | NOT NULL                | Format: YYYY-MM                                |
| monto       | INTEGER     | NOT NULL                | Amount paid (CLP)                              |
| fecha_pago  | DATE        | DEFAULT CURRENT_DATE    | Payment date                                   |
| metodo_pago | TEXT        |                         | 'Transferencia', 'Efectivo', 'Cheque'          |
| observacion | TEXT        |                         | Payment notes                                  |
| created_at  | TIMESTAMPTZ |                         | Creation timestamp                             |

**RLS**:

- SELECT: Users see own payments, admins see all
- INSERT: Via RPC `confirm_charge_payment()` only (admin)

**Example**:

```sql
-- Payment history for a period
SELECT user_id, SUM(monto) as total
FROM payments
WHERE periodo = '2026-01'
GROUP BY user_id;
```

---

#### common_expense_debts

**Purpose**: Legacy table for tracking monthly common expense debts (pre-charges system).

| Column     | Type        | Constraints                | Description        |
| ---------- | ----------- | -------------------------- | ------------------ |
| id         | SERIAL      | PK                         | Auto-increment ID  |
| user_id    | UUID        | FK → profiles.id, NOT NULL | Resident with debt |
| mes        | TEXT        | NOT NULL                   | Period: YYYY-MM    |
| monto      | INTEGER     | NOT NULL                   | Debt amount (CLP)  |
| pagado     | BOOLEAN     | DEFAULT false              | Payment status     |
| created_at | TIMESTAMPTZ |                            | Creation timestamp |

**Note**: Being phased out in favor of `charges` table with `type='COMMON_EXPENSE'`.

**RLS**:

- SELECT: Users see own debts, admins see all

---

#### parking_debts

**Purpose**: Legacy table for parking fee debts.

| Column     | Type        | Constraints                | Description        |
| ---------- | ----------- | -------------------------- | ------------------ |
| id         | SERIAL      | PK                         | Auto-increment ID  |
| user_id    | UUID        | FK → profiles.id, NOT NULL | Resident with debt |
| patente    | TEXT        |                            | License plate      |
| mes        | TEXT        | NOT NULL                   | Period: YYYY-MM    |
| monto      | INTEGER     | NOT NULL                   | Debt amount (CLP)  |
| pagado     | BOOLEAN     | DEFAULT false              | Payment status     |
| created_at | TIMESTAMPTZ |                            | Creation timestamp |

**Note**: Being phased out in favor of `charges` table with `type='PARKING'`.

---

#### expenses

**Purpose**: Community expenses requiring admin approval.

| Column           | Type        | Constraints          | Description                               |
| ---------------- | ----------- | -------------------- | ----------------------------------------- |
| id               | SERIAL      | PK                   | Auto-increment ID                         |
| descripcion      | TEXT        | NOT NULL             | Expense description                       |
| monto            | INTEGER     | NOT NULL             | Amount (CLP)                              |
| fecha            | DATE        | DEFAULT CURRENT_DATE | Expense date                              |
| categoria        | TEXT        |                      | Category (Mantenimiento, Seguridad, etc.) |
| status           | TEXT        |                      | 'Aprobado', 'Rechazado', 'En Revision'    |
| proveedor        | TEXT        |                      | Supplier name                             |
| numero_documento | TEXT        |                      | Invoice/receipt number                    |
| evidencia_url    | TEXT        |                      | Uploaded evidence URL                     |
| motivo_rechazo   | TEXT        |                      | Rejection reason if rejected              |
| created_at       | TIMESTAMPTZ |                      | Creation timestamp                        |

**Categories**: Mantenimiento, Seguridad, Limpieza, Administracion, Suministros, Otros

**RLS**:

- SELECT: All authenticated
- INSERT/UPDATE/DELETE: Admin only

---

#### financial_statements

**Purpose**: Monthly financial reports.

| Column     | Type        | Constraints | Description                     |
| ---------- | ----------- | ----------- | ------------------------------- |
| id         | SERIAL      | PK          | Auto-increment ID               |
| mes        | TEXT        | NOT NULL    | Month name (e.g., "Enero 2026") |
| url        | TEXT        |             | PDF report URL                  |
| ingresos   | INTEGER     | DEFAULT 0   | Total income (CLP)              |
| egresos    | INTEGER     | DEFAULT 0   | Total expenses (CLP)            |
| saldo      | INTEGER     | DEFAULT 0   | Balance (CLP)                   |
| created_at | TIMESTAMPTZ |             | Creation timestamp              |

---

#### reserve_fund

**Purpose**: Reserve fund tracking (singleton table).

| Column       | Type        | Constraints | Description           |
| ------------ | ----------- | ----------- | --------------------- |
| id           | SERIAL      | PK          | Always 1 (single row) |
| monto_actual | INTEGER     | DEFAULT 0   | Current fund balance  |
| meta         | INTEGER     | DEFAULT 0   | Target goal           |
| updated_at   | TIMESTAMPTZ |             | Last update           |

---

### 3.3 Reservation Tables

#### amenities

**Purpose**: Physical spaces available for reservation (e.g., Quincho, Pool, Event Room).

| Column      | Type        | Constraints  | Description        |
| ----------- | ----------- | ------------ | ------------------ |
| id          | BIGINT      | PK, IDENTITY | Auto-increment ID  |
| name        | TEXT        | NOT NULL     | Amenity name       |
| description | TEXT        |              | Description        |
| capacity    | INTEGER     |              | Maximum occupancy  |
| photo_url   | TEXT        |              | Display image URL  |
| created_at  | TIMESTAMPTZ | NOT NULL     | Creation timestamp |

**RLS**:

- SELECT: Public (all users)
- INSERT/UPDATE/DELETE: Admin only

**Example**:

```sql
-- Get all amenities
SELECT id, name, capacity FROM amenities ORDER BY name;
```

---

#### reservation_types

**Purpose**: Booking configurations for each amenity with pricing and rules.

| Column               | Type        | Constraints                 | Description                             |
| -------------------- | ----------- | --------------------------- | --------------------------------------- |
| id                   | BIGINT      | PK, IDENTITY                | Auto-increment ID                       |
| amenity_id           | BIGINT      | FK → amenities.id, NOT NULL | Parent amenity                          |
| name                 | TEXT        | NOT NULL                    | Type name (e.g., "Full Day", "Evening") |
| fee_amount           | NUMERIC     | NOT NULL, DEFAULT 0         | Usage fee (CLP)                         |
| deposit_amount       | NUMERIC     | NOT NULL, DEFAULT 0         | Refundable deposit (CLP)                |
| max_duration_minutes | INTEGER     |                             | Max booking duration                    |
| min_advance_hours    | INTEGER     |                             | Minimum advance booking time            |
| form_schema          | JSONB       |                             | Dynamic form fields for booking         |
| rules                | TEXT        |                             | Usage rules text                        |
| requires_approval    | BOOLEAN     | DEFAULT TRUE                | Admin approval required                 |
| created_at           | TIMESTAMPTZ | NOT NULL                    | Creation timestamp                      |

**Form Schema Example**:

```json
[
  { "name": "guests", "type": "number", "label": "Número de invitados", "required": true },
  {
    "name": "event_type",
    "type": "select",
    "label": "Tipo de evento",
    "options": ["Cumpleaños", "Asado", "Otro"]
  }
]
```

**RLS**:

- SELECT: Public
- INSERT/UPDATE/DELETE: Admin only

---

#### reservations

**Purpose**: Reservation requests and system blocks.

| Column           | Type               | Constraints                   | Description                                   |
| ---------------- | ------------------ | ----------------------------- | --------------------------------------------- |
| id               | BIGINT             | PK, IDENTITY                  | Auto-increment ID                             |
| amenity_id       | BIGINT             | FK → amenities.id, NOT NULL   | Reserved amenity                              |
| type_id          | BIGINT             | FK → reservation_types.id     | Reservation type (nullable for system blocks) |
| unit_id          | BIGINT             | FK → units.id                 | Requesting unit (NULL for system blocks)      |
| user_id          | UUID               | FK → auth.users               | Requesting user                               |
| start_at         | TIMESTAMPTZ        | NOT NULL                      | Start time                                    |
| end_at           | TIMESTAMPTZ        | NOT NULL                      | End time                                      |
| status           | reservation_status | NOT NULL, DEFAULT 'REQUESTED' | Status enum                                   |
| is_system        | BOOLEAN            | NOT NULL, DEFAULT FALSE       | System maintenance block                      |
| system_reason    | TEXT               |                               | Reason for system block                       |
| form_data        | JSONB              |                               | User-submitted form data                      |
| fee_snapshot     | NUMERIC            |                               | Fee amount at time of request                 |
| deposit_snapshot | NUMERIC            |                               | Deposit amount at time of request             |
| created_at       | TIMESTAMPTZ        | NOT NULL                      | Creation timestamp                            |

**Status Flow**:

```
REQUESTED → (approve) → APPROVED_PENDING_PAYMENT → (payment) → CONFIRMED → (event) → COMPLETED/NO_SHOW
```

**Check Constraints**:

- `end_at > start_at`
- If `is_system = TRUE` then `unit_id` must be NULL
- If `is_system = FALSE` then `unit_id` must NOT be NULL

**Exclusion Constraint** (Anti-Double-Booking):

```sql
EXCLUDE USING gist (
  amenity_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
) WHERE (is_system = true OR status IN ('REQUESTED','APPROVED_PENDING_PAYMENT','CONFIRMED'))
```

**RLS**:

- SELECT: All users (needed for availability calendar)
- INSERT: Users can create for themselves
- UPDATE: Own reservations, admins can update all

**Example**:

```sql
-- Check availability for an amenity
SELECT * FROM reservations
WHERE amenity_id = 1
  AND status IN ('REQUESTED', 'APPROVED_PENDING_PAYMENT', 'CONFIRMED')
  AND tstzrange(start_at, end_at, '[)') && tstzrange('2026-01-27 10:00'::timestamptz, '2026-01-27 14:00'::timestamptz, '[)');
```

---

#### deposit_decisions

**Purpose**: Admin decisions on deposit refunds/retentions after reservation completion.

| Column              | Type                  | Constraints                            | Description                          |
| ------------------- | --------------------- | -------------------------------------- | ------------------------------------ |
| id                  | BIGINT                | PK, IDENTITY                           | Auto-increment ID                    |
| reservation_id      | BIGINT                | FK → reservations.id, UNIQUE, NOT NULL | One decision per reservation         |
| deposit_charge_id   | UUID                  | FK → charges.id                        | Original deposit charge              |
| decision            | deposit_decision_type | NOT NULL                               | RELEASE, RETAIN_PARTIAL, RETAIN_FULL |
| retained_amount     | NUMERIC               | DEFAULT 0, CHECK >= 0                  | Amount retained (if partial)         |
| reason              | TEXT                  |                                        | Reason for decision                  |
| decided_by          | UUID                  | FK → auth.users                        | Admin who decided                    |
| decided_at          | TIMESTAMPTZ           | NOT NULL                               | Decision timestamp                   |
| retention_charge_id | UUID                  | FK → charges.id                        | FINE charge if retained              |

**Check Constraint**:

- If `decision IN ('RETAIN_PARTIAL', 'RETAIN_FULL')` then `reason` must NOT be NULL

**Business Logic**:

- When deposits retained, a new **FINE** charge is created (revenue)
- Original deposit charge status becomes 'RELEASED' or 'RETAINED'

**RLS**:

- SELECT: Residents see own, admins see all
- INSERT: Admin only (via RPC)

---

#### incidents

**Purpose**: Incident reports linked to reservations (damage, rule violations, etc.).

| Column         | Type            | Constraints                    | Description                   |
| -------------- | --------------- | ------------------------------ | ----------------------------- |
| id             | BIGINT          | PK, IDENTITY                   | Auto-increment ID             |
| reservation_id | BIGINT          | FK → reservations.id, NOT NULL | Related reservation           |
| description    | TEXT            | NOT NULL                       | Incident description          |
| evidence_urls  | TEXT[]          |                                | Photo/video URLs              |
| regulation_ref | TEXT            |                                | Violated regulation reference |
| fine_amount    | NUMERIC         | DEFAULT 0                      | Fine amount (CLP)             |
| status         | incident_status | DEFAULT 'DRAFT'                | DRAFT, APPROVED, CHARGED      |
| created_at     | TIMESTAMPTZ     | NOT NULL                       | Creation timestamp            |

**Workflow**:

1. Admin creates incident (DRAFT)
2. When charged, status becomes 'CHARGED' and a FINE charge is created

**RLS**:

- SELECT: Residents see own reservation incidents, admins see all
- INSERT: Admin only

---

### 3.4 Voting Tables

#### polls

**Purpose**: Community voting with two weighting strategies.

| Column               | Type                    | Constraints                | Description                          |
| -------------------- | ----------------------- | -------------------------- | ------------------------------------ |
| id                   | BIGINT                  | PK, IDENTITY               | Auto-increment ID                    |
| question             | TEXT                    | NOT NULL                   | Poll question                        |
| options              | JSONB                   | NOT NULL                   | Legacy: array of option strings      |
| start_at             | TIMESTAMPTZ             | NOT NULL                   | Voting start time                    |
| end_at               | TIMESTAMPTZ             | NOT NULL                   | Voting end time                      |
| weighting_strategy   | weighting_strategy      | NOT NULL, DEFAULT 'UNIT'   | UNIT or ALICUOTA                     |
| show_results_when    | poll_results_visibility | NOT NULL, DEFAULT 'CLOSED' | LIVE or CLOSED                       |
| weight_snapshot_json | JSONB                   |                            | Snapshot of unit weights at creation |
| closed_at            | TIMESTAMPTZ             |                            | Early close timestamp                |
| closed_by            | UUID                    | FK → auth.users            | Admin who closed                     |
| close_reason         | TEXT                    |                            | Reason for early closure             |
| created_by           | UUID                    | FK → auth.users            | Admin who created                    |
| created_at           | TIMESTAMPTZ             | NOT NULL                   | Creation timestamp                   |

**Weighting Strategies**:

- **UNIT**: Each unit gets 1 vote (democratic)
- **ALICUOTA**: Each unit's vote weighted by ownership percentage

**Check Constraint**:

- If `closed_at IS NOT NULL` then `close_reason` must NOT be NULL

**RLS**:

- SELECT: All authenticated
- INSERT/UPDATE/DELETE: Admin only

---

#### poll_options

**Purpose**: Options for each poll (normalized from polls.options JSONB).

| Column       | Type    | Constraints             | Description       |
| ------------ | ------- | ----------------------- | ----------------- |
| id           | BIGINT  | PK, IDENTITY            | Auto-increment ID |
| poll_id      | BIGINT  | FK → polls.id, NOT NULL | Parent poll       |
| option_text  | TEXT    | NOT NULL                | Option text       |
| option_index | INTEGER | NOT NULL                | Display order     |

**Unique Constraint**: (poll_id, option_index)

**RLS**:

- SELECT: All authenticated

---

#### poll_responses

**Purpose**: Voting responses from units.

| Column      | Type        | Constraints                    | Description         |
| ----------- | ----------- | ------------------------------ | ------------------- |
| id          | BIGINT      | PK, IDENTITY                   | Auto-increment ID   |
| poll_id     | BIGINT      | FK → polls.id, NOT NULL        | Poll voted on       |
| unit_id     | BIGINT      | FK → units.id, NOT NULL        | Voting unit         |
| option_id   | BIGINT      | FK → poll_options.id, NOT NULL | Selected option     |
| weight_used | NUMERIC     | NOT NULL, DEFAULT 1            | Vote weight applied |
| created_at  | TIMESTAMPTZ | NOT NULL                       | Vote timestamp      |

**Unique Constraint**: (poll_id, unit_id) - One vote per unit per poll

**RLS**:

- SELECT: Users see own votes, admins see all
- INSERT: Via RPC `submit_vote()` only

**Example**:

```sql
-- Get poll results
SELECT
  po.option_text,
  COUNT(pr.id) as vote_count,
  SUM(pr.weight_used) as weighted_total
FROM poll_responses pr
JOIN poll_options po ON po.id = pr.option_id
WHERE pr.poll_id = 1
GROUP BY po.option_text;
```

---

### 3.5 Communication Tables

#### tickets

**Purpose**: Support tickets/requests from residents.

| Column      | Type        | Constraints                | Description                                  |
| ----------- | ----------- | -------------------------- | -------------------------------------------- |
| id          | SERIAL      | PK                         | Auto-increment ID                            |
| user_id     | UUID        | FK → profiles.id, NOT NULL | Ticket creator                               |
| titulo      | TEXT        | NOT NULL                   | Ticket title                                 |
| descripcion | TEXT        | NOT NULL                   | Ticket description                           |
| fecha       | DATE        | DEFAULT CURRENT_DATE       | Creation date                                |
| estado      | TEXT        |                            | 'Nuevo', 'En Proceso', 'Resuelto', 'Cerrado' |
| created_at  | TIMESTAMPTZ |                            | Creation timestamp                           |

**RLS**:

- SELECT: Users see own tickets, admins see all
- INSERT: Users can create
- UPDATE/DELETE: Admin only

---

#### notices

**Purpose**: Community announcements and news.

| Column     | Type        | Constraints          | Description                                             |
| ---------- | ----------- | -------------------- | ------------------------------------------------------- |
| id         | SERIAL      | PK                   | Auto-increment ID                                       |
| titulo     | TEXT        | NOT NULL             | Notice title                                            |
| contenido  | TEXT        | NOT NULL             | Notice content                                          |
| fecha      | DATE        | DEFAULT CURRENT_DATE | Publication date                                        |
| tipo       | TEXT        |                      | 'Comunidad', 'Mantenimiento', 'Seguridad', 'Emergencia' |
| status     | TEXT        |                      | 'Borrador', 'Publicado', 'Archivado'                    |
| created_at | TIMESTAMPTZ |                      | Creation timestamp                                      |

**RLS**:

- SELECT: Authenticated users see published notices
- INSERT/UPDATE/DELETE: Admin only

---

## 4. Custom Types

### Enums

```sql
-- Reservation lifecycle
CREATE TYPE reservation_status AS ENUM (
  'REQUESTED',                -- User submitted
  'REJECTED',                 -- Admin rejected
  'APPROVED_PENDING_PAYMENT', -- Approved, awaiting payment
  'CONFIRMED',               -- Payment received
  'CANCELLED',               -- User/admin cancelled
  'COMPLETED',               -- Event completed successfully
  'NO_SHOW'                  -- User didn't show up
);

-- Deposit decision types
CREATE TYPE deposit_decision_type AS ENUM (
  'RELEASE',        -- Full refund
  'RETAIN_PARTIAL', -- Partial retention
  'RETAIN_FULL'     -- Full retention
);

-- Incident workflow
CREATE TYPE incident_status AS ENUM (
  'DRAFT',    -- Created but not charged
  'APPROVED', -- Approved by admin
  'CHARGED'   -- Fine charge created
);

-- Voting strategies
CREATE TYPE weighting_strategy AS ENUM (
  'UNIT',      -- One unit = one vote
  'ALICUOTA'   -- Vote weighted by ownership %
);

-- Poll results visibility
CREATE TYPE poll_results_visibility AS ENUM (
  'LIVE',   -- Results visible while voting open
  'CLOSED'  -- Results visible only after poll closes
);

-- Charge types
CREATE TYPE charge_type AS ENUM (
  'RESERVATION_FEE',     -- Usage fee
  'RESERVATION_DEPOSIT', -- Refundable deposit
  'FINE',                -- Incident fine (revenue)
  'COMMON_EXPENSE',      -- Monthly expense
  'PARKING'              -- Parking fee
);

-- Charge status
CREATE TYPE charge_status AS ENUM (
  'PENDING',   -- Awaiting payment
  'PAID',      -- Payment received
  'CANCELLED', -- Charge cancelled
  'RELEASED',  -- Deposit refunded
  'RETAINED'   -- Deposit kept (revenue)
);

-- Charge reference types
CREATE TYPE charge_reference_type AS ENUM (
  'RESERVATION', -- Links to reservations.id
  'INCIDENT',    -- Links to incidents.id
  'MONTH'        -- Links to period (YYYYMM as BIGINT)
);
```

---

## 5. Relationships

### Foreign Key Summary

| Child Table          | Column              | References            | On Delete |
| -------------------- | ------------------- | --------------------- | --------- |
| profiles             | id                  | auth.users(id)        | CASCADE   |
| profiles             | unit_id             | units(id)             | SET NULL  |
| charges              | unit_id             | units(id)             | CASCADE   |
| charges              | created_by          | auth.users(id)        | SET NULL  |
| payments             | user_id             | profiles(id)          | SET NULL  |
| payments             | charge_id           | charges(id)           | SET NULL  |
| reservations         | amenity_id          | amenities(id)         | CASCADE   |
| reservations         | type_id             | reservation_types(id) | SET NULL  |
| reservations         | unit_id             | units(id)             | CASCADE   |
| reservations         | user_id             | auth.users(id)        | SET NULL  |
| reservation_types    | amenity_id          | amenities(id)         | CASCADE   |
| deposit_decisions    | reservation_id      | reservations(id)      | CASCADE   |
| deposit_decisions    | deposit_charge_id   | charges(id)           | SET NULL  |
| deposit_decisions    | retention_charge_id | charges(id)           | SET NULL  |
| deposit_decisions    | decided_by          | auth.users(id)        | SET NULL  |
| incidents            | reservation_id      | reservations(id)      | CASCADE   |
| polls                | created_by          | auth.users(id)        | SET NULL  |
| polls                | closed_by           | auth.users(id)        | SET NULL  |
| poll_options         | poll_id             | polls(id)             | CASCADE   |
| poll_responses       | poll_id             | polls(id)             | CASCADE   |
| poll_responses       | unit_id             | units(id)             | CASCADE   |
| poll_responses       | option_id           | poll_options(id)      | CASCADE   |
| tickets              | user_id             | profiles(id)          | CASCADE   |
| common_expense_debts | user_id             | profiles(id)          | CASCADE   |
| parking_debts        | user_id             | profiles(id)          | CASCADE   |

### Cascade Implications

- **Deleting a user** (`auth.users`): Cascades to `profiles`, which cascades to `tickets`, `debts`
- **Deleting a unit**: Cascades to `charges`, `reservations`, `poll_responses`
- **Deleting an amenity**: Cascades to `reservation_types` and `reservations`
- **Deleting a poll**: Cascades to `poll_options` and `poll_responses`

---

## 6. RPC Functions

### Reservation Management

#### request_reservation

**Signature**:

```sql
request_reservation(
  p_amenity_id BIGINT,
  p_type_id BIGINT,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_form_data JSONB DEFAULT '{}'
) RETURNS BIGINT
```

**Purpose**: Residents request a reservation. Checks for morosity (unpaid debts) and assigns to caller's unit.

**Security**: Authenticated users only

**Business Logic**:

1. Validates user has an assigned unit
2. Checks for unpaid common expenses or parking debts (morosity check)
3. Blocks morose units from reserving
4. Snapshots fee/deposit amounts from reservation type
5. Creates reservation with status 'REQUESTED'
6. Returns new reservation ID

**Example**:

```typescript
const { data, error } = await supabase.rpc('request_reservation', {
  p_amenity_id: 1,
  p_type_id: 2,
  p_start_at: '2026-01-27T10:00:00Z',
  p_end_at: '2026-01-27T14:00:00Z',
  p_form_data: { guests: 5, event_type: 'Cumpleaños' },
});
```

---

#### approve_reservation

**Signature**:

```sql
approve_reservation(p_reservation_id BIGINT) RETURNS VOID
```

**Purpose**: Admin approves a pending reservation and creates payment charges.

**Security**: Admin only

**Business Logic**:

1. Changes status to 'APPROVED_PENDING_PAYMENT'
2. Creates two charges:
   - `RESERVATION_FEE` (amount from fee_snapshot)
   - `RESERVATION_DEPOSIT` (amount from deposit_snapshot)
3. Idempotent via unique constraint (safe to call multiple times)

**Example**:

```typescript
await supabase.rpc('approve_reservation', { p_reservation_id: 123 });
```

---

#### cancel_reservation

**Signature**:

```sql
cancel_reservation(p_reservation_id BIGINT) RETURNS VOID
```

**Purpose**: User cancels their own reservation.

**Security**: Only reservation owner (via unit_id) can cancel

**Business Logic**:

- Sets status to 'CANCELLED'
- Cancels associated pending charges

---

#### create_system_reservation

**Signature**:

```sql
create_system_reservation(
  p_amenity_id BIGINT,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_reason TEXT
) RETURNS JSONB
```

**Purpose**: Admin creates maintenance/system blocks (e.g., cleaning, repairs).

**Security**: Admin only

**Business Logic**:

- Sets `is_system = TRUE`, `unit_id = NULL`
- Auto-confirmed (no payment needed)
- Blocks time slots via exclusion constraint

---

### Financial Management

#### confirm_charge_payment

**Signature**:

```sql
confirm_charge_payment(
  p_charge_id UUID,
  p_method TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS JSONB
```

**Purpose**: Admin confirms a payment for a charge.

**Security**: Admin only

**Business Logic**:

1. Updates charge status to 'PAID' and sets `paid_at`
2. Creates payment record
3. Idempotent (safe to call multiple times via unique constraint on charge_id)
4. **Triggers**: If all reservation charges are paid, auto-confirms reservation

**Returns**: `{ charge_id, payment_id, reservation_confirmed }`

**Example**:

```typescript
const { data } = await supabase.rpc('confirm_charge_payment', {
  p_charge_id: 'uuid-here',
  p_method: 'Transferencia',
  p_note: 'Comprobante #12345',
});
```

---

#### decide_deposit

**Signature**:

```sql
decide_deposit(
  p_reservation_id BIGINT,
  p_decision deposit_decision_type,
  p_retained_amount NUMERIC DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
```

**Purpose**: Admin decides to release or retain deposit after reservation completion.

**Security**: Admin only

**Business Logic**:

1. Validates reservation is COMPLETED or NO_SHOW
2. If RELEASE: Updates deposit charge to 'RELEASED'
3. If RETAIN_PARTIAL or RETAIN_FULL:
   - Creates FINE charge for retained amount (revenue recognition)
   - Updates deposit charge to 'RETAINED'
4. Records decision in `deposit_decisions` table

**Returns**: `{ decision_id, retention_charge_id }`

**Example**:

```typescript
// Full retention
await supabase.rpc('decide_deposit', {
  p_reservation_id: 123,
  p_decision: 'RETAIN_FULL',
  p_reason: 'Daño en mobiliario',
});

// Partial retention
await supabase.rpc('decide_deposit', {
  p_reservation_id: 124,
  p_decision: 'RETAIN_PARTIAL',
  p_retained_amount: 20000,
  p_reason: 'Limpieza extraordinaria',
});
```

---

#### get_financial_kpis

**Signature**:

```sql
get_financial_kpis(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
) RETURNS JSONB
```

**Purpose**: Calculate financial KPIs for admin dashboard.

**Security**: Admin only

**Returns**:

```json
{
  "total_collected": 1500000,
  "deposits_custody": 45000,
  "pending_review_count": 3,
  "total_expenses_approved": 800000
}
```

**KPIs Explained**:

- `total_collected`: Sum of paid charges (excluding deposits) in period
- `deposits_custody`: Sum of paid deposits not yet released/retained
- `pending_review_count`: Count of expenses with status 'En Revision'
- `total_expenses_approved`: Sum of approved expenses in period

---

#### report_incident

**Signature**:

```sql
report_incident(
  p_reservation_id BIGINT,
  p_description TEXT,
  p_amount NUMERIC,
  p_evidence_url TEXT DEFAULT NULL
) RETURNS JSONB
```

**Purpose**: Admin reports an incident and generates a fine charge.

**Security**: Admin only

**Business Logic**:

1. Creates incident record with status='CHARGED'
2. Creates FINE charge linked to incident
3. FINE charge is immediately marked as PAID (revenue recognition)

**Returns**: `{ incident_id, charge_id }`

---

### Voting System

#### create_poll

**Signature**:

```sql
create_poll(
  p_question TEXT,
  p_options TEXT[],
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_strategy weighting_strategy,
  p_show_results_when poll_results_visibility
) RETURNS JSONB
```

**Purpose**: Admin creates a new poll.

**Security**: Admin only

**Business Logic**:

1. Validates dates (end_at > start_at)
2. If strategy='ALICUOTA', snapshots all unit weights
3. Creates poll_options records from array
4. Returns poll_id

**Example**:

```typescript
const { data } = await supabase.rpc('create_poll', {
  p_question: '¿Aprobar presupuesto 2026?',
  p_options: ['Sí', 'No', 'Abstención'],
  p_start_at: '2026-02-01T00:00:00Z',
  p_end_at: '2026-02-15T23:59:59Z',
  p_strategy: 'ALICUOTA',
  p_show_results_when: 'CLOSED',
});
```

---

#### submit_vote

**Signature**:

```sql
submit_vote(
  p_poll_id BIGINT,
  p_option_id BIGINT
) RETURNS JSONB
```

**Purpose**: Resident submits vote.

**Security**: Authenticated users with assigned units

**Business Logic**:

1. Validates poll is active (current time between start_at and end_at)
2. Calculates vote weight:
   - UNIT strategy: weight = 1
   - ALICUOTA strategy: weight = unit's alicuota from snapshot
3. Creates poll_response (unique constraint prevents double-voting)
4. Returns weight_used

**Example**:

```typescript
const { data } = await supabase.rpc('submit_vote', {
  p_poll_id: 1,
  p_option_id: 2,
});
// Returns: { weight_used: 5.5 }
```

---

#### get_poll_results

**Signature**:

```sql
get_poll_results(p_poll_id BIGINT)
RETURNS TABLE(
  option_id BIGINT,
  option_text TEXT,
  votes_count BIGINT,
  weighted_sum NUMERIC,
  percentage NUMERIC
)
```

**Purpose**: Get aggregated poll results.

**Security**: Visibility controlled by `show_results_when`:

- LIVE: Visible while poll open
- CLOSED: Visible only after poll closes

**Returns**: Table with one row per option

**Example**:

```typescript
const { data } = await supabase.rpc('get_poll_results', { p_poll_id: 1 });
// Returns:
// [
//   { option_id: 1, option_text: 'Sí', votes_count: 12, weighted_sum: 65.5, percentage: 65.5 },
//   { option_id: 2, option_text: 'No', votes_count: 7, weighted_sum: 34.5, percentage: 34.5 }
// ]
```

---

## 7. Triggers

### handle_new_user

**Event**: AFTER INSERT ON `auth.users`

**Purpose**: Auto-create profile when user signs up.

**Logic**:

```sql
INSERT INTO public.profiles (id, email, role)
VALUES (NEW.id, NEW.email, 'resident');
```

---

### confirm_reservation_payment

**Event**: AFTER UPDATE OF status ON `charges`

**Purpose**: Auto-confirm reservation when all charges paid.

**Logic**:

1. Triggered when a charge status changes to 'PAID'
2. Checks if charge is for a reservation (reference_type = 'RESERVATION')
3. Checks if ALL charges for that reservation are paid
4. If yes, updates reservation status to 'CONFIRMED'

---

### prevent_role_escalation

**Event**: BEFORE UPDATE ON `profiles`

**Purpose**: Prevent non-admins from promoting themselves to admin.

**Logic**:

```sql
IF OLD.role != NEW.role AND NOT is_admin() THEN
  RAISE EXCEPTION 'Only admins can change roles';
END IF;
```

---

## 8. Constraints

### Check Constraints

| Table             | Constraint                   | Rule                                                    |
| ----------------- | ---------------------------- | ------------------------------------------------------- |
| reservations      | check_dates                  | `end_at > start_at`                                     |
| reservations      | check_system_unit            | If is_system=TRUE → unit_id=NULL, else unit_id NOT NULL |
| deposit_decisions | check_retained_reason        | If RETAIN → reason required                             |
| deposit_decisions | deposit_retained_nonnegative | `retained_amount >= 0`                                  |
| polls             | check_close_reason           | If closed → reason required                             |
| charges           | amount_nonnegative           | `amount >= 0`                                           |

### Unique Constraints

| Table             | Columns                                                 | Purpose                                 |
| ----------------- | ------------------------------------------------------- | --------------------------------------- |
| profiles          | email                                                   | One email per user                      |
| units             | name                                                    | Unique unit identifiers                 |
| poll_responses    | (poll_id, unit_id)                                      | One vote per unit per poll              |
| poll_options      | (poll_id, option_index)                                 | Ordered options                         |
| deposit_decisions | reservation_id                                          | One decision per reservation            |
| charges           | (reference_id, type) WHERE reference_type='RESERVATION' | One FEE and one DEPOSIT per reservation |
| payments          | charge_id                                               | One payment record per charge           |

### Exclusion Constraint

**Table**: `reservations`

**Name**: `reservations_no_overlap_excl`

**Purpose**: Prevents double-booking of amenities using temporal ranges.

**Definition**:

```sql
EXCLUDE USING gist (
  amenity_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (
  is_system = true
  OR status IN ('REQUESTED','APPROVED_PENDING_PAYMENT','CONFIRMED')
)
```

**Explanation**:

- Uses `btree_gist` extension for range exclusion
- `tstzrange(start_at, end_at, '[)')`: Half-open interval [start, end)
- `&&`: Range overlap operator
- Only applies to active reservations and system blocks
- Allows overlaps for CANCELLED, REJECTED, COMPLETED, NO_SHOW

**Example Conflict**:

```sql
-- Insert 1: OK
INSERT INTO reservations (amenity_id, start_at, end_at, status)
VALUES (1, '2026-01-27 10:00', '2026-01-27 14:00', 'CONFIRMED');

-- Insert 2: FAILS (overlaps)
INSERT INTO reservations (amenity_id, start_at, end_at, status)
VALUES (1, '2026-01-27 12:00', '2026-01-27 16:00', 'CONFIRMED');
-- ERROR: conflicting key value violates exclusion constraint
```

---

## 9. Indexes

### Performance Indexes

| Index                                   | Table                | Columns                        | Purpose                        |
| --------------------------------------- | -------------------- | ------------------------------ | ------------------------------ |
| idx_charges_unit_status                 | charges              | (unit_id, status)              | Filter pending charges by unit |
| idx_charges_reference                   | charges              | (reference_type, reference_id) | Lookup charges by reference    |
| idx_charges_created_at                  | charges              | (created_at DESC)              | Recent charges query           |
| idx_charges_paid_at                     | charges              | (paid_at) WHERE status='PAID'  | Paid charges analytics         |
| idx_payments_periodo_fecha              | payments             | (periodo, fecha_pago)          | Period-based reports           |
| idx_common_expense_debts_unpaid_by_user | common_expense_debts | (user_id) WHERE pagado=false   | Morosity check                 |
| idx_parking_debts_unpaid_by_user        | parking_debts        | (user_id) WHERE pagado=false   | Morosity check                 |
| idx_profiles_role                       | profiles             | (role)                         | is_admin() lookups             |

### Implicit Indexes

- All primary keys have implicit indexes
- All unique constraints have implicit indexes
- Foreign keys do NOT have automatic indexes (consider adding if slow)

---

## 10. Row-Level Security

RLS is **enabled** on all tables. Policies enforce data isolation.

### Policy Pattern

```sql
-- Example: charges table
-- Residents see only their unit's charges
CREATE POLICY "residents_own_unit_charges" ON charges
  FOR SELECT
  TO authenticated
  USING (
    unit_id IN (
      SELECT unit_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins see all
CREATE POLICY "admins_all_charges" ON charges
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

### is_admin() Helper

```sql
CREATE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

**Why SECURITY DEFINER**: Avoids RLS recursion. Function executes with owner's privileges, bypassing RLS on `profiles` table.

### Policy Summary by Table

| Table                | Residents                             | Admins      |
| -------------------- | ------------------------------------- | ----------- |
| profiles             | Read all, update own (role protected) | Full access |
| units                | Read all                              | Full access |
| amenities            | Read all                              | Full access |
| reservation_types    | Read all                              | Full access |
| reservations         | Read all, create own, update own      | Full access |
| charges              | Read own unit                         | Full access |
| payments             | Read own                              | Full access |
| deposit_decisions    | Read own reservations                 | Full access |
| incidents            | Read own reservations                 | Full access |
| polls                | Read all                              | Full access |
| poll_options         | Read all                              | Full access |
| poll_responses       | Read own, insert own                  | Read all    |
| tickets              | Read own, create own                  | Full access |
| notices              | Read published                        | Full access |
| expenses             | Read all                              | Full access |
| financial_statements | Read all                              | Full access |
| community_settings   | Read all                              | Update all  |

---

## 11. Business Rules

### Morosity Prevention

**Rule**: Users with unpaid debts cannot make reservations.

**Implementation**: `request_reservation()` RPC checks:

```sql
-- Check common expense debts
SELECT COUNT(*) FROM common_expense_debts
WHERE user_id = caller_user_id AND pagado = false;

-- Check parking debts
SELECT COUNT(*) FROM parking_debts
WHERE user_id = caller_user_id AND pagado = false;

-- If count > 0, raise exception
```

**Scope**: Applied at unit level (all residents in unit must be current).

---

### Reservation Workflow

```
User Action          Status                  Admin Action
──────────────────────────────────────────────────────────
request_reservation  → REQUESTED
                                           → approve_reservation
                     → APPROVED_PENDING_PAYMENT
pay fee + deposit    → (trigger)
                     → CONFIRMED
event occurs         → (admin marks)
                     → COMPLETED / NO_SHOW
                                           → decide_deposit
deposit decision     → (charge RELEASED/RETAINED)
```

---

### Deposit Retention as Revenue

When deposits are retained:

1. Admin calls `decide_deposit(RETAIN_FULL/RETAIN_PARTIAL)`
2. A new **FINE** charge is created for retained amount
3. FINE charge is immediately marked as **PAID** (revenue recognition)
4. Original deposit charge status becomes **RETAINED** (no longer in custody)

**Accounting**:

- **Deposits in custody**: `SELECT SUM(amount) FROM charges WHERE type='RESERVATION_DEPOSIT' AND status='PAID'`
- **Revenue from retentions**: `SELECT SUM(amount) FROM charges WHERE type='FINE' AND status='PAID'`

---

### Anti-Double-Booking

**Mechanism**: Exclusion constraint on `reservations` table.

**How it works**:

- Uses `tstzrange` (timestamp with timezone range)
- Checks for overlap (`&&` operator) on same amenity_id
- Only enforced for active statuses

**Edge Cases Handled**:

- Cancelled reservations don't block (status = 'CANCELLED' excluded from constraint)
- System blocks prevent user reservations (is_system = true included)
- Partial overlaps detected (e.g., 10:00-14:00 vs 12:00-16:00)

---

### Voting Weight Mechanics

**UNIT Strategy**:

```sql
weight = 1  -- Every unit gets equal vote
```

**ALICUOTA Strategy**:

```sql
weight = unit.alicuota  -- Vote weighted by ownership %
```

**Weight Snapshot**: Taken at poll creation to prevent manipulation.

**Example**:

- Unit 101: alicuota = 5.5%
- Unit 102: alicuota = 4.2%
- Poll: "Approve budget" (ALICUOTA strategy)
- Unit 101 votes "Yes" → weight_used = 5.5
- Unit 102 votes "No" → weight_used = 4.2
- Result: 56.8% Yes, 43.2% No

---

### Concurrency Control

**Lock Timeouts**:

```sql
SET lock_timeout = '5s';
SET statement_timeout = '10s';
```

**Row Locking**: Critical RPCs use `FOR UPDATE` to prevent race conditions.

**Idempotent Operations**:

- `confirm_charge_payment()`: Safe to call multiple times (unique constraint on charge_id)
- `approve_reservation()`: Safe to call multiple times (unique constraint on reservation charges)

---

## 12. Migration Guide

### Applying Migrations

Using Supabase CLI:

```bash
# Install CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Apply specific migration
supabase db push --file supabase/migrations/20260106_voting_module.sql
```

### Creating New Migrations

```bash
# Generate new migration file
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
# Then apply
supabase db push
```

### Migration Naming Convention

Format: `YYYYMMDD_description.sql`

Examples:

- `20260106_voting_module.sql`
- `20260107_fix_rls_security.sql`
- `20260110_deposit_retention_revenue.sql`

### Migration Best Practices

1. **Idempotent**: Use `IF NOT EXISTS` and `IF EXISTS`
2. **Transactional**: Wrap in `BEGIN; ... COMMIT;`
3. **Backwards Compatible**: Don't break existing queries
4. **Test Locally**: Use Supabase local development
5. **Version Control**: Commit migrations with code changes

### Rollback Strategy

PostgreSQL migrations are **not automatically reversible**. Options:

1. **Manual Rollback SQL**: Create a separate rollback migration
2. **Point-in-Time Recovery**: Use Supabase backups
3. **Schema Versioning**: Maintain separate schemas for rollback

---

## Appendices

### Appendix A: Quick Reference

**Table Count**: 20 tables
**RPC Functions**: 15 functions
**Enums**: 8 custom types
**Triggers**: 3 triggers
**Indexes**: 8 performance indexes
**Migration Files**: 39 files

**Tables by Category**:

- Core: 3 tables
- Financial: 7 tables
- Reservations: 5 tables
- Voting: 3 tables
- Communication: 2 tables

---

### Appendix B: Common Queries

**Get all unpaid charges for a unit**:

```sql
SELECT * FROM charges
WHERE unit_id = 5
  AND status = 'PENDING'
ORDER BY created_at DESC;
```

**Calculate total deposits in custody**:

```sql
SELECT SUM(amount) as total_custody
FROM charges
WHERE type = 'RESERVATION_DEPOSIT'
  AND status = 'PAID';
```

**Check reservation availability**:

```sql
SELECT * FROM reservations
WHERE amenity_id = 1
  AND status IN ('REQUESTED', 'APPROVED_PENDING_PAYMENT', 'CONFIRMED')
  AND tstzrange(start_at, end_at, '[)') && tstzrange('2026-01-27 10:00'::timestamptz, '2026-01-27 14:00'::timestamptz, '[)');
```

**Get poll results**:

```sql
SELECT
  po.option_text,
  COUNT(pr.id) as votes,
  SUM(pr.weight_used) as weighted_total,
  ROUND(100.0 * SUM(pr.weight_used) / SUM(SUM(pr.weight_used)) OVER (), 2) as percentage
FROM poll_responses pr
JOIN poll_options po ON po.id = pr.option_id
WHERE pr.poll_id = 1
GROUP BY po.option_text
ORDER BY weighted_total DESC;
```

**Find morose units**:

```sql
SELECT DISTINCT u.id, u.name
FROM units u
JOIN profiles p ON p.unit_id = u.id
WHERE p.id IN (
  SELECT user_id FROM common_expense_debts WHERE pagado = false
  UNION
  SELECT user_id FROM parking_debts WHERE pagado = false
);
```

---

### Appendix C: ER Diagram Legend

**Symbols**:

- `PK`: Primary Key
- `FK`: Foreign Key
- `→`: References
- `1:1`: One-to-One relationship
- `1:M`: One-to-Many relationship
- `M:1`: Many-to-One relationship

**Cascade Actions**:

- `CASCADE`: Delete child records when parent deleted
- `SET NULL`: Set FK to NULL when parent deleted

---

_Document maintained by the development team. Last review: January 2026._
_Based on 39 migration files totaling 3,009 lines of SQL._
