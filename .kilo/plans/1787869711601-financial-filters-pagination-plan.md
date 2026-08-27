# Financial Module: Student Access + Charges/Payments Filters + Pagination

## Context
The `Módulo financiero` page (`apps/web-dashboard/src/app/admin/pages/financial-module.ts`) currently:
- Shows a **charges** table from `GET /api/v1/financial/charges/by-school` (only `schoolId`+`year`; full unfiltered list).
- Shows a **payments** tab that is just a placeholder (`lib-empty-state`, "próximamente").

Requirements (confirmed):
1. Split **both** sections into their own components.
2. **Charges** filters: `status`, `type`, `student`, `description` search. **Payments** filters: `student` + `reference` search.
3. The **student filter is hidden in BOTH sections when the current user's role is `STUDENT`**.
4. **Pagination** on both sections.
5. **Students get access to this page**, scoped to their own data. Implemented via **exclusive student endpoints** so the existing `by-school`/`by-student` implementations are NOT disrupted.
6. **Server-side** filtering + pagination (extend backend). **web-dashboard only** (web-admin stays MVP placeholder).

## Key constraints discovered
- `financial-module` route (`dashboard.routes.ts:164`) has only `authGuard + onboardingCompletedGuard` (no role gate) → students can already navigate once the sidebar link is visible.
- Sidebar link (`core/sidebar.ts:358`) is inside `@if (auth.isAdmin())` → students never see it. Must be exposed to students.
- `Store.currentStudentId()` (`store.ts:33` = `auth.user()?.student?.id`) gives the current student's id; `me` includes the `student` relation.
- `Auth.isStudent()` (`auth.ts:100`) drives role-based visibility.
- `Pagination` service + `lib-paginator` + `toFetchQueryRecord` (`../core/fetch-query-params`) are the established server-side pagination pattern (see `courses.ts`).
- Only `financial-module.ts` calls `charges/by-school`; `charges/by-student` / `payments/by-student` are used by student/parent finance views and must stay unchanged.

## Data model
- `Charge`: `status` ∈ {PENDING, PARTIAL, PAID, OVERDUE}, `chargeType` ∈ {CUSTOM, TUITION, ENROLLMENT}, `studentId`, `description`, `year`, `schoolId`.
- `Payment`: `studentId`, `reference`, `amount`, `paidAt`, `chargeId`. No status/type/description → payments get only `student` + `reference` filters.

---

## Backend (`apps/dashboard-backend`) — additive, non-disruptive

### Staff endpoints (VIEW_FINANCIALS)
- **Extend `GET charges/by-school`** (`financial.controller.ts` + `charges.service.ts`):
  - Query: `year?`, `status?`, `chargeType?`, `studentId?`, `description?`, `skip?`, `take?`.
  - `chargesService.findBySchool(opts)` → `{ data: Charge[]; total: number }` (where: `schoolId` always; optional `year`, `status` eq, `chargeType` eq, `studentId` eq, `description` contains insensitive; `findMany` with `skip/take` + `count`). Keep `@RequirePermissions(Perm.VIEW_FINANCIALS)`.
- **New `GET payments/by-school`** (`financial.controller.ts` + `payments.service.ts`):
  - Query: `year?`, `studentId?`, `reference?`, `skip?`, `take?`.
  - `paymentsService.findBySchool(opts)` → `{ data: Payment[]; total: number }`. Payment has no `schoolId` → filter via relation `student: { schoolId }`; optional `studentId` eq, `reference` contains insensitive; `year` → `paidAt` range. `@RequirePermissions(Perm.VIEW_FINANCIALS)`.

### Exclusive student endpoints (do NOT touch existing `by-student`)
- **New `GET charges/student`**: `STUDENT`-only. Resolve own `studentId` from `req.user.userId` (`prisma.student.findFirst({ where: { userId }, select: { id, schoolId } })`); 403 if none / not STUDENT. Query: `year?`, `status?`, `chargeType?`, `description?`, `skip?`, `take?`. Return `{ data, total }` (include `student`, `studyPlan`). Reuses a `findByStudentScoped(studentId, opts)` helper.
- **New `GET payments/student`**: same scoping. Query: `year?`, `reference?`, `skip?`, `take?`. Return `{ data, total }` (include `student`).
- **Leave `charges/by-student` and `payments/by-student` UNCHANGED** (still return arrays; used by `student-finances.ts` / parent views).

### Services
- `charges.service.ts`: add `findBySchool(opts)` and `findByStudentScoped(studentId, opts)`, both → `{ data, total }`.
- `payments.service.ts`: add `findBySchool(opts)` and `findByStudentScoped(studentId, opts)`, both → `{ data, total }`.

### Tests
- Update `charges.service.spec.ts`, `payments.service.spec.ts`: filter/pagination/`total`, and student scoping (own id only, ignores passed `studentId`).

---

## Frontend (`apps/web-dashboard`) — web-dashboard only

### New components `apps/web-dashboard/src/app/admin/components/`
- `charges-section.ts` (`app-charges-section`), `payments-section.ts` (`app-payments-section`), standalone.
- Shared: `auth = inject(Auth)`, `store = inject(Store)`, `pagination = inject(Pagination)`.
  - `isStudent = auth.isStudent()`; `showStudentFilter = computed(() => !this.isStudent())`.
  - `currentStudentId = store.currentStudentId()`.

### `charges-section.ts`
- `inputs`: `year` (number), `reloadToken` (number, included in loader deps for parent-driven reload after create/delete).
- Filter state: `statusFilter`, `typeFilter`, `studentFilter` (signals, '' = all); `description` via `pagination.updateSearch` (300ms debounce).
- `students = httpResource` → `/api/v1/students/by-school/${schoolId}` (dropdown; rendered only when `showStudentFilter()`).
- `chargesResource = httpResource<{ data: ChargeType[]; total: number }>(...)`:
  - **Student**: url `/api/v1/financial/charges/student`, params `{ year, status?, chargeType?, description: pagination.search(), skip, take }` (own id resolved server-side).
  - **Staff**: url `/api/v1/financial/charges/by-school`, params `{ schoolId, year, status?, chargeType?, studentId: studentFilter()?, description: pagination.search(), skip, take }`.
  - On value: `pagination.updateCount(total)`; constructor `pagination.updateTake(10)`.
- Template: filter toolbar (status select PENDING/PARTIAL/PAID/OVERDUE, type select CUSTOM/TUITION/ENROLLMENT, student select *ngIf showStudentFilter, description input → `pagination.updateSearch`), charges `<table>` (keep `statusClass` + delete button), `<lib-paginator>`, `lib-empty-state` when empty.
- `removeCharge()` (Confirmation + Toast + HttpClient.delete) — delete button wrapped in `@if (!isStudent())` (read-only for students).

### `payments-section.ts`
- `inputs`: `year`.
- Filter state: `studentFilter` (signal), `reference` via `pagination.updateSearch`.
- `students` resource (same; *ngIf showStudentFilter).
- `paymentsResource = httpResource<{ data: PaymentType[]; total: number }>(...)`:
  - **Student**: `/api/v1/financial/payments/student`, params `{ year, reference: search, skip, take }`.
  - **Staff**: `/api/v1/financial/payments/by-school`, params `{ schoolId, year, studentId: studentFilter()?, reference: search, skip, take }`.
  - `pagination.updateCount(total)`, `updateTake(10)`.
- Template: filter toolbar (student select *ngIf showStudentFilter, reference input), payments `<table>` (Estudiante, Monto `| number`, Referencia, Fecha `| date`), `<lib-paginator>`, `lib-empty-state` when empty.

### `financial-module.ts` (parent page)
- Remove inline charges table + placeholder payments block.
- `charges` panel → `<app-charges-section [year]="yearFilter()" [reloadToken]="chargesVersion()" />`; `payments` panel → `<app-payments-section [year]="yearFilter()" />`.
- `chargesVersion = signal(0)`; on create modal `closed` → `chargesVersion.update(v => v+1)`.
- Keep year `<select>`. Wrap **"Nuevo cargo" button in `@if (!auth.isStudent())`** (students are read-only).
- Register both components in `imports`.

### `core/sidebar.ts`
- Expose the financial-module link to students: move that `<li>` out of the `@if (auth.isAdmin())` block, wrapping it in `@if (auth.isAdmin() || auth.isStudent())` (so students reach the page but still don't see "Panel de admin").

---

## Validation
1. Backend: `nx run dashboard-backend:test` (charges + payments: filters, pagination, `total`, student scoping ignores passed `studentId`).
2. Backend: `nx run dashboard-backend:lint` + `nx run dashboard-backend:build` (typecheck).
3. Frontend: `nx run web-dashboard:lint` + `nx run web-dashboard:build` (new components compile & wire).
4. Manual:
   - **Admin/staff**: student filter visible; can filter charges by status/type/student/description and payments by student/reference; both paginate; "Nuevo cargo" + delete work.
   - **Student**: sidebar shows "Panel de financiero"; page shows only their own charges/payments; student filter hidden; "Nuevo cargo" + delete hidden; filters (status/type/description for charges, reference for payments) + pagination work.

## Risks / notes
- Changing `charges/by-school` return shape to `{data, total}` is safe — only `financial-module.ts` consumes it, and it's being rewritten.
- Existing `charges/by-student` / `payments/by-student` left untouched (student-exclusive endpoints are new paths).
- "Student role" gate uses `auth.isStudent()`; if the financial module is otherwise admin-gated, the conditional is still implemented as requested.
