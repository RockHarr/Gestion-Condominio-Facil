# Security Documentation

**Gestion Condominio Facil**  
Comprehensive security guide covering authentication, authorization, data protection, and security best practices.

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Authentication Security](#2-authentication-security)
3. [Authorization & Access Control](#3-authorization--access-control)
4. [Database Security](#4-database-security)
5. [Frontend Security](#5-frontend-security)
6. [API Security](#6-api-security)
7. [Data Privacy & Compliance](#7-data-privacy--compliance)
8. [Network Security](#8-network-security)
9. [Security Checklist](#9-security-checklist)
10. [Incident Response](#10-incident-response)
11. [Security Best Practices](#11-security-best-practices)

---

## 1. Security Overview

### Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
└────────────────────────────────────────────────────────────┘

Layer 1: Network Security
├─ HTTPS/TLS encryption (Vercel + Supabase)
├─ CORS policy
└─ Rate limiting

Layer 2: Authentication
├─ Supabase Auth (JWT tokens)
├─ Magic Link (passwordless)
├─ Password-based login
└─ Session management

Layer 3: Authorization
├─ Row-Level Security (RLS)
├─ Role-Based Access Control (RBAC)
├─ Admin vs Resident permissions
└─ RPC function security (DEFINER vs INVOKER)

Layer 4: Application Security
├─ Input validation
├─ XSS prevention (React auto-escaping)
├─ CSRF protection
└─ Error handling (no sensitive data leaks)

Layer 5: Data Security
├─ Encrypted connections (TLS 1.3)
├─ Database encryption at rest
├─ Audit logs
└─ Backup encryption
```

### Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Users access only what they need
3. **Zero Trust**: Verify every request, even from authenticated users
4. **Fail Secure**: Default to deny access on error
5. **Security by Design**: Security built into architecture, not bolted on

---

## 2. Authentication Security

### 2.1 Authentication Methods

#### Magic Link (Passwordless)

**How it works:**

1. User enters email
2. Supabase sends one-time login link
3. User clicks link → authenticated

**Security Benefits:**

- No password to steal/leak
- Phishing-resistant (unique per-session link)
- Ideal for non-technical users

**Implementation:**

```typescript
// services/auth.ts
async signIn(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { data, error };
}
```

**Configuration (Supabase Dashboard):**

- **Enable Email Auth**: Settings → Authentication → Email Auth
- **Email Templates**: Customize magic link email
- **Link Expiry**: Default 1 hour (configurable)

---

#### Password-Based Authentication

**How it works:**

1. User enters email + password
2. Supabase validates credentials
3. Returns JWT token on success

**Security Features:**

- Password strength requirements (configurable)
- Bcrypt hashing (automatic)
- Rate limiting (automatic)
- 60-second timeout protection (custom)

**Implementation:**

```typescript
// services/auth.ts
async signInWithPassword(email: string, password: string) {
  try {
    const result = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 60000)
      ),
    ]);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    return { data: { user: null, session: null }, error };
  }
}
```

**Password Policy (Recommended):**

- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- No common passwords (configurable in Supabase)

---

### 2.2 Session Management

#### JWT Tokens

**Token Structure:**

```json
{
  "sub": "user-uuid", // User ID
  "email": "user@example.com",
  "role": "authenticated", // Supabase role
  "iat": 1706200000, // Issued at
  "exp": 1706203600 // Expires at (1 hour default)
}
```

**Storage:**

- Tokens stored in **localStorage** (managed by Supabase client)
- Automatic refresh when expired (refresh token flow)

**Token Lifecycle:**

1. User logs in → Access token (1 hour) + Refresh token (30 days)
2. Access token expires → Auto-refresh using refresh token
3. Refresh token expires → User must log in again

**Security Considerations:**

- ✅ **Automatic token refresh** prevents session interruption
- ✅ **Short-lived access tokens** limit damage if stolen
- ⚠️ **localStorage** vulnerable to XSS (mitigated by React's auto-escaping)
- 🔒 **Future Enhancement**: Consider httpOnly cookies for tokens

---

#### Session Invalidation

**Sign Out:**

```typescript
// services/auth.ts
async signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
```

**Effect:**

- Invalidates refresh token in database
- Clears localStorage
- Triggers `SIGNED_OUT` event to clear app state

**Force Sign Out All Users (Admin):**

```sql
-- Emergency use only
SELECT auth.sign_out_all_users();
```

---

### 2.3 Password Security

#### Password Update

```typescript
// services/auth.ts
async updatePassword(password: string) {
  const result = await Promise.race([
    supabase.auth.updateUser({ password: password }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 60000)
    ),
  ]);
  return result;
}
```

**Security Features:**

- Requires active session (cannot change password for other users)
- Password strength validation (enforced by Supabase)
- 60-second timeout protection

**Password Reset Flow:**

1. User requests reset via email
2. Supabase sends reset link
3. User clicks link → Redirected to app with token
4. User enters new password
5. Token invalidated after use

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control (RBAC)

#### User Roles

| Role     | Description                  | Permissions                                      |
| -------- | ---------------------------- | ------------------------------------------------ |
| resident | Regular condominium resident | View own data, create tickets/reservations       |
| admin    | Condominium administrator    | Full access to all data, manage users, approvals |

**Role Assignment:**

- Stored in `profiles.role` column
- Set during user creation (trigger on `auth.users` insert)
- Cannot be changed by users (admin-only operation)

**Role Check:**

```typescript
// In components
if (user.role === 'admin') {
  return <AdminDashboard />;
} else {
  return <ResidentHome />;
}
```

---

### 3.2 Row-Level Security (RLS)

**Overview:**  
RLS is PostgreSQL's native security mechanism that filters database rows based on the authenticated user. Every query is automatically filtered by RLS policies.

**Key Principle:**

> "Even if a malicious user modifies the frontend code, they CANNOT bypass RLS. Security is enforced at the database level, not in the frontend."

---

#### RLS Policies by Table

##### profiles

```sql
-- Everyone can read all profiles (needed for displaying names in UI)
CREATE POLICY "Public read profiles" ON profiles
  FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

**Security Model:**

- ✅ All profiles visible (needed for reservation user names, etc.)
- 🔒 Users cannot edit other users' profiles
- 🔒 Only admins can change roles (requires UPDATE permission via RPC)

---

##### tickets

```sql
-- Users see own tickets, admins see all
CREATE POLICY "Read tickets policy" ON tickets
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can create tickets
CREATE POLICY "Insert tickets policy" ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update/delete tickets
CREATE POLICY "Admin update tickets" ON tickets
  FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Security Model:**

- ✅ Residents see only their own tickets
- ✅ Admins see all tickets
- 🔒 Users cannot modify tickets after creation (admin-only)

---

##### notices

```sql
-- All authenticated users can read published notices
CREATE POLICY "Read published notices" ON notices
  FOR SELECT
  USING (status = 'Publicado');

-- Only admins can create/update/delete notices
CREATE POLICY "Admin all notices" ON notices
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Security Model:**

- ✅ Residents see only published notices (no drafts)
- 🔒 Only admins can manage notices

---

##### reservations

```sql
-- Everyone can read all reservations (needed for calendar view)
CREATE POLICY "Read all reservations" ON reservations
  FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admin all reservations" ON reservations
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Users can create reservations via RPC only
-- (Direct INSERT blocked, must use request_reservation RPC)
```

**Security Model:**

- ✅ All reservations visible (needed for conflict detection in calendar)
- 🔒 Users cannot create reservations directly (must use RPC for business logic)
- 🔒 Only admins can modify/delete reservations

---

##### payments

```sql
-- Users see own payments, admins see all
CREATE POLICY "Read payments policy" ON payments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can insert payments (payment entry)
CREATE POLICY "Admin insert payments" ON payments
  FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Security Model:**

- ✅ Residents see only their payment history
- 🔒 Only admins can register payments

---

##### expenses

```sql
-- Admins can read all expenses
CREATE POLICY "Admin read expenses" ON expenses
  FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admins can create/update expenses
CREATE POLICY "Admin all expenses" ON expenses
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Security Model:**

- 🔒 Only admins can see/manage expenses (financial data)

---

##### common_expense_debts & parking_debts

```sql
-- Users see own debts, admins see all
CREATE POLICY "Read debts policy" ON common_expense_debts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can modify debts
CREATE POLICY "Admin all debts" ON common_expense_debts
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Security Model:**

- ✅ Residents see only their own debts
- 🔒 Only admins can create/modify debts

---

##### charges

```sql
-- Users see own unit's charges, admins see all
CREATE POLICY "Read charges policy" ON charges
  FOR SELECT
  USING (
    unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can create charges
CREATE POLICY "Admin insert charges" ON charges
  FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Security Model:**

- ✅ Residents see only their unit's charges
- 🔒 Only admins can create charges

---

##### polls & poll_responses

```sql
-- All authenticated users can read polls
CREATE POLICY "Read polls" ON polls
  FOR SELECT
  USING (true);

-- Only admins can create/manage polls
CREATE POLICY "Admin all polls" ON polls
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Users see own votes, admins see all
CREATE POLICY "Read responses" ON poll_responses
  FOR SELECT
  USING (
    unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can vote via RPC only (submit_vote)
```

**Security Model:**

- ✅ Everyone sees active polls
- ✅ Residents see only their own votes (secret ballot)
- 🔒 Admins see all votes (for result calculation)
- 🔒 Voting via RPC ensures business rules (one vote per unit)

---

### 3.3 RPC Function Security

**SECURITY DEFINER vs SECURITY INVOKER:**

#### SECURITY DEFINER (Elevated Privileges)

**Usage:**  
Function runs with **database owner's permissions**, bypassing RLS.

**When to use:**

- Functions that need to read/write data across all users
- Admin operations that regular RLS would block
- Financial calculations (e.g., closing month, generating statements)

**Example:**

```sql
CREATE OR REPLACE FUNCTION public.request_reservation(
  p_amenity_id TEXT,
  p_type_id BIGINT,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_form_data JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as DB owner
AS $$
DECLARE
  v_user_id UUID;
  v_unit_id BIGINT;
  v_reservation_id BIGINT;
BEGIN
  -- Get current user from session
  v_user_id := auth.uid();

  -- Get user's unit
  SELECT unit_id INTO v_unit_id
  FROM profiles
  WHERE id = v_user_id;

  -- Check for overlapping reservations (needs access to all reservations)
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE amenity_id = p_amenity_id
    AND status NOT IN ('CANCELLED', 'REJECTED')
    AND tstzrange(start_at, end_at) && tstzrange(p_start_at, p_end_at)
  ) THEN
    RAISE EXCEPTION 'Time slot already booked';
  END IF;

  -- Create reservation
  INSERT INTO reservations (amenity_id, type_id, unit_id, user_id, start_at, end_at, status)
  VALUES (p_amenity_id, p_type_id, v_unit_id, v_user_id, p_start_at, p_end_at, 'REQUESTED')
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;
```

**Security Considerations:**

- ✅ Function validates `auth.uid()` (cannot impersonate other users)
- ✅ Business logic enforced (overlap detection, validation)
- ⚠️ Must carefully validate all inputs (no SQL injection)

---

#### SECURITY INVOKER (User Privileges)

**Usage:**  
Function runs with **caller's permissions**, respecting RLS.

**When to use:**

- Simple queries that should respect RLS
- Read operations
- User-scoped operations

**Example:**

```sql
CREATE OR REPLACE FUNCTION public.get_my_debts()
RETURNS TABLE(mes TEXT, monto NUMERIC, tipo TEXT)
LANGUAGE sql
SECURITY INVOKER  -- Runs as caller
AS $$
  -- RLS policies apply (user sees only own debts)
  SELECT mes, monto, 'Gasto Común' as tipo
  FROM common_expense_debts;

  UNION ALL

  SELECT mes, monto, 'Estacionamiento' as tipo
  FROM parking_debts;
$$;
```

**Security Considerations:**

- ✅ RLS policies automatically enforced
- ✅ Cannot accidentally leak other users' data
- ⚠️ Less powerful (cannot perform cross-user operations)

---

### 3.4 Admin Verification Helper

**is_admin() Function:**

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;
```

**Usage in Policies:**

```sql
CREATE POLICY "Admin only" ON financial_statements
  FOR ALL
  USING (is_admin());
```

**Usage in RPCs:**

```sql
CREATE OR REPLACE FUNCTION close_month()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  -- Financial logic here
END;
$$;
```

---

## 4. Database Security

### 4.1 SQL Injection Prevention

**✅ Safe: Parameterized Queries (Supabase Client)**

```typescript
// services/data.ts - SAFE
const { data } = await supabase.from('tickets').select('*').eq('user_id', userId); // Parameterized

// Supabase generates: SELECT * FROM tickets WHERE user_id = $1
```

**❌ Unsafe: String Concatenation**

```typescript
// NEVER DO THIS
const query = `SELECT * FROM tickets WHERE user_id = '${userId}'`;
// Vulnerable to: userId = "' OR 1=1 --"
```

**✅ Safe: RPC Functions with Parameters**

```sql
CREATE FUNCTION get_tickets_by_user(p_user_id UUID)
RETURNS TABLE(...)
AS $$
  SELECT * FROM tickets WHERE user_id = p_user_id;  -- Parameterized
$$;
```

---

### 4.2 Data Validation

**Database Constraints:**

```sql
-- NOT NULL constraints
ALTER TABLE tickets ALTER COLUMN titulo SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN descripcion SET NOT NULL;

-- CHECK constraints
ALTER TABLE expenses ADD CONSTRAINT positive_amount
  CHECK (monto > 0);

-- UNIQUE constraints
ALTER TABLE poll_responses ADD CONSTRAINT poll_responses_poll_unit_key
  UNIQUE (poll_id, unit_id);

-- FOREIGN KEY constraints
ALTER TABLE reservations ADD CONSTRAINT reservations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);
```

**Benefits:**

- ✅ Invalid data rejected at database level
- ✅ Cannot be bypassed by frontend code
- ✅ Maintains data integrity

---

### 4.3 Audit Trails

**Automatic Timestamps:**

```sql
-- Most tables have created_at
ALTER TABLE tickets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

-- Some have updated_at (via trigger)
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Manual Audit Columns:**

```sql
-- polls table tracks who created and closed polls
CREATE TABLE polls (
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,
  close_reason TEXT
);
```

**Querying Audit Trail:**

```sql
-- Find who created a poll
SELECT p.question, u.email as created_by
FROM polls p
JOIN auth.users u ON u.id = p.created_by
WHERE p.id = 1;

-- Find all actions by a user
SELECT 'poll_created' as action, created_at, question
FROM polls
WHERE created_by = 'user-uuid'
UNION ALL
SELECT 'ticket_created', created_at, titulo
FROM tickets
WHERE user_id = 'user-uuid';
```

---

### 4.4 Encryption

**In Transit:**

- ✅ TLS 1.3 encryption (Supabase enforces HTTPS)
- ✅ Certificate validation (automatic)

**At Rest:**

- ✅ Database encryption at rest (Supabase default)
- ✅ Backup encryption (Supabase default)

**Application-Level Encryption:**

- ❌ Not currently implemented (passwords hashed by Supabase Auth)
- 🔒 **Future Enhancement**: Encrypt sensitive fields (e.g., payment details)

---

## 5. Frontend Security

### 5.1 XSS Prevention

**React Auto-Escaping:**

```typescript
// ✅ SAFE: React automatically escapes
<div>{ticket.titulo}</div>
// Renders: &lt;script&gt;alert('XSS')&lt;/script&gt;

// ❌ UNSAFE: dangerouslySetInnerHTML bypasses escaping
<div dangerouslySetInnerHTML={{ __html: ticket.descripcion }} />
// NEVER use unless HTML is sanitized
```

**Sanitization Library (if needed):**

```bash
npm install dompurify
```

```typescript
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

---

### 5.2 Input Validation

**Client-Side Validation (UX Only):**

```typescript
// ✅ Good for user experience, NOT for security
const handleSubmit = () => {
  if (!titulo.trim()) {
    alert('Title is required');
    return;
  }

  if (monto <= 0) {
    alert('Amount must be positive');
    return;
  }

  // Submit to API
};
```

**Server-Side Validation (Security):**

```sql
-- Database constraints enforce security
ALTER TABLE expenses ADD CONSTRAINT positive_amount CHECK (monto > 0);
```

**Both Layers Required:**

- Client-side: Fast feedback for users
- Server-side: Actual security enforcement

---

### 5.3 Secure Environment Variables

**❌ NEVER Expose Secrets:**

```typescript
// WRONG - Service role key has admin access
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiI...';
```

**✅ Use Public/Anon Key Only:**

```typescript
// .env.local
VITE_SUPABASE_URL=https://abc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...  // Safe for frontend

// lib/supabase.ts
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY  // RLS enforced
);
```

**Key Differences:**

| Key Type     | Access Level        | Safe for Frontend? | Use Case              |
| ------------ | ------------------- | ------------------ | --------------------- |
| anon         | RLS-protected       | ✅ Yes             | Frontend application  |
| service_role | Full access (admin) | ❌ NO              | Backend services only |

---

### 5.4 CSRF Protection

**Built-in Protection:**

- ✅ Supabase JWT tokens include session context
- ✅ SameSite cookie policy (automatic)
- ✅ Origin validation (CORS)

**No Additional CSRF Tokens Needed:**  
Modern JWT-based auth is inherently CSRF-resistant when implemented correctly (tokens in headers, not cookies).

---

## 6. API Security

### 6.1 Supabase API Keys

**anon/public Key:**

- Exposed in frontend code ✅
- RLS policies enforced ✅
- Cannot bypass security ✅

**service_role Key:**

- NEVER expose in frontend ❌
- Bypasses RLS ⚠️
- For backend services only 🔒

**Key Rotation:**

1. Generate new key in Supabase Dashboard
2. Update environment variables (Vercel + local)
3. Deploy new version
4. Revoke old key after 24 hours

---

### 6.2 Rate Limiting

**Supabase Built-In:**

- ✅ 100 requests/second per IP (default)
- ✅ Automatically enforced
- ✅ DDoS protection

**Custom Rate Limiting (Future):**

```sql
-- Track requests per user
CREATE TABLE api_rate_limits (
  user_id UUID,
  endpoint TEXT,
  request_count INT,
  window_start TIMESTAMPTZ,
  PRIMARY KEY (user_id, endpoint, window_start)
);

-- Check rate limit in RPC
CREATE FUNCTION check_rate_limit(p_endpoint TEXT, p_max_requests INT)
RETURNS BOOLEAN AS $$
  -- Implementation here
$$ LANGUAGE plpgsql;
```

---

### 6.3 CORS Configuration

**Supabase CORS Settings:**

1. Go to **Settings → API**
2. Add allowed origins:
   - `http://localhost:5500` (development)
   - `https://gestion-condominio-facil.vercel.app` (production)

**Security:**

- ✅ Prevents unauthorized domains from accessing API
- ✅ Blocks requests from malicious sites

---

## 7. Data Privacy & Compliance

### 7.1 Personal Data Handling

**Personal Data Collected:**

- Name (`profiles.nombre`)
- Email (`auth.users.email`)
- Unit number (`profiles.unidad`)
- Parking status (`profiles.has_parking`)

**Data Minimization:**

- ✅ Only collect what's necessary
- ❌ No phone numbers (not required)
- ❌ No ID numbers (not required)

---

### 7.2 GDPR Compliance (if applicable)

**User Rights:**

1. **Right to Access**: Users can view their data

   ```typescript
   const profile = await dataService.getCurrentUser();
   const payments = await dataService.getPaymentHistory(user.id);
   ```

2. **Right to Rectification**: Users can update their profile

   ```typescript
   await dataService.updateUser(user.id, { nombre: 'New Name' });
   ```

3. **Right to Erasure**: Admin can delete user

   ```typescript
   await dataService.deleteUser(user.id);
   ```

4. **Right to Data Portability**: Export user data
   ```sql
   -- Generate JSON export
   SELECT row_to_json(t) FROM (
     SELECT * FROM profiles WHERE id = 'user-uuid'
   ) t;
   ```

---

### 7.3 Data Retention

**Current Policy:**

- User data: Retained indefinitely (active accounts)
- Payment history: Retained indefinitely (legal requirement)
- Deleted users: Profile removed, but payment records retained (anonymized)

**Recommended Policy:**

- Inactive accounts: Delete after 2 years of inactivity
- Audit logs: Retain for 7 years (financial records)

---

## 8. Network Security

### 8.1 HTTPS/TLS

**Automatic Enforcement:**

- ✅ Vercel enforces HTTPS (automatic redirect from HTTP)
- ✅ Supabase requires HTTPS for all connections
- ✅ TLS 1.3 with strong cipher suites

**Certificate Management:**

- ✅ Automatic certificate renewal (Let's Encrypt)
- ✅ HSTS header (Vercel default)

---

### 8.2 Content Security Policy (CSP)

**Current Status:** Not implemented

**Recommended CSP Header:**

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
  font-src 'self' data:;
  frame-ancestors 'none';
```

**Implementation (vercel.json):**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; ..."
        }
      ]
    }
  ]
}
```

---

## 9. Security Checklist

### Pre-Deployment Checklist

#### Authentication

- [ ] Email auth enabled in Supabase
- [ ] Password strength policy configured
- [ ] Magic link expiry set (1 hour recommended)
- [ ] Session timeout configured (1 hour access token)

#### Authorization

- [ ] RLS enabled on all tables
- [ ] RLS policies tested (users cannot access other users' data)
- [ ] Admin-only operations protected
- [ ] `is_admin()` helper function created

#### Database

- [ ] All foreign keys defined
- [ ] NOT NULL constraints on required fields
- [ ] CHECK constraints for business rules
- [ ] Audit columns (created_at, updated_at) on all tables

#### Frontend

- [ ] `.env.local` in `.gitignore`
- [ ] No secrets in source code
- [ ] Input validation on all forms
- [ ] Error messages don't leak sensitive data

#### API

- [ ] Only anon key in frontend (never service_role)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled (Supabase default)

#### Deployment

- [ ] Environment variables set in Vercel
- [ ] HTTPS enforced (Vercel default)
- [ ] Production domain configured
- [ ] Database backups enabled (Supabase default)

---

### Post-Deployment Verification

```bash
# 1. Test authentication
curl https://your-app.vercel.app/api/auth/login

# 2. Verify HTTPS
curl -I https://your-app.vercel.app
# Should return: HTTP/2 200

# 3. Test CORS
curl -H "Origin: https://malicious-site.com" \
  https://your-supabase-url.supabase.co/rest/v1/profiles

# Should return: CORS error

# 4. Test RLS
# Log in as User A, try to access User B's data
# Should return: empty result or error
```

---

## 10. Incident Response

### 10.1 Security Breach Response Plan

**Step 1: Contain (Immediate - 0-15 minutes)**

1. Identify affected systems
2. Revoke compromised API keys (Supabase Dashboard → Settings → API)
3. Force logout all users:
   ```sql
   SELECT auth.sign_out_all_users();
   ```
4. Disable compromised accounts:
   ```sql
   UPDATE auth.users SET banned_until = NOW() + INTERVAL '24 hours'
   WHERE id = 'compromised-user-id';
   ```

**Step 2: Investigate (15 minutes - 2 hours)**

1. Check Supabase logs:
   - **Auth Logs**: Failed login attempts, suspicious IPs
   - **API Logs**: Unusual query patterns
   - **Postgres Logs**: Direct database access

2. Identify attack vector:
   - SQL injection? (Check RPC function logs)
   - Stolen credentials? (Check auth logs)
   - XSS attack? (Check error reports)

3. Document timeline and affected data

**Step 3: Eradicate (2-24 hours)**

1. Patch vulnerability:
   - Update RLS policies
   - Fix vulnerable RPC functions
   - Deploy security patches

2. Rotate all secrets:
   - Generate new Supabase API keys
   - Update environment variables
   - Deploy new version

**Step 4: Recover (24-48 hours)**

1. Restore from backup if data corrupted
2. Re-enable user accounts
3. Monitor for recurring attacks

**Step 5: Post-Mortem (48+ hours)**

1. Write incident report
2. Update security documentation
3. Implement additional safeguards
4. Notify affected users (if required by law)

---

### 10.2 Common Attack Scenarios

#### Scenario 1: Stolen Admin Credentials

**Symptoms:**

- Unexpected admin actions in logs
- Users reporting unauthorized changes

**Response:**

1. Reset admin password immediately
2. Review audit logs for unauthorized actions:
   ```sql
   SELECT * FROM polls WHERE created_by = 'compromised-admin-id';
   SELECT * FROM expenses WHERE created_at > 'suspicious-timestamp';
   ```
3. Revert unauthorized changes
4. Enable 2FA for admin accounts (future enhancement)

---

#### Scenario 2: RLS Policy Bypass Attempt

**Symptoms:**

- Users reporting seeing other users' data
- Unusual error rates in logs

**Response:**

1. Verify RLS enabled:

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   -- All should have rowsecurity = true
   ```

2. Test RLS policies:

   ```sql
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'test-user-id';
   SELECT * FROM payments;  -- Should see only own payments
   ```

3. Fix broken policies and redeploy

---

#### Scenario 3: DDoS Attack

**Symptoms:**

- Slow response times
- 429 (Rate Limit) errors
- Supabase dashboard shows high request count

**Response:**

1. Check Supabase rate limiting logs
2. Identify attacking IPs
3. Block IPs at Vercel level (if needed):
   ```json
   // vercel.json
   {
     "routes": [
       {
         "src": "/.*",
         "headers": {
           "X-Denied-IP": "192.168.1.1"
         },
         "status": 403
       }
     ]
   }
   ```
4. Contact Supabase support for additional protection

---

## 11. Security Best Practices

### 11.1 For Developers

#### Code Review Checklist

- [ ] No hardcoded secrets
- [ ] RLS policies cover all CRUD operations
- [ ] RPC functions validate `auth.uid()`
- [ ] Input validation on all parameters
- [ ] Error messages don't leak sensitive data
- [ ] SQL queries parameterized (no string concatenation)

#### Secure Coding Patterns

**✅ DO: Use RPC for Complex Operations**

```typescript
// Instead of direct INSERT (bypasses business logic)
await dataService.createReservation({
  amenityId: 'quincho',
  startAt: '2025-02-15T18:00:00',
  endAt: '2025-02-15T22:00:00',
});
// Calls request_reservation RPC (enforces overlap checks, creates charges)
```

**❌ DON'T: Direct Database Mutations**

```typescript
// WRONG - Bypasses business logic
await supabase.from('reservations').insert({
  amenity_id: 'quincho',
  start_at: '2025-02-15T18:00:00',
  end_at: '2025-02-15T22:00:00',
  status: 'CONFIRMED', // Skips payment requirement!
});
```

---

**✅ DO: Validate User Role**

```typescript
const handleApproveExpense = async (id: number) => {
  if (user.role !== 'admin') {
    alert('Admin only');
    return;
  }

  await dataService.approveExpense(id);
};
```

**❌ DON'T: Trust Client-Side State**

```typescript
// WRONG - User can modify client-side role
if (localStorage.getItem('isAdmin') === 'true') {
  // Attacker can set this to 'true'!
}
```

---

### 11.2 For Administrators

#### Regular Security Tasks

- **Weekly**: Review auth logs for failed login attempts
- **Monthly**: Audit admin account list
- **Quarterly**: Review and update RLS policies
- **Annually**: Security audit and penetration testing

#### User Management

- Create admin accounts only when necessary
- Use strong, unique passwords
- Remove inactive admin accounts
- Document all admin actions

#### Data Management

- Regular database backups (automated by Supabase)
- Test backup restoration quarterly
- Encrypt sensitive exports
- Secure data transfer (SFTP, not email)

---

### 11.3 Security Monitoring

#### Metrics to Track

1. **Failed login attempts** (> 10/hour per IP = suspicious)
2. **RLS policy violations** (should be rare)
3. **Database query errors** (sudden spike = attack?)
4. **API request rate** (baseline vs. anomaly)

#### Alert Thresholds

```sql
-- Failed logins
SELECT COUNT(*) FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
AND action = 'user_signedin'
AND error_code IS NOT NULL;
-- Alert if > 50

-- Unusual admin activity
SELECT COUNT(*) FROM expenses
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Alert if > 20 (normal is ~5/day)
```

---

## Appendix A: Security Configuration Reference

### Supabase Settings

**Authentication:**

- Enable Email Auth: ✅
- Enable Magic Link: ✅
- Confirm Email: ✅ (recommended)
- Minimum Password Length: 8 characters
- Password Strength: Medium
- JWT Expiry: 3600 seconds (1 hour)
- Refresh Token Expiry: 2592000 seconds (30 days)

**API:**

- Anon Key: `eyJhbGciOiJIUzI1NiI...` (safe for frontend)
- Service Role Key: `eyJhbGciOiJIUzI1NiI...` (NEVER expose)
- Rate Limiting: 100 req/sec per IP
- CORS Allowed Origins: `https://gestion-condominio-facil.vercel.app`

**Database:**

- RLS Enabled: ✅ All tables
- Backups: Daily (automatic)
- Point-in-Time Recovery: 7 days

---

## Appendix B: Threat Model

### Assets

1. User credentials (email, password)
2. Financial data (payments, debts, expenses)
3. Personal data (names, unit numbers)
4. Reservation data
5. Admin access

### Threats

1. **Unauthorized access** (stolen credentials)
2. **Privilege escalation** (resident → admin)
3. **Data leak** (RLS bypass, SQL injection)
4. **Data tampering** (payment fraud)
5. **Denial of service** (DDoS)

### Mitigations

1. Strong auth + RLS policies
2. RBAC + RLS + admin verification
3. Parameterized queries + RLS + input validation
4. Audit trails + business logic in RPCs
5. Rate limiting + Supabase DDoS protection

---

## Appendix C: Security Tools

### Recommended Security Tools

**Code Analysis:**

- **ESLint Security Plugin**: `eslint-plugin-security`
- **npm audit**: Check for vulnerable dependencies

**Testing:**

- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Penetration testing

**Monitoring:**

- **Sentry**: Error tracking (future)
- **LogRocket**: Session replay (future)

---

**Document Version**: 1.0  
**Last Updated**: January 26, 2026  
**Maintained By**: Development Team

For RLS policy details, see `docs/DATABASE.md`.  
For API authentication patterns, see `docs/API.md`.  
For deployment security, see `docs/DEPLOYMENT.md`.

---

**🔒 Remember: Security is a continuous process, not a one-time task.**
