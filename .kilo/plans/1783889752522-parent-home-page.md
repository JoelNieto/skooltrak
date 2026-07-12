# Plan: Parent Home Page (`parent-home.ts`) + Route

## Context
The web dashboard already renders a role-specific landing page at the `/home` route using
`canMatch` guards (`adminGuard`, `teacherGuard`, `studentGuard`) in
`apps/web-dashboard/src/app/dashboard.routes.ts:117-131`. A `parentGuard` already exists in
`apps/web-dashboard/src/app/auth/auth.guard.ts:44` but is not wired into `/home`, so parents
currently fall through to no home view. We add a `parent-home.ts` component (mirroring
`student-home.ts` / `teacher-home.ts`) and a `canMatch: [parentGuard]` route entry.

Per user decision, the parent home is an **overview across all linked children** (no child
selection required up front).

## Files to change

### 1. Create `apps/web-dashboard/src/app/parent-home.ts`
New default-export standalone component `ParentHome` (selector `app-parent-home`),
`ChangeDetectionStrategy.OnPush`, following the existing home-page pattern.

Imports/dependencies (reuse what student/teacher homes use):
- `#/ui` → `PageHeader`, `StatCard`, `EmptyState`
- `@angular/common` → `DatePipe`
- `@angular/common/http` → `HttpClient`, `httpResource`
- `@angular/core` → `ChangeDetectionStrategy, Component, computed, inject, signal`
- `@angular/router` → `RouterLink`
- `./core/store` → `Store`

Content (overview across all linked children):
- `lib-page-header` title="Dashboard de padres" subtitle="Resumen del progreso de tus hijos."
- Stat cards row (md:grid-cols-3):
  - "Hijos vinculados" → `children().length`
  - "Mensajes nuevos" → `recentMessages.value()?.length ?? 0`
  - "Boletines recientes" → `recentNewsletters.value()?.length ?? 0`
- "Hijos vinculados" card: grid of linked-children cards (name, schoolName, classGroupName)
  linking to `/parent/progress` (select child into `ParentContext` on click, like
  `parent-portal.ts:180-184`). Use `EmptyState` when none.
- "Mensajes recientes" card: reuse `/api/v1/messages` (`take: 4`), `EmptyState` when empty,
  link to `/messages`.
- "Boletines recientes" card: reuse `/api/v1/newsletters/published` (`schoolId` from
  `store.currentSchoolId()`, `take: 3`), `EmptyState` when empty.

Data sources:
- Linked children via `HttpClient.get<ParentMeResponse[]>('/api/v1/parents/me')` (same shape
  as `parent-portal.ts:8-18`) wrapped in an `httpResource` or `rxResource`; flatten parents→
  students into `LinkedChild[]` (`parent-context.service.ts:3-10`).
- `recentMessages` / `recentNewsletters` as `httpResource` (same pattern as teacher-home.ts:
  201-219). Include `defaultValue: []` so `.value()` is safe in templates.

Keep a small `stripHtml()` helper if newsletter preview is shown (mirrors teacher/student
homes). Link children via `RouterLink` + click handler that calls `ParentContext.select(child)`
then `Router.navigate(['/parent/progress'])`.

### 2. Edit `apps/web-dashboard/src/app/dashboard.routes.ts`
- Add `parentGuard` to the import list from `./auth/auth.guard` (line 2-10).
- Add a `/home` route entry after the student entry (after line 131):
  ```ts
  {
    path: 'home',
    canMatch: [parentGuard],
    loadComponent: () => import('./parent-home'),
  },
  ```
  Order: keep admin/teacher/student/parent as sibling `canMatch` entries on `/home`;
  `canMatch` resolves per-role, so ordering among them is not significant.

## Validation
- `pnpm nx lint web-dashboard` and `pnpm nx build web-dashboard` (or typecheck) pass.
- As a user with role `PARENT`, navigating to `/home` loads `parent-home` (not student/teacher).
- Verify linked children, recent messages, and newsletters render; empty states show when no
  data. Clicking a child navigates to `/parent/progress` with that child selected.

## Notes / Risks
- `parentGuard` already exists; no guard work needed.
- `/api/v1/parents/me` returns an array of parent records; confirm it returns the current
  parent (used already by `parent-portal`, so safe to reuse).
- Do not give the page its own permission guard; it is reached via `parentGuard` on `/home`.
