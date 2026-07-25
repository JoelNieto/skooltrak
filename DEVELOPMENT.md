# Development Guide

## Quick Start

```bash
# Install dependencies (uses Bun)
bun install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
bun prisma generate

# Run migrations
bun prisma migrate dev

# Start development
bun run serve:dev         # Dashboard (web + api)
bun run serve:dev:admin   # Admin (web + api)
```

## Package Manager

**This project uses Bun** exclusively. Do not use other package managers.

```bash
# ✅ Correct
bun nx build web-dashboard
bun nx test dashboard-backend
bun nx run-many -t lint test build
```

## Project Structure

```
apps/
├── web-dashboard/        # Angular 21 dashboard app
├── dashboard-backend/    # NestJS 11 GraphQL API
├── web-admin/           # Angular 21 admin app
├── admin-backend/       # NestJS 11 GraphQL API
└── *-e2e/              # E2E test projects

libs/
├── shared/             # Shared utilities, types
├── auth/               # Auth module (Better-auth)
└── ui/                 # Reusable Angular components

prisma/
└── schema.prisma       # Database schema (Prisma 7)
```

## Tech Stack

- **Frontend**: Angular 21, Vite 7, Vitest, Tailwind CSS 4, DaisyUI 5
- **Backend**: NestJS 11, GraphQL (Apollo 5), Prisma 7, PostgreSQL
- **Auth**: Better-auth 1.4, JWT, Passport
- **Tooling**: Nx 22.4.5, TypeScript 5.9, ESLint 9
- **CI/CD**: GitLab CI

## Common Commands

### Development

```bash
bun nx serve <project>              # Start dev server
bun nx serve web-dashboard          # Frontend on Vite port
bun nx serve dashboard-backend      # Backend on port 3000
```

### Building

```bash
bun nx build <project>              # Build single project
bun nx run-many -t build            # Build all
bun nx affected -t build            # Build affected only
```

### Testing

```bash
bun nx test <project>               # Run unit tests
bun nx e2e <project-e2e>           # Run e2e tests
bun nx run-many -t test            # Test all
bun nx affected -t test            # Test affected only
```

### Linting

```bash
bun nx lint <project>               # Lint single project
bun nx lint <project> --fix        # Auto-fix issues
bun nx run-many -t lint            # Lint all
```

### Database (Prisma)

```bash
bun prisma generate                 # Generate client after schema changes
bun prisma migrate dev --name X     # Create new migration
bun prisma migrate deploy           # Apply migrations (prod)
bun prisma studio                   # Open database GUI
bun prisma db push                  # Push schema changes (dev only)
```

### Workspace

```bash
bun nx show projects                # List all projects
bun nx show project <name> --json   # Project details
bun nx graph                        # Visual dependency graph
bun nx reset                        # Clear Nx cache
```

## Angular Patterns

### Component Generation

All components automatically use:

- **OnPush** change detection (mandatory)
- Inline styles and templates
- Standalone components

```bash
bun nx g @nx/angular:component my-component --project=web-dashboard
```

### Component Structure

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-my-component',
  imports: [],
  template: `
    <div>{{ count() }}</div>
    <button (click)="increment()">Increment</button>
  `,
  styles: `
    div {
      padding: 1rem;
    }
  `,
})
export class MyComponent {
  count = signal(0);

  increment() {
    this.count.update((c) => c + 1);
  }
}
```

### State Management

- Use **signals** for reactive state (Angular 21)
- Apollo Client for GraphQL queries
- Services with `inject()` function

### Shared UI Library

Import from `@skooltrak-platform/ui`:

- Components: Calendar, Modal, Toast, Paginator, TextEditor
- Pipes: DecimalPipe, TimeAgoPipe
- Services: ConfirmationService, ModalService, ToastService

## NestJS Patterns

### Module Generation

```bash
bun nx g @nx/nest:resource my-feature --project=dashboard-backend
```

### Service with Prisma

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

@Injectable()
export class MyService {
  private prisma = new PrismaClient();

  async findAll(organizationId: string) {
    return this.prisma.myModel.findMany({
      where: { organizationId },
    });
  }
}
```

### Authentication

- Import from `@skooltrak-platform/auth`
- Use `AuthGuard` for protected routes
- JWT tokens with Passport strategies
- Multi-tenant (Organization-scoped)

### GraphQL Resolvers

- Use `@nestjs/graphql` decorators
- Apollo Server 5 integration
- Code-first or schema-first approach

## Database

### Multi-tenancy

All queries must filter by `organizationId`:

```typescript
// ✅ Correct
await prisma.course.findMany({
  where: { organizationId: user.organizationId },
});

// ❌ Wrong - exposes data across organizations
await prisma.course.findMany();
```

### Key Models

- **Organization** - Multi-tenant root
- **User** - With role, can be student/teacher/parent (1:1)
- **Role/Permission** - RBAC system
- Educational: School, Course, ClassGroup, Teacher, Student, Parent
- Communication: Message, Newsletter, File

### Schema Changes Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
bun prisma migrate dev --name add_new_field

# 3. Client auto-regenerates (or run manually)
bun prisma generate

# 4. Use new types in code
# 5. Commit schema + migration
git add prisma/
git commit -m "feat: add new field to model"
```

## Testing

### Frontend (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Backend (Jest)

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E (Playwright)

E2E projects in `apps/*-e2e/`

## Styling

### Tailwind + DaisyUI

```html
<!-- Use DaisyUI component classes -->
<button class="btn btn-primary">Click Me</button>

<!-- Or custom Tailwind -->
<div class="flex items-center gap-4 p-4 rounded-lg bg-base-200">
  <span class="text-lg font-semibold">Hello</span>
</div>
```

### Component Styles

All components use inline styles (per nx.json config)

## Git Workflow

### Commit Convention

```bash
feat: add new feature
fix: bug fix
refactor: code refactoring
docs: documentation
test: tests
chore: maintenance
```

### Branch Strategy

- Main branch: `main`
- Feature: `feature/description`
- Bugfix: `fix/description`

## CI/CD

### GitLab CI Pipeline

On every push to `main` or merge request:

1. Install bun
2. `bun install --no-cache`
3. `bun playwright install --with-deps`
4. `bun nx run-many -t lint test build e2e`
5. `bun nx fix-ci` (Nx Cloud self-healing)

### Nx Cloud

Enabled for caching and task distribution.
Cloud ID: `68e145c2c3749010daf16002`

## Troubleshooting

### "Command not found: bun"

Install Bun from https://bun.sh and run `bun install` in the project root.

### "Cannot find module '@prisma/client'"

```bash
bun prisma generate
```

### "Cannot find module '@skooltrak-platform/ui'"

```bash
bun nx reset
bun install
```

### Component not updating (OnPush)

Use signals or manually trigger change detection:

```typescript
constructor(private cdr: ChangeDetectorRef) {}

updateData() {
  this.data = newData;
  this.cdr.markForCheck();
}
```

### Stale Nx cache

```bash
bun nx reset
```

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="your-secret-key"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="bucket-name"
RESEND_API_KEY="re_..."
```

### Frontend

Configure in app config or environment files as needed.

## Resources

- [Nx Documentation](https://nx.dev)
- [Angular Documentation](https://angular.dev)
- [NestJS Documentation](https://nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better-auth Documentation](https://www.better-auth.com)
