# Deployment Guide

**Gestion Condominio Facil**  
Comprehensive deployment documentation for production and development environments.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Environment Configuration](#3-environment-configuration)
4. [Local Development](#4-local-development)
5. [Building for Production](#5-building-for-production)
6. [Deployment to Vercel](#6-deployment-to-vercel)
7. [Database Migrations](#7-database-migrations)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Monitoring & Debugging](#9-monitoring--debugging)
10. [Troubleshooting](#10-troubleshooting)
11. [Security Checklist](#11-security-checklist)

---

## 1. Overview

### Deployment Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   GitHub Repo   │─────▶│  GitHub Actions  │      │   Developers    │
│   (main branch) │      │  (CI/CD Pipeline)│      │  (Local Dev)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                         │
         │ webhook                │ deploy                  │ git push
         ▼                        ▼                         ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│     Vercel      │      │   Playwright     │      │  Vite Dev       │
│  (Production)   │      │  E2E Tests       │      │  Server (5500)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                                                  │
         │                                                  │
         └──────────────────┬───────────────────────────────┘
                            ▼
                   ┌──────────────────┐
                   │    Supabase      │
                   │  (PostgreSQL +   │
                   │   Auth + RLS)    │
                   └──────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 19.2.0 + TypeScript 5.5.4
- **Build Tool**: Vite 6.2.0
- **Hosting**: Vercel (static site deployment)
- **Backend**: Supabase (PostgreSQL 15+, Auth, Realtime)
- **CI/CD**: GitHub Actions (Playwright E2E tests)
- **Package Manager**: npm

---

## 2. Prerequisites

### Required Tools

#### For Local Development

```bash
# Node.js (v22 recommended)
node -v  # Should be >= 18.0.0

# npm (comes with Node.js)
npm -v   # Should be >= 9.0.0

# Git
git --version
```

#### For Database Management (Optional)

```bash
# Supabase CLI (for migrations)
npm install -g supabase

# Verify installation
supabase --version
```

### Required Accounts

1. **GitHub Account** - For repository access and CI/CD
2. **Vercel Account** - For production deployment
3. **Supabase Account** - For backend services (database, auth)

---

## 3. Environment Configuration

### Environment Variables

The application requires Supabase credentials to function. These are provided via environment variables.

#### Development (.env.local)

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Your Supabase project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anonymous/public key (safe for frontend)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these values:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy **Project URL** and **anon/public key**

#### Production (Vercel)

Environment variables are configured in the Vercel dashboard (see [Section 6](#6-deployment-to-vercel)).

### Additional Configuration Files

#### vite.config.ts

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5500, // Dev server port
      host: '0.0.0.0', // Allow external connections
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
```

#### vercel.json

```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html" // SPA routing
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true
}
```

---

## 4. Local Development

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/RockHarr/Gestion-Condominio-Facil.git
cd Gestion-Condominio-Facil

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start development server
npm run dev
```

### Development Server

```bash
# Start Vite dev server on port 5500
npm run dev

# Output:
# VITE v6.2.0  ready in 523 ms
# ➜  Local:   http://localhost:5500/
# ➜  Network: http://192.168.1.100:5500/
```

**Access the application:**

- Local: http://localhost:5500
- Network: http://[your-ip]:5500 (for testing on mobile devices)

### Development Commands

```bash
# Run development server
npm run dev

# Run ESLint
npm run lint

# Run ESLint with strict rules
npm run lint:strict

# Format code with Prettier
npm run format

# Run E2E tests (requires dev server running)
npm run test

# Run tests with UI
npm run test:ui

# View test report
npm run test:report
```

### Hot Module Replacement (HMR)

Vite provides instant HMR for React components. Changes to `.tsx` files will reflect immediately without page reload.

**Files that require restart:**

- `vite.config.ts`
- `.env.local`
- `index.html`

---

## 5. Building for Production

### Build Process

```bash
# Clean build
rm -rf dist/
npm run build

# Output:
# vite v6.2.0 building for production...
# ✓ 1234 modules transformed.
# dist/index.html                   0.45 kB │ gzip:  0.30 kB
# dist/assets/index-a1b2c3d4.css   45.23 kB │ gzip: 12.34 kB
# dist/assets/index-e5f6g7h8.js   234.56 kB │ gzip: 78.90 kB
# ✓ built in 3.45s
```

### Preview Production Build

```bash
# Build and preview
npm run build && npm run preview

# Output:
# ➜  Local:   http://localhost:4173/
# ➜  Network: http://192.168.1.100:4173/
```

### Build Output Structure

```
dist/
├── index.html                    # Entry point
├── assets/
│   ├── index-[hash].js          # Bundled JavaScript (React app)
│   ├── index-[hash].css         # Bundled CSS
│   └── [other-assets]           # Images, fonts, etc.
└── vite.svg                      # Static assets
```

### Build Optimizations

- **Code Splitting**: Vite automatically splits vendor code
- **Tree Shaking**: Unused code is removed
- **Minification**: JavaScript and CSS are minified
- **Asset Hashing**: Cache busting with content hashes

### Build Validation

```bash
# Check build size
du -sh dist/

# Analyze bundle composition (optional)
npm install -g vite-bundle-visualizer
vite-bundle-visualizer
```

---

## 6. Deployment to Vercel

### Initial Setup

#### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# ? Set up and deploy "~/Gestion-Condominio-Facil"? [Y/n] y
# ? Which scope do you want to deploy to? [your-username]
# ? Link to existing project? [y/N] n
# ? What's your project's name? gestion-condominio-facil
# ? In which directory is your code located? ./
# Auto-detected Project Settings (Vite):
# - Build Command: npm run build
# - Output Directory: dist
# - Development Command: vite
```

#### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import from GitHub: `RockHarr/Gestion-Condominio-Facil`
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Environment Variables in Vercel

**Critical Step:** Add Supabase credentials to Vercel.

1. Go to **Project Settings → Environment Variables**
2. Add the following:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Environment**: Select "Production", "Preview", and "Development"
4. Click **Save**

### Deployment Workflow

```bash
# Deploy to production
git push origin main

# Vercel automatically:
# 1. Detects push to main branch
# 2. Installs dependencies (npm ci)
# 3. Runs build (npm run build)
# 4. Deploys to production URL
# 5. Updates https://gestion-condominio-facil.vercel.app
```

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Domain Configuration (Optional)

1. Go to **Project Settings → Domains**
2. Add custom domain: `condominio.example.com`
3. Configure DNS:
   - **Type**: CNAME
   - **Name**: condominio
   - **Value**: cname.vercel-dns.com

---

## 7. Database Migrations

### Migration Strategy

The project uses **manual SQL migrations** stored in `supabase/migrations/`.

**Current State:**

- 39 migration files (see `docs/DATABASE.md` for full list)
- Total: 3,009 lines of SQL
- Naming: `YYYYMMDDHHMMSS_description.sql`

### Applying Migrations

#### Option 1: Supabase Dashboard (Recommended for Production)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the migration SQL from `supabase/migrations/[file].sql`
5. Paste and click **Run**
6. Verify with `SELECT * FROM [table] LIMIT 1;`

#### Option 2: Supabase CLI (Local Development)

```bash
# Initialize Supabase (first time only)
supabase init

# Link to remote project
supabase link --project-ref your-project-id

# Apply all pending migrations
supabase db push

# Create new migration
supabase migration new add_feature_x

# Reset database (destructive!)
supabase db reset
```

### Migration Best Practices

1. **Always Backup Before Migrating Production**

   ```sql
   -- Run in SQL Editor before migration
   SELECT * FROM profiles;  -- Verify data exists
   ```

2. **Test Migrations Locally First**

   ```bash
   # Apply to local dev database
   supabase db reset
   supabase db push
   ```

3. **Use Transactions for Safety**

   ```sql
   BEGIN;

   -- Your migration SQL here
   ALTER TABLE payments ADD COLUMN new_field TEXT;

   -- Verify
   SELECT * FROM payments LIMIT 1;

   -- COMMIT if OK, ROLLBACK if not
   COMMIT;
   ```

4. **Document Breaking Changes**
   - Update `docs/DATABASE.md` with schema changes
   - Notify team before deploying

### Seed Data

```bash
# Apply seed data (test users, amenities, etc.)
supabase db seed
```

Seed files:

- `supabase/seed_phase4.sql` - Test data for development

---

## 8. CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/playwright.yml`

**Triggered on:**

- Push to `main` branch
- Pull requests to `main`

### Workflow Steps

```yaml
name: E2E (Playwright)

on:
  push:
    branches: [main]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci # Install dependencies
      - run: npm run build # Build production bundle
      - run: npx playwright install --with-deps # Install browsers

      - name: Run E2E
        run: npx playwright test --reporter=line
        env:
          CI: true

      - name: Upload HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
```

### CI Environment

- **Node.js**: v22
- **OS**: Ubuntu Latest
- **Browsers**: Chromium (installed by Playwright)
- **Base URL**: `http://localhost:3000` (Vite server)

### Test Configuration

**File**: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'npx vite --port 3000 --strictPort',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Viewing Test Results

#### In GitHub Actions

1. Go to **Actions** tab in GitHub
2. Select workflow run
3. Click **"playwright-report"** artifact
4. Download and unzip
5. Open `index.html` in browser

#### Locally

```bash
# Run tests
npm run test

# View report
npm run test:report
```

### Test Coverage

**Current Tests** (9 files):

- `tests/e2e/login.spec.ts` - Authentication flows
- `tests/e2e/payments.spec.ts` - Payment module
- `tests/e2e/expenses.spec.ts` - Expense management
- `tests/e2e/reservations.spec.ts` - Amenity reservations
- `tests/e2e/admin_dashboard.spec.ts` - Admin functionality
- `tests/e2e/user_dashboard.spec.ts` - User view
- `tests/e2e/tickets.spec.ts` - Support tickets
- `tests/e2e/announcements.spec.ts` - Community announcements
- `tests/e2e/reservations_menu_smoke.spec.ts` - Smoke tests

### Skipping CI

```bash
# Skip CI for documentation changes
git commit -m "docs: update README [skip ci]"
```

---

## 9. Monitoring & Debugging

### Production Logs

#### Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select project
3. Click **Deployments** → Select deployment
4. View **Build Logs** and **Function Logs**

**Common log patterns:**

```bash
# Successful build
✓ built in 3.45s

# Failed build
✗ Error: Module not found

# Runtime errors (check browser console)
```

#### Supabase Logs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project
3. Navigate to **Logs**

**Available log types:**

- **Postgres Logs**: Database queries, errors
- **Auth Logs**: Login attempts, failed auth
- **API Logs**: RPC calls, REST requests
- **Realtime Logs**: WebSocket connections

### Browser Debugging

#### Development

```javascript
// Enable verbose logging in services/data.ts
console.log('Fetching data from Supabase:', { table, filters });
```

#### Production

1. Open browser DevTools (F12)
2. Check **Console** for errors
3. Check **Network** tab for failed requests

**Common errors:**

```javascript
// Missing environment variables
Error: supabaseUrl is required

// RLS policy violation
Error: new row violates row-level security policy

// Invalid token
Error: JWT expired
```

### Performance Monitoring

#### Lighthouse Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://gestion-condominio-facil.vercel.app --view

# Scores to monitor:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

#### Vite Build Analysis

```bash
# Check bundle size
npm run build

# Output shows:
# dist/assets/index-e5f6g7h8.js   234.56 kB │ gzip: 78.90 kB
#                                              ^^^^^^^^^^^^^^
#                                              Target: < 100 kB
```

### Error Tracking (Future Enhancement)

**Recommended Tools:**

- **Sentry**: Real-time error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance insights

---

## 10. Troubleshooting

### Build Failures

#### Error: "Module not found"

```bash
# Cause: Missing dependency
# Fix: Install missing package
npm install [package-name]

# Or reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Error: "Type error in component"

```bash
# Cause: TypeScript compilation error
# Fix: Check error message, fix type issues
npm run lint

# Temporarily skip type checking (not recommended)
# Edit vite.config.ts:
typescript: {
  ignoreBuildErrors: true  // Only for debugging
}
```

#### Error: "Out of memory"

```bash
# Cause: Large bundle size
# Fix: Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Deployment Issues

#### Vercel Build Fails

1. **Check Environment Variables**
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Go to **Project Settings → Environment Variables**

2. **Check Build Logs**
   - Go to **Deployments** → Failed deployment → **Build Logs**
   - Look for error messages

3. **Test Build Locally**
   ```bash
   npm run build
   # If it fails locally, fix before pushing
   ```

#### Blank Page After Deployment

```javascript
// Cause: Missing environment variables
// Fix: Check browser console for errors

// Common error:
// Error: supabaseUrl is required

// Solution: Add env vars in Vercel dashboard
```

### Database Issues

#### Error: "relation does not exist"

```sql
-- Cause: Migration not applied
-- Fix: Apply missing migrations (see Section 7)

-- Verify table exists:
SELECT * FROM information_schema.tables
WHERE table_name = 'your_table_name';
```

#### Error: "new row violates row-level security policy"

```sql
-- Cause: RLS policy blocking operation
-- Fix: Check policies in docs/DATABASE.md

-- Temporarily disable RLS for debugging (NOT in production):
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Run your query
-- Re-enable RLS:
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

#### Error: "JWT expired"

```javascript
// Cause: User session expired
// Fix: Sign out and sign in again

// In code (services/auth.ts):
await supabase.auth.refreshSession();
```

### Test Failures

#### Playwright Tests Timing Out

```typescript
// Increase timeout in playwright.config.ts
export default defineConfig({
  timeout: 60_000, // 60 seconds
  expect: { timeout: 10_000 }, // 10 seconds
});
```

#### Tests Fail in CI But Pass Locally

```bash
# Cause: Different environment
# Fix: Set environment variables in GitHub Secrets

# Add to .github/workflows/playwright.yml:
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Network Issues

#### Error: "Failed to fetch"

```javascript
// Cause: CORS policy or network error
// Fix: Check Supabase CORS settings

// In Supabase Dashboard → Settings → API:
// Allowed origins should include:
// - http://localhost:5500 (development)
// - https://gestion-condominio-facil.vercel.app (production)
```

#### Slow API Requests

```javascript
// Check network tab for slow queries
// Optimize in services/data.ts:

// Bad: Fetch all, then filter in JS
const all = await supabase.from('payments').select('*');
const filtered = all.data.filter((p) => p.user_id === userId);

// Good: Filter in database
const { data } = await supabase.from('payments').select('*').eq('user_id', userId);
```

---

## 11. Security Checklist

### Pre-Deployment Security Review

- [ ] **Environment Variables**
  - [ ] `.env.local` is in `.gitignore`
  - [ ] No secrets committed to repository
  - [ ] Production env vars set in Vercel dashboard

- [ ] **Authentication**
  - [ ] Supabase Auth enabled
  - [ ] Email confirmation required for new users
  - [ ] Password strength policy configured

- [ ] **Row-Level Security (RLS)**
  - [ ] RLS enabled on all tables
  - [ ] Policies tested (users can't access other users' data)
  - [ ] Admin-only operations protected

- [ ] **Database**
  - [ ] No SQL injection vulnerabilities (using Supabase client)
  - [ ] Sensitive data encrypted (e.g., payment info)
  - [ ] Regular backups configured

- [ ] **Frontend**
  - [ ] No sensitive data in client-side code
  - [ ] XSS protection (React auto-escapes by default)
  - [ ] HTTPS enforced (Vercel auto-enables)

- [ ] **API Security**
  - [ ] Rate limiting enabled (Supabase default)
  - [ ] CORS configured correctly
  - [ ] API keys rotated regularly

### Post-Deployment Verification

```bash
# 1. Test authentication
# - Try logging in as admin
# - Try logging in as regular user
# - Verify correct permissions

# 2. Test RLS policies
# - Log in as User A
# - Try to access User B's data (should fail)

# 3. Check HTTPS
curl -I https://gestion-condominio-facil.vercel.app
# Should return: HTTP/2 200

# 4. Verify environment variables
# - Check that app connects to correct Supabase project
# - Verify no hardcoded URLs in code
```

### Incident Response Plan

1. **Security Breach Detected**
   - Immediately revoke compromised API keys
   - Reset Supabase project credentials
   - Force logout all users: `supabase auth admin signOutAllUsers`
   - Investigate logs for unauthorized access

2. **Data Leak**
   - Identify affected users
   - Notify according to GDPR/local regulations
   - Audit RLS policies
   - Apply emergency patches

3. **Service Outage**
   - Check Vercel status page
   - Check Supabase status page
   - Review recent deployments (rollback if needed)
   - Contact support if infrastructure issue

---

## Appendix A: Deployment Commands Reference

### Development

```bash
npm run dev              # Start dev server
npm run lint             # Lint code
npm run format           # Format code
npm run test             # Run E2E tests
npm run test:ui          # Run tests with UI
```

### Production

```bash
npm run build            # Build for production
npm run preview          # Preview production build
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
```

### Database

```bash
supabase init            # Initialize Supabase
supabase link            # Link to remote project
supabase db push         # Apply migrations
supabase db reset        # Reset database (destructive)
supabase migration new   # Create new migration
```

### CI/CD

```bash
git push origin main     # Trigger CI/CD pipeline
git commit -m "fix [skip ci]"  # Skip CI
```

---

## Appendix B: Environment Variables Reference

| Variable                 | Required | Description             | Example                                    |
| ------------------------ | -------- | ----------------------- | ------------------------------------------ |
| `VITE_SUPABASE_URL`      | Yes      | Supabase project URL    | `https://tqshoddiisfgfjqlkntv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key  | `eyJhbGciOiJIUzI1NiI...`                   |
| `VITE_GEMINI_API_KEY`    | No       | Gemini API key (future) | `AIzaSy...`                                |

---

## Appendix C: Port Reference

| Service                | Port | Protocol | Usage              |
| ---------------------- | ---- | -------- | ------------------ |
| Vite Dev Server        | 5500 | HTTP     | Local development  |
| Vite Preview           | 4173 | HTTP     | Production preview |
| Playwright Test Server | 3000 | HTTP     | E2E testing        |

---

## Appendix D: Useful Links

- **Production URL**: https://gestion-condominio-facil.vercel.app
- **GitHub Repository**: https://github.com/RockHarr/Gestion-Condominio-Facil
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Playwright Docs**: https://playwright.dev
- **Vite Docs**: https://vitejs.dev

---

## Appendix E: Changelog

### Version 1.0 (Stable) - January 2026

- Initial production deployment
- 39 database migrations applied
- 9 E2E test suites implemented
- CI/CD pipeline with GitHub Actions
- Vercel deployment configured
- Comprehensive documentation (6 docs)

---

**Document Version**: 1.0  
**Last Updated**: January 26, 2026  
**Maintained By**: Development Team

For questions or issues, please contact the development team or open an issue on GitHub.
