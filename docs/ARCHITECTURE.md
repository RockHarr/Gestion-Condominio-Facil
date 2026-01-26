# Architecture Document

> Gestion Condominio Facil - Technical Architecture
> Version: 1.0 | Last Updated: January 2026

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Component Architecture](#4-component-architecture)
5. [Data Flow](#5-data-flow)
6. [State Management](#6-state-management)
7. [Technology Stack](#7-technology-stack)
8. [Design Decisions](#8-design-decisions)
9. [Performance Considerations](#9-performance-considerations)
10. [Future Improvements](#10-future-improvements)

---

## 1. Overview

**Gestion Condominio Facil** is a Single Page Application (SPA) for condominium management built with React and Supabase. It provides two distinct user experiences:

- **Residents**: View debts, make payments, create tickets, book amenities, participate in polls
- **Administrators**: Manage finances, approve expenses, handle reservations, configure settings

### Key Characteristics

| Aspect             | Description                                |
| ------------------ | ------------------------------------------ |
| **Architecture**   | Component-based SPA with Service Layer     |
| **Backend**        | Supabase (PostgreSQL + Auth + Realtime)    |
| **Authentication** | Supabase Auth with Magic Link and Password |
| **Authorization**  | Row-Level Security (RLS) at database level |
| **Deployment**     | Vercel (static hosting with SPA routing)   |

---

## 2. System Architecture

```
+------------------------------------------------------------------+
|                         CLIENT (Browser)                          |
|  +-------------------------------------------------------------+  |
|  |                    React Application                        |  |
|  |  +------------------+  +------------------+                 |  |
|  |  |   AdminApp       |  |   ResidentApp    |                 |  |
|  |  |   (Role: admin)  |  |   (Role: resident)|                |  |
|  |  +--------+---------+  +--------+---------+                 |  |
|  |           |                     |                           |  |
|  |           +----------+----------+                           |  |
|  |                      |                                      |  |
|  |              +-------v-------+                              |  |
|  |              |    App.tsx    |  (State Management)          |  |
|  |              +-------+-------+                              |  |
|  |                      |                                      |  |
|  |  +-------------------v-------------------+                  |  |
|  |  |           Service Layer              |                  |  |
|  |  |  +-------------+  +-------------+    |                  |  |
|  |  |  | auth.ts     |  | data.ts     |    |                  |  |
|  |  |  +-------------+  +-------------+    |                  |  |
|  |  +-------------------+-------------------+                  |  |
|  |                      |                                      |  |
|  |              +-------v-------+                              |  |
|  |              | lib/supabase  |  (Supabase Client)           |  |
|  |              +-------+-------+                              |  |
|  +----------------------|--------------------------------------+  |
+-------------------------|------------------------------------------+
                          | HTTPS
+-------------------------|------------------------------------------+
|                    SUPABASE CLOUD                                  |
|  +----------------------v-----------------------+                  |
|  |              Supabase Auth                  |                  |
|  |  (Magic Link, Password, Session Management) |                  |
|  +---------------------------------------------+                  |
|                                                                    |
|  +---------------------------------------------+                  |
|  |              PostgreSQL Database            |                  |
|  |  +---------------+  +------------------+    |                  |
|  |  | Tables (RLS)  |  | RPC Functions    |    |                  |
|  |  | - profiles    |  | - request_reservation |                  |
|  |  | - tickets     |  | - approve_reservation |                  |
|  |  | - reservations|  | - cancel_reservation  |                  |
|  |  | - charges     |  | - decide_deposit      |                  |
|  |  | - expenses    |  | - create_poll         |                  |
|  |  | - payments    |  | - submit_vote         |                  |
|  |  | - polls       |  | - get_financial_kpis  |                  |
|  |  +---------------+  +------------------+    |                  |
|  +---------------------------------------------+                  |
+--------------------------------------------------------------------+
```

### Layer Responsibilities

| Layer              | Responsibility                                    |
| ------------------ | ------------------------------------------------- |
| **Presentation**   | React components render UI based on props         |
| **Container**      | AdminApp/ResidentApp route to appropriate screens |
| **Orchestration**  | App.tsx manages global state and data loading     |
| **Service**        | auth.ts/data.ts abstract Supabase operations      |
| **Infrastructure** | lib/supabase.ts initializes client connection     |
| **Database**       | PostgreSQL with RLS enforces business rules       |

---

## 3. Directory Structure

```
/
├── .github/
│   └── workflows/           # CI/CD (Playwright tests)
│       └── playwright.yml
│
├── components/              # React UI Components
│   ├── AdminApp.tsx         # Admin container/router
│   ├── ResidentApp.tsx      # Resident container/router
│   ├── AdminDashboard.tsx   # Admin main view
│   ├── HomeScreen.tsx       # Resident main view
│   ├── *Screen.tsx          # Feature screens
│   ├── *Modal.tsx           # Modal dialogs
│   ├── Shared.tsx           # Reusable UI components
│   └── Icons.tsx            # Icon components
│
├── services/
│   ├── auth.ts              # Authentication service
│   └── data.ts              # Data access service
│
├── lib/
│   └── supabase.ts          # Supabase client init
│
├── supabase/
│   ├── migrations/          # SQL schema migrations
│   └── scripts/             # DB utility scripts
│
├── tests/
│   └── e2e/                 # Playwright E2E tests
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # This file
│   ├── CONTRIBUTING.md      # Developer guide
│   ├── DATABASE.md          # Schema documentation
│   └── ...
│
├── scripts/                 # Dev/QA utilities
│
├── App.tsx                  # Main application component
├── index.tsx                # React entry point
├── types.ts                 # TypeScript definitions
├── data.ts                  # Legacy mock data
├── vite.config.ts           # Build configuration
└── playwright.config.ts     # Test configuration
```

### Component Organization

Components follow a **flat structure** organized by feature:

```
components/
├── Admin*                   # Admin-only components
│   ├── AdminApp.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminTickets.tsx
│   ├── AdminNotices.tsx
│   ├── AdminUnits.tsx
│   ├── AdminPaymentEntry.tsx
│   ├── AdminReservationsInbox.tsx
│   ├── AdminPollsManager.tsx
│   └── AdminSettings.tsx
│
├── Resident Screens         # Resident-facing screens
│   ├── HomeScreen.tsx
│   ├── PaymentsScreen.tsx
│   ├── TicketsScreen.tsx
│   ├── NoticesScreen.tsx
│   ├── AmenitiesScreen.tsx
│   ├── ReservationsScreen.tsx
│   └── PollsScreen.tsx
│
├── Shared                   # Cross-cutting components
│   ├── Shared.tsx           # Card, Button, Header, Toast
│   ├── Icons.tsx            # SVG icon components
│   ├── FinancialCharts.tsx  # Recharts visualizations
│   └── ErrorBoundary.tsx    # React error boundary
│
└── Modals                   # Dialog components
    ├── *Modal.tsx
    └── PaymentReceiptModal.tsx
```

---

## 4. Component Architecture

### Component Hierarchy

```
index.tsx
└── React.StrictMode
    └── ErrorBoundary
        └── App.tsx (State Orchestrator)
            │
            ├── [!currentUser] LoginScreen
            │
            ├── [role=admin] AdminApp
            │   ├── AdminSidebar (desktop)
            │   ├── AdminTabBar (mobile)
            │   └── Screen (based on page state)
            │       ├── AdminDashboard
            │       ├── AdminTicketsScreen
            │       ├── AdminNoticesScreen
            │       ├── AdminUnitsScreen
            │       ├── AdminPaymentEntry
            │       ├── AdminReservationsInbox
            │       ├── AdminPollsManager
            │       └── ProfileScreen
            │
            └── [role=resident] ResidentApp
                ├── Header
                ├── ResidentTabBar
                └── Screen (based on page state)
                    ├── HomeScreen
                    ├── PaymentsScreen
                    ├── TicketsScreen
                    ├── NoticesScreen
                    ├── AmenitiesScreen
                    ├── ReservationsScreen
                    ├── PollsScreen
                    └── ProfileScreen
```

### Shared Components (Shared.tsx)

| Component        | Purpose                   | Props                            |
| ---------------- | ------------------------- | -------------------------------- |
| `Card`           | Container with shadow     | children, className              |
| `Button`         | Styled button             | variant, onClick, disabled       |
| `Header`         | Page header with back nav | title, onBack, rightContent      |
| `Toast`          | Notification popup        | message, type, onClose           |
| `SkeletonLoader` | Loading placeholder       | className                        |
| `EmptyState`     | No data placeholder       | icon, title, description, action |

---

## 5. Data Flow

### Request Flow (Read)

```
User Action
    │
    v
Component calls handler
    │
    v
App.tsx loadData()
    │
    v
dataService.getXxx()
    │
    v
supabase.from('table').select()
    │
    v
Supabase applies RLS
    │
    v
Data returned
    │
    v
App.tsx setState()
    │
    v
Props flow to components
    │
    v
UI re-renders
```

### Request Flow (Write)

```
User submits form
    │
    v
Component calls onXxx prop
    │
    v
App.tsx handler (e.g., addTicket)
    │
    v
dataService.createXxx()
    │
    v
supabase.from('table').insert() or supabase.rpc()
    │
    v
Supabase validates via RLS/constraints
    │
    v
On success: loadData() refreshes state
    │
    v
showToast() displays feedback
```

### Authentication Flow

```
1. User enters email/password
2. authService.signInWithPassword()
3. Supabase returns session + JWT
4. onAuthStateChange() triggers
5. Fetch profile from 'profiles' table
6. Set currentUser state
7. Navigate to role-based home page
8. loadData() fetches role-specific data
```

---

## 6. State Management

### State Location

All application state resides in **App.tsx** using React hooks:

```typescript
// Authentication
const [currentUser, setCurrentUser] = useState<User | null>(null);

// Navigation
const [page, setPage] = useState<Page>('login');
const [pageParams, setPageParams] = useState<PageParams | null>(null);

// Domain Data
const [tickets, setTickets] = useState<Ticket[]>([]);
const [notices, setNotices] = useState<Notice[]>([]);
const [reservations, setReservations] = useState<Reservation[]>([]);
const [amenities, setAmenities] = useState<Amenity[]>([]);
const [expenses, setExpenses] = useState<Expense[]>([]);
const [commonExpenseDebts, setCommonExpenseDebts] = useState<CommonExpenseDebt[]>([]);
const [parkingDebts, setParkingDebts] = useState<ParkingDebt[]>([]);
const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

// Settings
const [settings, setSettings] = useState<CommunitySettings | null>(null);
const [theme, setTheme] = useState<'light' | 'dark'>('light');
```

### Props Distribution Pattern

```
App.tsx
├── currentUser ──────────────────────┐
├── tickets[] ─────────────────────┐  │
├── notices[] ────────────────────┐│  │
├── handleNavigate() ───────────┐ ││  │
├── addTicket() ──────────────┐ │ ││  │
│                             │ │ ││  │
│                             v v vv  v
└──> ResidentApp ─────────> TicketsScreen
         │
         └──> Props drilled to child components
```

### Navigation Pattern

```typescript
type Page = 'login' | 'home' | 'tickets' | 'admin-dashboard' | ...;

const handleNavigate = (newPage: Page, params?: PageParams) => {
    window.scrollTo(0, 0);
    setPage(newPage);
    setPageParams(params);
};

// Usage in component
<Button onClick={() => onNavigate('ticket-detail', { id: ticket.id })}>
```

---

## 7. Technology Stack

### Frontend

| Technology   | Version       | Purpose                 |
| ------------ | ------------- | ----------------------- |
| React        | 19.2.0        | UI framework            |
| TypeScript   | 5.5.4         | Type safety             |
| Vite         | 6.2.0         | Build tool & dev server |
| Recharts     | 3.6.0         | Data visualization      |
| Tailwind CSS | (via classes) | Styling                 |

### Backend (Supabase)

| Component          | Purpose               |
| ------------------ | --------------------- |
| PostgreSQL         | Primary database      |
| Supabase Auth      | Authentication        |
| Row-Level Security | Authorization         |
| RPC Functions      | Business logic        |
| Realtime           | (Future) Live updates |

### Development

| Tool           | Purpose         |
| -------------- | --------------- |
| Playwright     | E2E testing     |
| ESLint         | Code linting    |
| Prettier       | Code formatting |
| GitHub Actions | CI/CD           |

### Deployment

| Service        | Purpose         |
| -------------- | --------------- |
| Vercel         | Static hosting  |
| Supabase Cloud | Database & Auth |

---

## 8. Design Decisions

### Why Supabase?

- **All-in-one BaaS**: Auth, Database, Realtime, Storage
- **PostgreSQL**: Full SQL power with RLS
- **Row-Level Security**: Authorization at data layer
- **Generous free tier**: Suitable for MVP
- **Open source**: No vendor lock-in

### Why No State Management Library?

- **Simplicity**: Props drilling works for current complexity
- **Performance**: React 19's automatic batching
- **Bundle size**: No additional dependency
- **Future**: Context API or Zustand if complexity grows

### Why Flat Component Structure?

- **Discoverability**: Easy to find components
- **Simplicity**: No deep nesting
- **Refactoring**: Easy to move/rename
- **Trade-off**: Less modular than feature folders

### Why Custom Navigation?

- **Simplicity**: No react-router dependency
- **Mobile UX**: TabBar navigation pattern
- **Control**: Full control over transitions
- **Trade-off**: No URL-based routing (acceptable for this app)

---

## 9. Performance Considerations

### Current Optimizations

1. **Parallel Data Fetching**

   ```typescript
   const [notices, amenities, reservations] = await Promise.all([
     dataService.getNotices(),
     dataService.getAmenities(),
     dataService.getReservations(),
   ]);
   ```

2. **Memoization**

   ```typescript
   const unreadNoticesCount = useMemo(() => notices.filter((n) => !n.leido).length, [notices]);
   ```

3. **Request Timeouts**

   ```typescript
   const withTimeout = async <T>(promise, ms = 10000): Promise<T> => {
     return Promise.race([promise, timeout(ms)]);
   };
   ```

4. **Error Isolation**
   ```typescript
   const safeFetch = async <T>(promise, fallback: T): Promise<T> => {
     try {
       return await promise;
     } catch {
       return fallback;
     }
   };
   ```

### Potential Improvements

| Improvement    | Benefit                | Effort |
| -------------- | ---------------------- | ------ |
| React Query    | Caching, deduplication | Medium |
| Code Splitting | Faster initial load    | Low    |
| Virtual Lists  | Handle large datasets  | Low    |
| Service Worker | Offline support        | High   |

---

## 10. Future Improvements

### Short Term

- [ ] Add React Context to reduce props drilling
- [ ] Implement code splitting with React.lazy()
- [ ] Add unit tests for services
- [ ] Create component Storybook

### Medium Term

- [ ] Migrate to feature-based folder structure
- [ ] Add React Query for data fetching
- [ ] Implement optimistic updates
- [ ] Add real-time subscriptions

### Long Term

- [ ] Consider Next.js for SSR/SEO if needed
- [ ] Evaluate React Native for mobile app
- [ ] Add GraphQL layer if queries become complex
- [ ] Implement micro-frontends if team grows

---

## Appendix A: Key Type Definitions

```typescript
// User roles
type Role = 'resident' | 'admin';

// Navigation
type Page = 'login' | 'home' | 'payments' | 'tickets' |
            'admin-dashboard' | 'admin-units' | ...;

interface PageParams {
    id?: number | string;
    ticket?: Ticket;
    user?: User;
    amenityId?: string;
    totalAmount?: number;
    itemsToPay?: PayableItem[];
}

// Domain entities
interface User { id, nombre, unidad, role, hasParking, email }
interface Ticket { id, titulo, descripcion, fecha, estado, user }
interface Reservation { id, amenityId, userId, startAt, endAt, status }
interface Expense { id, descripcion, monto, categoria, status }
interface Charge { id, unitId, amount, type, status, referenceId }
```

See `types.ts` for complete definitions.

---

## Appendix B: Environment Variables

| Variable                 | Required | Description            |
| ------------------------ | -------- | ---------------------- |
| `VITE_SUPABASE_URL`      | Yes      | Supabase project URL   |
| `VITE_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key |

---

_Document maintained by the development team. Last review: January 2026._
