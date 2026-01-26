# Contributing Guide

> How to contribute to Gestion Condominio Facil

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Code Style](#code-style)
5. [Git Workflow](#git-workflow)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (recommended: 22 LTS)
- **npm** 10+
- **Git**
- **Supabase account** (for local development keys)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/RockHarr/Gestion-Condominio-Facil.git
cd Gestion-Condominio-Facil

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start development server
npm run dev

# 5. Open http://localhost:5500
```

---

## Development Setup

### Environment Variables

Create `.env.local` from the template:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project:

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Settings > API > Project URL and anon/public key

### Supabase Setup

For a new Supabase project:

1. Create project at supabase.com
2. Run migrations:

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Apply migrations
   supabase db push
   ```

### IDE Setup

**VS Code (Recommended)**

Install these extensions:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

Settings are pre-configured in `.vscode/`

---

## Project Structure

```
/
├── components/          # React components
│   ├── Admin*.tsx       # Admin-only screens
│   ├── *Screen.tsx      # Feature screens
│   ├── *Modal.tsx       # Dialog components
│   └── Shared.tsx       # Reusable UI
│
├── services/            # Business logic
│   ├── auth.ts          # Authentication
│   └── data.ts          # Data access
│
├── lib/                 # Infrastructure
│   └── supabase.ts      # Supabase client
│
├── supabase/migrations/ # Database schema
├── tests/e2e/           # Playwright tests
├── docs/                # Documentation
│
├── App.tsx              # Main component
├── types.ts             # TypeScript types
└── index.tsx            # Entry point
```

### Key Files

| File                    | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `App.tsx`               | State management, routing, data loading |
| `types.ts`              | All TypeScript interfaces and types     |
| `services/data.ts`      | All Supabase data operations            |
| `services/auth.ts`      | Authentication logic                    |
| `components/Shared.tsx` | Reusable UI components                  |

---

## Code Style

### TypeScript

- Use `interface` for object types
- Use `type` for unions and primitives
- Avoid `any` - use `unknown` for truly unknown types
- Use strict null checks

```typescript
// Good
interface User {
  id: string;
  nombre: string;
  role: 'admin' | 'resident';
}

// Avoid
const user: any = fetchUser();
```

### React Components

- Use functional components with hooks
- Use explicit return types for complex components
- Destructure props in function signature

```typescript
// Good
interface ButtonProps {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
    return (
        <button onClick={onClick} className={styles[variant]}>
            {label}
        </button>
    );
};
```

### Naming Conventions

| Type             | Convention                    | Example                   |
| ---------------- | ----------------------------- | ------------------------- |
| Components       | PascalCase                    | `AdminDashboard.tsx`      |
| Files            | PascalCase for components     | `HomeScreen.tsx`          |
| Functions        | camelCase                     | `handleSubmit()`          |
| Constants        | SCREAMING_SNAKE               | `MAX_RETRIES`             |
| Types/Interfaces | PascalCase                    | `interface User {}`       |
| Enums            | PascalCase + SCREAMING values | `enum Status { PENDING }` |

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use dark mode variants (`dark:`)

```tsx
<div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Title</h2>
</div>
```

---

## Git Workflow

### Branch Naming

```
feature/short-description    # New features
fix/issue-description        # Bug fixes
refactor/what-changed        # Code improvements
docs/what-documented         # Documentation
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(reservations): add concurrency control
fix(payments): resolve decimal precision issue
refactor(auth): improve error handling
docs(readme): update installation steps
test(e2e): add reservation flow tests
chore(deps): update dependencies
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change (no behavior change)
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance

### Workflow

1. Create branch from `main`
2. Make changes
3. Run tests locally
4. Commit with conventional message
5. Push and create PR
6. Address review feedback
7. Merge after approval

---

## Testing

### Running Tests

```bash
# Run all E2E tests
npm run test

# Run with UI
npm run test:ui

# Run specific test file
npx playwright test tests/e2e/reservations_flow.spec.ts

# View test report
npm run test:report
```

### Writing Tests

Tests are in `tests/e2e/` using Playwright:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    await page.click('button[data-testid="submit"]');

    // Assert
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

### Test Data

- Use dedicated test accounts (defined in test files)
- Don't rely on production data
- Clean up test data after tests

---

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Changes are tested manually
- [ ] Documentation updated if needed

### PR Template

The repository includes a PR template. Fill out all sections:

1. **Context** - What problem does this solve?
2. **Changes** - What did you change?
3. **Testing** - How did you test?
4. **Checklist** - All items checked

### Review Process

1. Create PR against `main`
2. Automated tests run via GitHub Actions
3. Reviewer assigned
4. Address feedback
5. Approval required before merge
6. Squash and merge

### Code Review Guidelines

**For Authors:**

- Keep PRs small and focused
- Respond to feedback promptly
- Explain complex changes

**For Reviewers:**

- Be constructive and specific
- Approve when "good enough"
- Focus on correctness and clarity

---

## Common Tasks

### Adding a New Screen

1. Create component in `components/`
2. Add type to `Page` in `types.ts`
3. Add route in `AdminApp.tsx` or `ResidentApp.tsx`
4. Add navigation button if needed

### Adding a New Data Entity

1. Define interface in `types.ts`
2. Add CRUD methods in `services/data.ts`
3. Add state in `App.tsx`
4. Create migration in `supabase/migrations/`

### Adding a New Service Method

```typescript
// services/data.ts
async getNewEntity() {
    const { data, error } = await withTimeout(
        supabase.from('table').select('*')
    );
    if (error) throw error;
    return data;
}
```

---

## Getting Help

- **Documentation**: Check `/docs` folder
- **Issues**: Search existing GitHub issues
- **Questions**: Create a GitHub issue with `question` label

---

_Happy contributing!_
