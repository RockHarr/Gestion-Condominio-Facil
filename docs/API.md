# API Reference

**Gestion Condominio Facil**  
Complete reference for the application's service layer (Authentication and Data Access).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication Service](#2-authentication-service)
3. [Data Service](#3-data-service)
4. [Type Definitions](#4-type-definitions)
5. [Error Handling](#5-error-handling)
6. [Best Practices](#6-best-practices)

---

## 1. Overview

### Service Architecture

The application follows a **Service Layer Pattern** to abstract Supabase interactions:

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
│  (Pages, Modals, Forms - UI Layer)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ imports
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  authService     │         │  dataService             │ │
│  │  (services/      │         │  (services/data.ts)      │ │
│  │   auth.ts)       │         │                          │ │
│  │                  │         │  - Tickets               │ │
│  │  - signIn        │         │  - Notices               │ │
│  │  - signOut       │         │  - Expenses              │ │
│  │  - updatePassword│         │  - Reservations          │ │
│  │  - getCurrentUser│         │  - Payments              │ │
│  │  - onChange      │         │  - Polls                 │ │
│  └──────────────────┘         │  - Users (Admin)         │ │
│                                └──────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Client (lib/supabase.ts)              │
│  - PostgreSQL Database Access                               │
│  - Authentication (Magic Link + Password)                   │
│  - Row-Level Security (RLS)                                 │
│  - Remote Procedure Calls (RPC)                             │
└─────────────────────────────────────────────────────────────┘
```

### Benefits

1. **Separation of Concerns**: UI logic separate from data access
2. **Testability**: Services can be mocked for testing
3. **Type Safety**: Full TypeScript coverage with strict types
4. **Error Handling**: Centralized error handling and timeouts
5. **Reusability**: Services used across multiple components

### File Structure

```
src/
├── services/
│   ├── auth.ts         # Authentication operations
│   └── data.ts         # Data access operations (CRUD)
├── lib/
│   └── supabase.ts     # Supabase client initialization
└── types.ts            # TypeScript type definitions
```

---

## 2. Authentication Service

**File**: `services/auth.ts`  
**Exports**: `authService`, `AuthUser`

### 2.1 Type Definitions

```typescript
export interface AuthUser {
  id: string;
  email?: string;
  role?: 'resident' | 'admin';
  nombre?: string;
  unidad?: string;
  has_parking?: boolean;
}
```

### 2.2 Methods

#### signIn(email: string)

Sign in with **Magic Link** (passwordless authentication).

**Parameters:**

- `email` (string): User's email address

**Returns:**

```typescript
Promise<{
  data: { user: User | null; session: Session | null };
  error: AuthError | null;
}>;
```

**Usage:**

```typescript
import { authService } from './services/auth';

const { data, error } = await authService.signIn('admin@condominio.cl');

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Magic link sent to:', data.user?.email);
  alert('Check your email for the login link!');
}
```

**Notes:**

- User receives email with login link
- Redirects to `window.location.origin` after successful login
- No password required (easier for non-technical users)

---

#### signInWithPassword(email: string, password: string)

Sign in with **email and password**.

**Parameters:**

- `email` (string): User's email address
- `password` (string): User's password

**Returns:**

```typescript
Promise<{
  data: { user: User | null; session: Session | null };
  error: Error | null;
}>;
```

**Usage:**

```typescript
const { data, error } = await authService.signInWithPassword(
  'admin@condominio.cl',
  'securePassword123',
);

if (error) {
  alert('Invalid credentials');
} else {
  console.log('Logged in as:', data.user?.email);
}
```

**Features:**

- 60-second timeout protection (prevents hanging on slow networks)
- Graceful error handling
- Returns `{ user: null, session: null }` on timeout

---

#### signOut()

Sign out the current user.

**Parameters:** None

**Returns:**

```typescript
Promise<{ error: AuthError | null }>;
```

**Usage:**

```typescript
const { error } = await authService.signOut();

if (!error) {
  console.log('User signed out successfully');
  // Redirect to login page
  setCurrentPage('login');
}
```

**Side Effects:**

- Clears local session
- Triggers `onAuthStateChange` listeners with `SIGNED_OUT` event
- User profile data cleared from state

---

#### updatePassword(password: string)

Update the current user's password.

**Parameters:**

- `password` (string): New password

**Returns:**

```typescript
Promise<{
  data: { user: User | null };
  error: Error | null;
}>;
```

**Usage:**

```typescript
const { data, error } = await authService.updatePassword('newSecurePassword');

if (error) {
  alert('Error updating password: ' + error.message);
} else {
  alert('Password updated successfully!');
}
```

**Requirements:**

- User must be authenticated
- Password must meet Supabase strength requirements (configurable in dashboard)
- 60-second timeout protection

---

#### getCurrentUser()

Fetch the current authenticated user and their profile.

**Parameters:** None

**Returns:**

```typescript
Promise<{
  user: User;
  profile: ProfileRow;
} | null>;
```

**Usage:**

```typescript
const result = await authService.getCurrentUser();

if (result) {
  console.log('User ID:', result.user.id);
  console.log('Profile:', result.profile.nombre, result.profile.unidad);
  console.log('Role:', result.profile.role);
} else {
  console.log('No user logged in');
}
```

**Performance:**

- Uses `getSession()` instead of `getUser()` for faster initial load
- Reads session from localStorage (instant, no network request)
- Fetches profile from `profiles` table in single query

**Returns `null` when:**

- No user is logged in
- Session expired
- Error fetching profile

---

#### onAuthStateChange(callback: (user: AuthUser | null) => void)

Listen to authentication state changes.

**Parameters:**

- `callback` (function): Called when auth state changes

**Returns:**

```typescript
{
  data: {
    subscription: Subscription;
  }
}
```

**Usage:**

```typescript
useEffect(() => {
  const {
    data: { subscription },
  } = authService.onAuthStateChange((user) => {
    if (user) {
      console.log('User signed in:', user.nombre);
      setUser(user);
      setCurrentPage('home');
    } else {
      console.log('User signed out');
      setUser(null);
      setCurrentPage('login');
    }
  });

  // Cleanup on unmount
  return () => subscription.unsubscribe();
}, []);
```

**Events Handled:**

- `SIGNED_IN`: User logged in
- `SIGNED_OUT`: User logged out
- `TOKEN_REFRESHED`: Session refreshed (automatic)
- `INITIAL_SESSION`: App loaded with existing session
- `PASSWORD_RECOVERY`: Ignored (to avoid state thrashing)

**Profile Fetch Strategy:**

1. On sign-in, attempts to fetch profile from `profiles` table
2. If profile not found (e.g., trigger latency), applies **optimistic update**:
   ```typescript
   {
     id: user.id,
     email: user.email,
     role: 'resident',  // Default prediction
     nombre: user.email?.split('@')[0] || 'Usuario',
     unidad: 'Sin Asignar'
   }
   ```
3. Real profile data loads in background and updates UI

---

## 3. Data Service

**File**: `services/data.ts`  
**Exports**: `dataService`

All methods use `withTimeout()` helper (10-second default) to prevent hanging requests.

### 3.1 Tickets Module

#### getTickets(userId?: string | number)

Fetch all support tickets (with user info).

**Parameters:**

- `userId` (optional): Filter by user ID (currently not implemented)

**Returns:**

```typescript
Promise<Ticket[]>;
```

**Usage:**

```typescript
const tickets = await dataService.getTickets();

tickets.forEach((ticket) => {
  console.log(`[${ticket.estado}] ${ticket.titulo}`);
  console.log(`  Reported by: ${ticket.user?.nombre} (${ticket.user?.unidad})`);
});
```

**Query:**

```sql
SELECT tickets.*, profiles.nombre, profiles.unidad
FROM tickets
LEFT JOIN profiles ON tickets.user_id = profiles.id
ORDER BY created_at DESC;
```

---

#### createTicket(ticket: Omit<Ticket, 'id' | 'fecha' | 'user' | 'estado'>, userId: string)

Create a new support ticket.

**Parameters:**

- `ticket.titulo` (string): Ticket title
- `ticket.descripcion` (string): Ticket description
- `userId` (string): ID of user creating ticket

**Returns:**

```typescript
Promise<TicketRow>;
```

**Usage:**

```typescript
const newTicket = await dataService.createTicket(
  {
    titulo: 'Luz del pasillo no funciona',
    descripcion: 'La luz del piso 3, lado norte, está quemada.',
  },
  user.id,
);

console.log('Ticket created with ID:', newTicket.id);
```

**Default Values:**

- `estado`: 'Nuevo'
- `fecha`: Current timestamp (auto-set by database)

---

#### updateTicketStatus(id: number, estado: TicketStatus)

Update ticket status (Admin only).

**Parameters:**

- `id` (number): Ticket ID
- `estado` (TicketStatus): New status ('Nuevo' | 'En Proceso' | 'Resuelto' | 'Cerrado')

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.updateTicketStatus(42, TicketStatus.RESUELTO);
console.log('Ticket marked as resolved');
```

**RLS:** Requires admin role.

---

### 3.2 Notices Module

#### getNotices()

Fetch all community notices.

**Returns:**

```typescript
Promise<Notice[]>;
```

**Usage:**

```typescript
const notices = await dataService.getNotices();

const published = notices.filter((n) => n.status === 'Publicado');
console.log(`${published.length} published notices`);
```

---

#### createNotice(notice: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>)

Create a new notice (draft).

**Parameters:**

- `notice.titulo` (string): Notice title
- `notice.contenido` (string): Notice content
- `notice.tipo` (NoticeType): 'Emergencia' | 'Mantenimiento' | 'Comunidad'

**Returns:**

```typescript
Promise<Notice>;
```

**Usage:**

```typescript
const notice = await dataService.createNotice({
  titulo: 'Corte de Agua Programado',
  contenido: 'El día 15 de febrero habrá corte de agua de 9:00 a 13:00.',
  tipo: NoticeType.MANTENIMIENTO,
});

console.log('Notice created (draft):', notice.id);
```

**Default Values:**

- `status`: 'Borrador' (must be approved by admin to publish)

---

#### approveNotice(id: number)

Publish a notice (Admin only).

**Parameters:**

- `id` (number): Notice ID

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.approveNotice(123);
console.log('Notice published');
```

**Effect:** Sets `status = 'Publicado'`, making it visible to all residents.

---

### 3.3 Expenses Module

#### getExpenses()

Fetch all community expenses.

**Returns:**

```typescript
Promise<Expense[]>;
```

**Usage:**

```typescript
const expenses = await dataService.getExpenses();

const approved = expenses.filter((e) => e.status === 'Aprobado');
const total = approved.reduce((sum, e) => sum + e.monto, 0);

console.log(`Total approved expenses: $${total.toLocaleString()}`);
```

---

#### addExpense(expense: Omit<Expense, 'id' | 'status' | 'fecha' | 'motivoRechazo'>)

Submit a new expense for review.

**Parameters:**

- `descripcion` (string): Expense description
- `monto` (number): Amount
- `categoria` (ExpenseCategory): 'Mantenimiento' | 'Administracion' | 'Suministros' | 'Seguridad' | 'Otros'
- `proveedor` (optional string): Vendor name
- `numeroDocumento` (optional string): Invoice number
- `evidenciaUrl` (optional string): Receipt URL

**Returns:**

```typescript
Promise<Expense>;
```

**Usage:**

```typescript
const expense = await dataService.addExpense({
  descripcion: 'Reparación de portón principal',
  monto: 150000,
  categoria: ExpenseCategory.MANTENIMIENTO,
  proveedor: 'Cerrajería El Candado',
  numeroDocumento: 'FAC-2025-0042',
});

console.log('Expense submitted for review:', expense.id);
```

**Default Values:**

- `status`: 'En Revision'
- `fecha`: Current date (YYYY-MM-DD)

---

#### approveExpense(id: number)

Approve an expense (Admin only).

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.approveExpense(42);
console.log('Expense approved');
```

**Effect:** Sets `status = 'Aprobado'`. Expense is now included in financial statements.

---

#### rejectExpense(id: number, motivo: string)

Reject an expense with reason (Admin only).

**Parameters:**

- `id` (number): Expense ID
- `motivo` (string): Rejection reason

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.rejectExpense(42, 'Falta evidencia del pago');
console.log('Expense rejected');
```

---

### 3.4 Payments Module

#### getPaymentHistory(userId?: string | number)

Fetch payment history.

**Parameters:**

- `userId` (optional): Filter by user ID

**Returns:**

```typescript
Promise<PaymentRecord[]>;
```

**Usage:**

```typescript
const payments = await dataService.getPaymentHistory(user.id);

payments.forEach((p) => {
  console.log(`${p.periodo}: $${p.monto} (${p.metodoPago})`);
});
```

---

#### registerPayment(payment: Omit<PaymentRecord, 'id'>)

Register a payment (Admin only - used for payment entry).

**Parameters:**

- `userId` (string | number): User ID
- `type` (PaymentType): 'Gasto Común' | 'Estacionamiento' | 'Reserva' | 'Uso de Espacio'
- `periodo` (string): Payment period (YYYY-MM)
- `monto` (number): Amount
- `fechaPago` (string): Payment date (YYYY-MM-DD)
- `metodoPago` (optional PaymentMethod): 'Transferencia' | 'Efectivo' | 'Cheque' | 'Otro'
- `observacion` (optional string): Notes

**Returns:**

```typescript
Promise<PaymentRow>;
```

**Usage:**

```typescript
await dataService.registerPayment({
  userId: 'abc123',
  type: PaymentType.GASTO_COMUN,
  periodo: '2025-02',
  monto: 85000,
  fechaPago: '2025-02-10',
  metodoPago: PaymentMethod.TRANSFERENCIA,
  observacion: 'Transferencia desde Banco Estado',
});

console.log('Payment registered successfully');
```

**Effect:**

- Creates record in `payments` table
- Does NOT automatically mark debts as paid (admin must reconcile)

---

#### getCommonExpenseDebts(userId?: string | number)

Fetch common expense debts.

**Returns:**

```typescript
Promise<CommonExpenseDebt[]>;
```

**Usage:**

```typescript
const debts = await dataService.getCommonExpenseDebts(user.id);

const pending = debts.filter((d) => !d.pagado);
const total = pending.reduce((sum, d) => sum + d.monto, 0);

console.log(`Pending debt: $${total.toLocaleString()}`);
```

---

#### getParkingDebts(userId?: string | number)

Fetch parking debts.

**Returns:**

```typescript
Promise<ParkingDebt[]>;
```

**Usage:**

```typescript
const parkingDebts = await dataService.getParkingDebts(user.id);
```

---

#### payAllDebts(userId: string | number)

Mark all debts as paid for a user (for testing/admin).

**Parameters:**

- `userId` (string | number): User ID

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.payAllDebts(user.id);
console.log('All debts marked as paid');
```

**Warning:** This is a convenience method, not for production payment flows.

---

### 3.5 Reservations Module

#### getAmenities()

Fetch all amenities (Quincho, Piscina, etc.).

**Returns:**

```typescript
Promise<Amenity[]>;
```

**Usage:**

```typescript
const amenities = await dataService.getAmenities();

amenities.forEach((a) => {
  console.log(`${a.name}: Capacity ${a.capacity} people`);
});
```

---

#### getReservations()

Fetch all reservations with user data.

**Returns:**

```typescript
Promise<Reservation[]>;
```

**Usage:**

```typescript
const reservations = await dataService.getReservations();

const upcoming = reservations.filter(
  (r) => new Date(r.startAt) > new Date() && r.status === 'CONFIRMED',
);

console.log(`${upcoming.length} upcoming reservations`);
```

**Implementation Note:**

- Uses **manual join** to avoid Supabase PGRST200 error (foreign key constraint issue)
- Fetches reservations separately, then fetches profiles, then combines data

---

#### createReservation(reservation: Pick<Reservation, 'amenityId' | 'startAt' | 'endAt'>)

Request a new reservation (calls `request_reservation` RPC).

**Parameters:**

- `amenityId` (string): Amenity ID
- `startAt` (string): Start time (ISO 8601)
- `endAt` (string): End time (ISO 8601)

**Returns:**

```typescript
Promise<number>; // Reservation ID
```

**Usage:**

```typescript
try {
  const reservationId = await dataService.createReservation({
    amenityId: 'quincho',
    startAt: '2025-02-15T18:00:00',
    endAt: '2025-02-15T22:00:00',
  });

  console.log('Reservation created:', reservationId);
} catch (error) {
  if (error.message.includes('overlap')) {
    alert('This time slot is already booked');
  } else {
    alert('Error creating reservation: ' + error.message);
  }
}
```

**Business Rules (enforced by RPC):**

- No overlapping reservations
- Respects amenity availability hours
- Creates associated charges (fee + deposit)
- Requires approval if `requires_approval = true` on reservation type

---

#### createReservationAsAdmin(amenityId: string, userId: string, startAt: string, endAt: string)

Create reservation on behalf of a user (Admin only).

**Parameters:**

- `amenityId` (string): Amenity ID
- `userId` (string): User ID
- `startAt` (string): Start time (ISO 8601)
- `endAt` (string): End time (ISO 8601)

**Returns:**

```typescript
Promise<number>; // Reservation ID
```

**Usage:**

```typescript
await dataService.createReservationAsAdmin(
  'sala_eventos',
  'user-123',
  '2025-03-01T10:00:00',
  '2025-03-01T14:00:00',
);

console.log('Admin created reservation for user');
```

**Use Cases:**

- User requested reservation offline (phone call)
- Admin blocking time for maintenance (use `createSystemReservation` instead)

---

#### approveReservation(id: number)

Approve a pending reservation (Admin only).

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.approveReservation(42);
console.log('Reservation approved');
```

**Effect:**

- Status: `REQUESTED` → `APPROVED_PENDING_PAYMENT`
- User can now pay to confirm

---

#### rejectReservation(id: number)

Reject a reservation (Admin only).

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.rejectReservation(42);
console.log('Reservation rejected');
```

**Effect:**

- Status: `REQUESTED` → `REJECTED`
- Associated charges cancelled

---

#### cancelReservation(id: number)

Cancel a reservation (calls `cancel_reservation` RPC).

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.cancelReservation(42);
console.log('Reservation cancelled');
```

**Business Rules:**

- Releases deposit if already paid
- Cancels pending charges
- Cannot cancel after start time

---

#### confirmReservationPayment(reservationId: number, payment: Omit<PaymentRecord, 'id'>)

Confirm payment for a reservation (Admin only).

**Parameters:**

- `reservationId` (number): Reservation ID
- `payment`: Payment details (metodoPago, observacion, etc.)

**Returns:**

```typescript
Promise<{ success: boolean; message?: string }>;
```

**Usage:**

```typescript
await dataService.confirmReservationPayment(42, {
  userId: user.id,
  type: PaymentType.RESERVA,
  periodo: '2025-02',
  monto: 25000,
  fechaPago: '2025-02-10',
  metodoPago: PaymentMethod.TRANSFERENCIA,
  observacion: 'Quincho - 15 Feb',
});

console.log('Payment confirmed, reservation status updated');
```

**Effect:**

- Marks associated charges as PAID
- Updates reservation status: `APPROVED_PENDING_PAYMENT` → `CONFIRMED`

---

#### createSystemReservation(amenityId: number, startAt: string, endAt: string, reason: string)

Block time for maintenance/system use (Admin only).

**Parameters:**

- `amenityId` (number): Amenity ID
- `startAt` (string): Start time (ISO 8601)
- `endAt` (string): End time (ISO 8601)
- `reason` (string): Reason for blocking (e.g., "Mantenimiento de piscina")

**Returns:**

```typescript
Promise<number>; // Reservation ID
```

**Usage:**

```typescript
await dataService.createSystemReservation(
  1, // Piscina
  '2025-02-20T08:00:00',
  '2025-02-20T18:00:00',
  'Limpieza profunda y recambio de filtros',
);

console.log('Amenity blocked for maintenance');
```

**Effect:**

- Creates reservation with `is_system = true`
- No charges created
- Shows as "Blocked" in calendar

---

### 3.6 Advanced Reservation Features

#### decideDeposit(reservationId: number, decision: 'RELEASE' | 'RETAIN_PARTIAL' | 'RETAIN_FULL', retainedAmount?: number, reason?: string)

Decide deposit fate after reservation (Admin only).

**Parameters:**

- `reservationId` (number): Reservation ID
- `decision`: 'RELEASE' | 'RETAIN_PARTIAL' | 'RETAIN_FULL'
- `retainedAmount` (optional number): Amount to retain (required for RETAIN_PARTIAL)
- `reason` (optional string): Reason for retention

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
// Full refund
await dataService.decideDeposit(42, 'RELEASE');

// Partial retention
await dataService.decideDeposit(42, 'RETAIN_PARTIAL', 10000, 'Limpieza extra requerida');

// Full retention
await dataService.decideDeposit(42, 'RETAIN_FULL', undefined, 'Daños graves al mobiliario');
```

**Business Rules:**

- Can only decide after reservation end time
- Retained amount becomes revenue
- Released amount returns to resident's balance

---

#### reportIncident(reservationId: number, description: string, amount: number, evidenceUrl?: string)

Report damage/incident during reservation (Admin only).

**Parameters:**

- `reservationId` (number): Reservation ID
- `description` (string): Incident description
- `amount` (number): Fine/repair cost
- `evidenceUrl` (optional string): Photo evidence URL

**Returns:**

```typescript
Promise<number>; // Incident ID
```

**Usage:**

```typescript
const incidentId = await dataService.reportIncident(
  42,
  'Mesa rota en esquina noreste del quincho',
  35000,
  'https://storage.supabase.co/evidence/photo123.jpg',
);

console.log('Incident reported, fine charged:', incidentId);
```

**Effect:**

- Creates incident record
- Creates FINE charge for the unit
- Can be used to justify deposit retention

---

### 3.7 Charges Module

#### getPendingChargesByUnit(unitId: number)

Fetch pending charges for a unit.

**Returns:**

```typescript
Promise<Charge[]>;
```

**Usage:**

```typescript
const charges = await dataService.getPendingChargesByUnit(101);

const total = charges.reduce((sum, c) => sum + c.amount, 0);
console.log(`Total pending charges: $${total.toLocaleString()}`);
```

---

#### getChargesByReservation(reservationId: number)

Fetch charges associated with a reservation.

**Returns:**

```typescript
Promise<Charge[]>;
```

**Usage:**

```typescript
const charges = await dataService.getChargesByReservation(42);

const fee = charges.find((c) => c.type === 'RESERVATION_FEE');
const deposit = charges.find((c) => c.type === 'RESERVATION_DEPOSIT');

console.log(`Fee: $${fee?.amount}, Deposit: $${deposit?.amount}`);
```

---

#### confirmChargePayment(chargeId: string, method: string, note?: string)

Confirm payment of a charge (calls RPC).

**Parameters:**

- `chargeId` (string): Charge UUID
- `method` (string): Payment method
- `note` (optional string): Payment notes

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.confirmChargePayment('abc-def-ghi-jkl', 'Transferencia', 'Comprobante N° 12345');

console.log('Charge marked as paid');
```

**Effect:**

- Updates charge status: PENDING → PAID
- Sets `paid_at` timestamp
- If all charges for a reservation are paid, reservation status updates to CONFIRMED

---

### 3.8 Voting/Polls Module

#### getPolls()

Fetch all polls.

**Returns:**

```typescript
Promise<Poll[]>;
```

**Usage:**

```typescript
const polls = await dataService.getPolls();

const active = polls.filter(
  (p) => new Date(p.startAt) <= new Date() && new Date(p.endAt) >= new Date(),
);

console.log(`${active.length} active polls`);
```

---

#### createPoll(question: string, options: string[], startAt: string, endAt: string, strategy: 'UNIT' | 'ALICUOTA', showResultsWhen: 'LIVE' | 'CLOSED')

Create a new poll (Admin only).

**Parameters:**

- `question` (string): Poll question
- `options` (string[]): Array of options (e.g., ['Sí', 'No', 'Abstención'])
- `startAt` (string): Start date (ISO 8601)
- `endAt` (string): End date (ISO 8601)
- `strategy` ('UNIT' | 'ALICUOTA'): Voting weight strategy
- `showResultsWhen` ('LIVE' | 'CLOSED'): When to show results

**Returns:**

```typescript
Promise<number>; // Poll ID
```

**Usage:**

```typescript
const pollId = await dataService.createPoll(
  '¿Aprobar instalación de paneles solares?',
  ['Sí', 'No', 'Abstención'],
  '2025-03-01T00:00:00',
  '2025-03-15T23:59:59',
  'ALICUOTA', // Weight by ownership percentage
  'CLOSED', // Show results only after poll closes
);

console.log('Poll created:', pollId);
```

**Voting Strategies:**

- **UNIT**: One vote per unit (equal weight)
- **ALICUOTA**: Vote weighted by ownership percentage (legal requirement in Chile)

---

#### submitVote(pollId: number, optionId: number)

Submit a vote (one vote per unit).

**Parameters:**

- `pollId` (number): Poll ID
- `optionId` (number): Option ID (from `poll_options` table)

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
try {
  await dataService.submitVote(5, 12);
  alert('Vote submitted successfully');
} catch (error) {
  if (error.message.includes('already voted')) {
    alert('You have already voted in this poll');
  }
}
```

**Business Rules:**

- One vote per unit per poll (enforced by unique constraint)
- Can change vote by submitting again (updates existing record)
- Weight calculated based on poll strategy

---

#### getPollResults(pollId: number)

Fetch poll results (respects `showResultsWhen` setting).

**Returns:**

```typescript
Promise<PollResult[]>;
```

**Usage:**

```typescript
const results = await dataService.getPollResults(5);

results.forEach((r) => {
  console.log(`${r.option_text}: ${r.vote_count} votes (${r.weight_sum}% weight)`);
});
```

---

#### closePollEarly(pollId: number, reason: string)

Close poll before end date (Admin only).

**Parameters:**

- `pollId` (number): Poll ID
- `reason` (string): Reason for early closure

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.closePollEarly(5, 'Quorum alcanzado antes de tiempo');
console.log('Poll closed early');
```

---

### 3.9 Financial Module

#### getFinancialKpis(periodStart: string, periodEnd: string)

Fetch financial KPIs for a period (Admin only).

**Parameters:**

- `periodStart` (string): Start date (YYYY-MM-DD)
- `periodEnd` (string): End date (YYYY-MM-DD)

**Returns:**

```typescript
Promise<FinancialKpis>;

interface FinancialKpis {
  total_collected: number;
  deposits_custody: number;
  pending_review_count: number;
  total_expenses_approved: number;
}
```

**Usage:**

```typescript
const kpis = await dataService.getFinancialKpis('2025-02-01', '2025-02-28');

console.log(`Collected: $${kpis.total_collected.toLocaleString()}`);
console.log(`Deposits in custody: $${kpis.deposits_custody.toLocaleString()}`);
console.log(`Expenses pending review: ${kpis.pending_review_count}`);
console.log(`Approved expenses: $${kpis.total_expenses_approved.toLocaleString()}`);
```

---

#### closeMonthAndGenerateStatement()

Close current month and generate financial statement (Admin only).

**Returns:**

```typescript
Promise<FinancialStatement | null>;
```

**Usage:**

```typescript
const statement = await dataService.closeMonthAndGenerateStatement();

if (statement) {
  console.log(`Statement generated for ${statement.mes}`);
  console.log(`Income: $${statement.ingresos.toLocaleString()}`);
  console.log(`Expenses: $${statement.egresos.toLocaleString()}`);
  console.log(`Balance: $${statement.saldo.toLocaleString()}`);
} else {
  console.log('No approved expenses to close');
}
```

**Process:**

1. Sum all approved expenses for current month → `egresos`
2. Sum all payments for current month → `ingresos`
3. Calculate balance: `previous_balance + ingresos - egresos`
4. Generate debts for all residents (common expense + parking)
5. Create `financial_statements` record

**Debt Calculation:**

- Common Expense: `(total_egresos * alicuota) / 100`
- Parking: Fixed amount from `community_settings.parking_cost_amount`

---

### 3.10 Users/Profiles Module (Admin)

#### getUsers()

Fetch all user profiles.

**Returns:**

```typescript
Promise<ProfileRow[]>;
```

**Usage:**

```typescript
const users = await dataService.getUsers();

const residents = users.filter((u) => u.role === 'resident');
const admins = users.filter((u) => u.role === 'admin');

console.log(`${residents.length} residents, ${admins.length} admins`);
```

---

#### updateUser(id: string | number, updates: Partial<User>)

Update user profile (Admin only).

**Parameters:**

- `id` (string | number): User ID
- `updates`: Fields to update (nombre, unidad, hasParking, etc.)

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.updateUser('abc123', {
  nombre: 'Juan Pérez',
  unidad: '302',
  hasParking: true,
});

console.log('User updated');
```

**Notes:**

- `email` field is ignored (cannot update via profiles table)
- `alicuota` field is currently ignored (column doesn't exist yet - temporary fix)
- `hasParking` is converted to `has_parking` for database

---

#### deleteUser(id: string | number)

Delete user profile (Admin only).

**Parameters:**

- `id` (string | number): User ID

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.deleteUser('abc123');
console.log('User deleted');
```

**Warning:**

- Does NOT delete user from `auth.users` (requires Admin API)
- Only deletes from `profiles` table
- User can still log in but will have no profile

---

### 3.11 Settings Module (Admin)

#### getSettings()

Fetch community settings.

**Returns:**

```typescript
Promise<CommunitySettings>;

interface CommunitySettings {
  commonExpense: number;
  parkingCost: number;
}
```

**Usage:**

```typescript
const settings = await dataService.getSettings();

console.log(`Common expense base: $${settings.commonExpense.toLocaleString()}`);
console.log(`Parking cost: $${settings.parkingCost.toLocaleString()}`);
```

**Fallback:**

- If no settings found in database, returns defaults:
  ```typescript
  { commonExpense: 50000, parkingCost: 10000 }
  ```

---

#### updateCommunitySettings(settings: CommunitySettings)

Update community settings (Admin only).

**Parameters:**

- `settings`: New settings values

**Returns:**

```typescript
Promise<void>;
```

**Usage:**

```typescript
await dataService.updateCommunitySettings({
  commonExpense: 55000,
  parkingCost: 12000,
});

console.log('Settings updated');
```

---

## 4. Type Definitions

**File**: `types.ts`

### Core Types

#### User

```typescript
interface User {
  id: number | string;
  nombre: string;
  unidad: string;
  role: 'resident' | 'admin';
  hasParking: boolean;
  email?: string;
  alicuota?: number; // Ownership percentage (0-100)
}
```

#### Ticket

```typescript
interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string; // ISO 8601
  estado: TicketStatus;
  foto?: string; // base64 encoded
  user?: Pick<User, 'id' | 'nombre' | 'unidad'>;
}

enum TicketStatus {
  NUEVO = 'Nuevo',
  EN_PROCESO = 'En Proceso',
  RESUELTO = 'Resuelto',
  CERRADO = 'Cerrado',
}
```

#### Notice

```typescript
interface Notice {
  id: number;
  titulo: string;
  contenido: string;
  fecha: string;
  tipo: NoticeType;
  leido: boolean;
  status: NoticeStatus;
}

enum NoticeType {
  EMERGENCIA = 'Emergencia',
  MANTENIMIENTO = 'Mantenimiento',
  COMUNIDAD = 'Comunidad',
}

enum NoticeStatus {
  BORRADOR = 'Borrador',
  PUBLICADO = 'Publicado',
}
```

#### Reservation

```typescript
interface Reservation {
  id: number;
  amenityId: string;
  typeId?: number;
  unitId?: number;
  userId?: string;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  status: ReservationStatus;
  isSystem: boolean;
  systemReason?: string;
  formData?: FormData;
  feeSnapshot?: number;
  depositSnapshot?: number;
  user?: {
    nombre: string;
    unidad: string;
  };
}

enum ReservationStatus {
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  APPROVED_PENDING_PAYMENT = 'APPROVED_PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}
```

#### PaymentRecord

```typescript
interface PaymentRecord {
  id: number;
  userId: number | string;
  type: PaymentType;
  periodo: string; // YYYY-MM
  monto: number;
  fechaPago: string; // YYYY-MM-DD
  metodoPago?: PaymentMethod;
  observacion?: string;
}

enum PaymentType {
  GASTO_COMUN = 'Gasto Común',
  ESTACIONAMIENTO = 'Estacionamiento',
  RESERVA = 'Reserva',
  USO_ESPACIO = 'Uso de Espacio',
}

enum PaymentMethod {
  TRANSFERENCIA = 'Transferencia',
  EFECTIVO = 'Efectivo',
  CHEQUE = 'Cheque',
  OTRO = 'Otro',
}
```

#### Expense

```typescript
interface Expense {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  categoria: ExpenseCategory;
  status: ExpenseStatus;
  proveedor?: string;
  numeroDocumento?: string;
  evidenciaUrl?: string;
  motivoRechazo?: string;
}

enum ExpenseCategory {
  MANTENIMIENTO = 'Mantenimiento',
  ADMINISTRACION = 'Administracion',
  SUMINISTROS = 'Suministros',
  SEGURIDAD = 'Seguridad',
  OTROS = 'Otros',
}

enum ExpenseStatus {
  EN_REVISION = 'En Revision',
  APROBADO = 'Aprobado',
  RECHAZADO = 'Rechazado',
}
```

### Database Row Types

These types represent raw data from Supabase (snake_case) before mapping to camelCase:

```typescript
interface TicketRow {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado: string;
  foto?: string;
  user_id?: string;
  user?: { nombre: string; unidad: string } | null;
}

interface PaymentRow {
  id: number;
  user_id: string | number;
  type: string;
  periodo: string;
  monto: number;
  fecha_pago: string;
  metodo_pago?: string;
  observacion?: string;
}

interface ReservationRow {
  id: number;
  amenity_id: string;
  type_id?: number;
  unit_id?: number;
  user_id?: string;
  start_at: string;
  end_at: string;
  status: string;
  is_system: boolean;
  system_reason?: string;
  form_data?: FormData;
  fee_snapshot?: number;
  deposit_snapshot?: number;
}

interface ProfileRow {
  id: string;
  nombre: string;
  unidad: string;
  role: 'resident' | 'admin';
  has_parking: boolean;
  email?: string;
  alicuota?: number;
}
```

### Helper Functions

#### getErrorMessage(error: unknown): string

Extract error message from any error type.

**Usage:**

```typescript
try {
  await dataService.createTicket(ticket, user.id);
} catch (error) {
  const message = getErrorMessage(error);
  alert('Error: ' + message);
}
```

---

## 5. Error Handling

### Timeout Protection

All `dataService` methods use `withTimeout()` helper (10-second default):

```typescript
const withTimeout = async <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]) as Promise<T>;
};
```

**Usage:**

```typescript
try {
  const tickets = await dataService.getTickets();
} catch (error) {
  if (error.message === 'Request timed out') {
    alert('Server is taking too long to respond. Please check your connection.');
  } else {
    alert('Error loading tickets: ' + getErrorMessage(error));
  }
}
```

### Common Errors

#### RLS Policy Violation

```typescript
// Error: new row violates row-level security policy for table "payments"

// Cause: User trying to insert data they don't have permission for
// Solution: Check user role and permissions

if (user.role !== 'admin') {
  alert('Only admins can register payments');
  return;
}
```

#### Foreign Key Constraint

```typescript
// Error: insert or update on table "reservations" violates foreign key constraint

// Cause: Invalid amenity_id or user_id
// Solution: Verify IDs exist before inserting

const amenity = amenities.find((a) => a.id === selectedAmenityId);
if (!amenity) {
  alert('Invalid amenity selected');
  return;
}
```

#### Unique Constraint Violation

```typescript
// Error: duplicate key value violates unique constraint "poll_responses_poll_unit_key"

// Cause: User voting twice in same poll
// Solution: Update existing vote instead of inserting

// The submitVote RPC handles this automatically (upsert)
await dataService.submitVote(pollId, optionId); // Safe to call multiple times
```

### Best Practices

#### 1. Always Handle Errors

```typescript
// ❌ Bad
const tickets = await dataService.getTickets();

// ✅ Good
try {
  const tickets = await dataService.getTickets();
  setTickets(tickets);
} catch (error) {
  console.error('Error loading tickets:', error);
  alert('Failed to load tickets. Please try again.');
  setTickets([]);
}
```

#### 2. Provide User Feedback

```typescript
// ✅ Good
const handleSubmit = async () => {
  setLoading(true);
  try {
    await dataService.createTicket(ticket, user.id);
    alert('Ticket created successfully!');
    setCurrentPage('tickets');
  } catch (error) {
    alert('Error creating ticket: ' + getErrorMessage(error));
  } finally {
    setLoading(false);
  }
};
```

#### 3. Validate Before API Calls

```typescript
// ✅ Good
const handleRegisterPayment = async () => {
  if (!selectedUser) {
    alert('Please select a user');
    return;
  }

  if (amount <= 0) {
    alert('Amount must be greater than 0');
    return;
  }

  try {
    await dataService.registerPayment({
      userId: selectedUser.id,
      type: PaymentType.GASTO_COMUN,
      periodo: period,
      monto: amount,
      fechaPago: date,
      metodoPago: method,
    });
    alert('Payment registered');
  } catch (error) {
    alert('Error: ' + getErrorMessage(error));
  }
};
```

---

## 6. Best Practices

### 6.1 Authentication

#### Store User in State

```typescript
const [user, setUser] = useState<AuthUser | null>(null);

useEffect(() => {
  const {
    data: { subscription },
  } = authService.onAuthStateChange(setUser);
  return () => subscription.unsubscribe();
}, []);
```

#### Check Auth Before Rendering

```typescript
if (!user) {
  return <LoginPage />;
}

if (user.role === 'admin') {
  return <AdminDashboard />;
} else {
  return <ResidentHome />;
}
```

### 6.2 Data Fetching

#### Use `useEffect` for Initial Load

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const [tickets, notices, reservations] = await Promise.all([
        dataService.getTickets(),
        dataService.getNotices(),
        dataService.getReservations(),
      ]);
      setTickets(tickets);
      setNotices(notices);
      setReservations(reservations);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  loadData();
}, []);
```

#### Parallel Fetching

```typescript
// ✅ Good: Fetch in parallel
const [users, expenses, payments] = await Promise.all([
  dataService.getUsers(),
  dataService.getExpenses(),
  dataService.getPaymentHistory(),
]);

// ❌ Bad: Sequential (slower)
const users = await dataService.getUsers();
const expenses = await dataService.getExpenses();
const payments = await dataService.getPaymentHistory();
```

### 6.3 Optimistic Updates

```typescript
const handleApproveExpense = async (expenseId: number) => {
  // 1. Update UI immediately
  setExpenses((prev) =>
    prev.map((e) => (e.id === expenseId ? { ...e, status: ExpenseStatus.APROBADO } : e)),
  );

  try {
    // 2. Persist to database
    await dataService.approveExpense(expenseId);
  } catch (error) {
    // 3. Revert on error
    alert('Error approving expense');
    const freshExpenses = await dataService.getExpenses();
    setExpenses(freshExpenses);
  }
};
```

### 6.4 Type Safety

```typescript
// ✅ Good: Use enums
await dataService.updateTicketStatus(id, TicketStatus.RESUELTO);

// ❌ Bad: Magic strings
await dataService.updateTicketStatus(id, 'Resuelto'); // Typo-prone
```

### 6.5 Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await dataService.createNotice(notice);
    alert('Notice created');
  } catch (error) {
    alert('Error: ' + getErrorMessage(error));
  } finally {
    setLoading(false);  // Always reset loading state
  }
};

return (
  <button onClick={handleSubmit} disabled={loading}>
    {loading ? 'Creating...' : 'Create Notice'}
  </button>
);
```

### 6.6 Avoid N+1 Queries

```typescript
// ❌ Bad: N+1 queries
const reservations = await dataService.getReservations();
for (const reservation of reservations) {
  const charges = await dataService.getChargesByReservation(reservation.id); // N queries
}

// ✅ Good: Batch fetch
const reservations = await dataService.getReservations();
const allCharges = await Promise.all(
  reservations.map((r) => dataService.getChargesByReservation(r.id)),
);
```

---

## Appendix A: Service Method Reference

### Authentication Service (6 methods)

| Method               | Parameters      | Returns                   | Auth Required | Admin Only |
| -------------------- | --------------- | ------------------------- | ------------- | ---------- |
| `signIn`             | email           | AuthResponse              | No            | No         |
| `signInWithPassword` | email, password | AuthResponse              | No            | No         |
| `signOut`            | -               | { error }                 | Yes           | No         |
| `updatePassword`     | password        | UserResponse              | Yes           | No         |
| `getCurrentUser`     | -               | { user, profile } \| null | Yes           | No         |
| `onAuthStateChange`  | callback        | Subscription              | No            | No         |

### Data Service (45+ methods)

#### Tickets (3 methods)

- `getTickets(userId?)`
- `createTicket(ticket, userId)`
- `updateTicketStatus(id, estado)`

#### Notices (3 methods)

- `getNotices()`
- `createNotice(notice)`
- `approveNotice(id)` 🔒

#### Expenses (4 methods)

- `getExpenses()`
- `addExpense(expense)`
- `approveExpense(id)` 🔒
- `rejectExpense(id, motivo)` 🔒

#### Payments (5 methods)

- `getPaymentHistory(userId?)`
- `registerPayment(payment)` 🔒
- `getCommonExpenseDebts(userId?)`
- `getParkingDebts(userId?)`
- `payAllDebts(userId)` 🔒

#### Reservations (10 methods)

- `getAmenities()`
- `getReservations()`
- `createReservation(reservation)`
- `createReservationAsAdmin(...)` 🔒
- `approveReservation(id)` 🔒
- `rejectReservation(id)` 🔒
- `cancelReservation(id)`
- `confirmReservationPayment(id, payment)` 🔒
- `createSystemReservation(...)` 🔒
- `decideDeposit(...)` 🔒

#### Charges (4 methods)

- `getPendingChargesByUnit(unitId)`
- `getChargesByReservation(reservationId)`
- `getChargesByReference(type, id)`
- `confirmChargePayment(chargeId, method, note?)`

#### Incidents (1 method)

- `reportIncident(reservationId, description, amount, evidenceUrl?)` 🔒

#### Polls (6 methods)

- `getPolls()`
- `createPoll(...)` 🔒
- `submitVote(pollId, optionId)`
- `getPollResults(pollId)`
- `getPollOptions(pollId)`
- `getMyVote(pollId)`
- `closePollEarly(pollId, reason)` 🔒

#### Financial (2 methods)

- `getFinancialKpis(periodStart, periodEnd)` 🔒
- `closeMonthAndGenerateStatement()` 🔒

#### Users (3 methods)

- `getUsers()` 🔒
- `updateUser(id, updates)` 🔒
- `deleteUser(id)` 🔒

#### Settings (2 methods)

- `getSettings()`
- `updateCommunitySettings(settings)` 🔒

🔒 = Admin only (enforced by RLS policies)

---

## Appendix B: RPC Functions

The following methods call PostgreSQL RPC functions (see `docs/DATABASE.md` for details):

| Method                     | RPC Function                  | Description                        |
| -------------------------- | ----------------------------- | ---------------------------------- |
| `createReservation`        | `request_reservation`         | Request amenity reservation        |
| `createReservationAsAdmin` | `create_reservation_as_admin` | Admin creates reservation for user |
| `cancelReservation`        | `cancel_reservation`          | Cancel reservation and refund      |
| `approveReservation`       | `approve_reservation`         | Approve pending reservation        |
| `confirmChargePayment`     | `confirm_charge_payment`      | Mark charge as paid                |
| `createSystemReservation`  | `create_system_reservation`   | Block amenity for maintenance      |
| `decideDeposit`            | `decide_deposit`              | Release or retain deposit          |
| `reportIncident`           | `report_incident`             | Report damage and create fine      |
| `createPoll`               | `create_poll`                 | Create voting poll                 |
| `submitVote`               | `submit_vote`                 | Submit poll vote                   |
| `closePollEarly`           | `close_poll_early`            | Close poll before end date         |
| `getFinancialKpis`         | `get_financial_kpis`          | Fetch financial KPIs               |
| `getPollResults`           | `get_poll_results`            | Fetch poll results                 |

---

## Appendix C: Example Component Integration

### Full Example: Ticket Creation Flow

```typescript
import { useState } from 'react';
import { dataService } from '../services/data';
import { getErrorMessage } from '../types';
import type { AuthUser } from '../services/auth';

interface TicketCreatePageProps {
  user: AuthUser;
  onBack: () => void;
}

export function TicketCreatePage({ user, onBack }: TicketCreatePageProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!titulo.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!descripcion.trim()) {
      alert('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      // Call service
      await dataService.createTicket(
        { titulo, descripcion },
        user.id
      );

      // Success
      alert('Ticket created successfully!');
      onBack();
    } catch (error) {
      // Error handling
      console.error('Error creating ticket:', error);
      alert('Error creating ticket: ' + getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Create Ticket</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>
        <button type="button" onClick={onBack} disabled={loading}>
          Cancel
        </button>
      </form>
    </div>
  );
}
```

---

**Document Version**: 1.0  
**Last Updated**: January 26, 2026  
**Maintained By**: Development Team

For database schema details, see `docs/DATABASE.md`.  
For architecture overview, see `docs/ARCHITECTURE.md`.  
For deployment guide, see `docs/DEPLOYMENT.md`.
