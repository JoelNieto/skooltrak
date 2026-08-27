# Plan: Student Balance Tab & Auto-Generated Study-Plan Charges

## Context

The `financial` module already exists (`apps/dashboard-backend/src/app/financial`): `Charge`/`Payment`
models, `ChargesService`, `PaymentsService`, and a standalone `student-finances.ts` page. Today:

- Charges are only created manually via `POST /financial/charges` and always start as `PENDING`.
- `OVERDUE` and `PAID` are **never** set — payments are a separate ledger with no link to charges.
- The standalone `/students/:id/finances` page reads `store.currentStudentId()` which resolves to the
  **logged-in student's own** id, so it only works for self-view, not for staff viewing a student.
- The student details page (`students/student.ts`) has tabs (info/medical/courses/attendance) but no balance tab.

### Decisions (confirmed with user)
1. **Status model:** link payments → charges. Add `chargeId` to `Payment`; on payment creation recompute
   the linked charge status (`PENDING` / `PARTIAL` / `PAID`). Balance amounts are derived, not stored.
2. **Tuition due dates:** add a configurable `schoolYearStartMonth` to `School`. Month `m` maps to
   `year = currentYear` if `m >= schoolYearStartMonth` else `currentYear + 1`; dueDate = 1st of that month/year.
3. **Charge generation trigger:** generate on student creation (when a class group/study plan is present)
   **and** when a student is later assigned to a class group, idempotently (skip if charges already exist
   for that `studyPlanId + studentId`).

## Goal
- When a student is added/assigned, enrollment costs + monthly tuition from their study plan become charges.
- Add a **Balance** tab to the student details page, visible only to admins/staff **or** the student/parent themselves.
- The balance shows overdue vs active charges and totals for **overdue**, **active**, and **paid**.

---

## Backend changes

### 1. Schema (`prisma/schema.prisma`) + migration
- `Payment`: add `chargeId String?` with relation `charge Charge? @relation(fields: [chargeId], references: [id], onDelete: SetNull)` and `@@index([chargeId])`; add `charges Payment[]` to `Charge`.
- `School`: add `schoolYearStartMonth Int @default(8)` (1–12; August default). Regenerate client + write migration.
- Expose `schoolYearStartMonth` through the `School` entity/DTO and the school settings read/write path.

### 2. Payments → charge status (`financial/payments.service.ts`, `financial/dto/create-payment.input.ts`)
- `CreatePaymentInput`: add optional `chargeId?: string`.
- `PaymentsService.create`: persist `chargeId`; if set, recompute the charge's status from
  `sum(payments.amount where chargeId)` vs `charge.amount`: `>=` → `PAID`, `> 0` → `PARTIAL`, else `PENDING`.
  Use a `$transaction` and update the `Charge.status`.

### 3. Charge generation from study plan (`financial/charges.service.ts`)
Add `async generateFromStudyPlan(studentId, studyPlanId, schoolId, year)`:
- **Idempotent guard:** if any `Charge` exists where `studentId` + `studyPlanId` match, return early.
- Fetch `StudyPlan` with `enrollmentCosts` (amount, name) + `monthlyTuitionAmount` + `tuitionMonths`.
- Fetch `School` (`currentYear`, `schoolYearStartMonth`).
- **Enrollment costs:** one `ENROLLMENT` charge each — `amount`, `description = name`,
  `dueDate = 1st of schoolYearStartMonth in currentYear`, `status = PENDING`, `year = currentYear`.
- **Tuition:** for each `m` in `tuitionMonths` (skip if `monthlyTuitionAmount` is null/0):
  `TUITION` charge, `amount = monthlyTuitionAmount`, `dueDate =` 1st of month `m` using the year mapping in
  Decision 2, `status = PENDING`, `year = dueDate.getFullYear()` (so it groups with its due year).
- Create all in a single `$transaction`.

### 4. Wire into student lifecycle (`students/students.service.ts`)
- Inject `ChargesService` into `StudentsService`.
- In `create()`: after the student is created, if `classGroupId` is present, resolve
  `group.studyPlanId` and call `generateFromStudyPlan(...)`. Wrap in try/catch + `logger.warn` (mirror the
  existing chat-sync pattern) so charge failure never blocks student creation.
- In `update()`: when `classGroupId` changes to a new non-null value, resolve the new group's `studyPlanId`
  and call `generateFromStudyPlan(...)` (idempotent guard prevents duplicates on reassignment).

### 5. Balance summary endpoint (`financial/financial.controller.ts`, `financial/payments.service.ts`)
Add `GET /financial/student-balance-summary?studentId=`:
- Returns per the viewed student:
  - `totalCharges`, `totalPayments`, `balance` (existing logic).
  - `totalOverdue` = sum of `(charge.amount − paidPortion)` for charges with `dueDate < today`.
  - `totalActive` = sum of `(charge.amount − paidPortion)` for charges with `dueDate >= today`.
  - `totalPaid` = sum of all payments for the student (ledger total, includes legacy unlinked payments).
  - `charges`: each with computed `status` (`PENDING`/`PARTIAL`/`PAID`/`OVERDUE`), `paidAmount`, `amount`,
    `dueDate`, `description`, `chargeType`.
  (`paidPortion` = sum of payments for that charge; `OVERDUE` = `dueDate < today` and not fully paid.)
- Keep existing `student-balance`, `charges/by-student`, `payments/by-student` endpoints.

### 6. Authorization (owner/self access)
The three read endpoints currently require `Perm.VIEW_FINANCIALS`, which students/parents may lack.
Relax them (inline in controller using `req.user`) to also allow when the requester is:
- the student themselves (`req.user.userId === student.user.userId`), or
- a parent linked to the student (`Parent` where `userId === req.user.userId` and student in `students`).
Staff with `VIEW_FINANCIALS` continue to work. Keep the `@RequirePermissions` for the admin-only
create/delete/config endpoints.

---

## Frontend changes (`apps/web-dashboard`)

### 7. Refactor `students/student-finances.ts`
- Accept an explicit `studentId` **input** (fallback to `store.currentStudentId()` for the existing
  self-view route). Update the three `httpResource`s to use that id instead of the store value.
- Replace the three endpoints with the single `student-balance-summary` call; render:
  - Three stat cards: **Overdue** (`totalOverdue`, error color), **Active** (`totalActive`, warning),
    **Paid** (`totalPaid`, success). Keep the existing total/balance cards if desired.
  - Charges list split visually into **Overdue** and **Active** sections using the computed `status`.

### 8. Add Balance tab to `students/student.ts`
- Import the `StudentFinances` component and add a `balance` tab to the `ngTabList`.
- Compute `canViewBalance()`:
  - `auth.hasPermission('VIEW_FINANCIALS')` (admin/staff), **or**
  - `auth.isStudent() && student.user?.id === auth.user()?.id`, **or**
  - `auth.isParent() && student.parents?.some(p => p.userId === auth.user()?.id)`.
- Render the tab `ngTabPanel` only when `canViewBalance()`; pass `[studentId]="id()"`.
- Remove the route-level `permissionGuard('VIEW_FINANCIALS')` from the standalone
  `/students/:id/finances` route (or relax it) so the student/parent self-view still works; the new
  backend owner-check secures the data.

### 9. School settings UI (minimal, recommended)
- Add `schoolYearStartMonth` to the school settings form so admins can configure the academic-year start
  (drives correct tuition due-date years). Backend read/write must exist regardless.

---

## Files to touch (summary)
- `prisma/schema.prisma` (+ migration), `School` entity/DTO + settings service.
- `apps/dashboard-backend/src/app/financial/dto/create-payment.input.ts`
- `apps/dashboard-backend/src/app/financial/payments.service.ts`
- `apps/dashboard-backend/src/app/financial/charges.service.ts`
- `apps/dashboard-backend/src/app/financial/financial.controller.ts`
- `apps/dashboard-backend/src/app/students/students.service.ts`
- `apps/web-dashboard/src/app/students/student-finances.ts`
- `apps/web-dashboard/src/app/students/student.ts`
- `apps/web-dashboard/src/app/dashboard.routes.ts`
- School settings form (frontend).

## Validation
- `nx run dashboard-backend:test` (extend `charges.service.spec` / `payments.service.spec` for
  `generateFromStudyPlan` idempotency and payment→charge status flip).
- `nx run-many --target=build --projects=dashboard-backend,web-dashboard`.
- Manual: create a student assigned to a class group whose study plan has enrollment costs + 10 tuition
  months → confirm charges created (correct due-date years via `schoolYearStartMonth`). Record a payment
  linked to a charge → confirm status flips to `PAID`/`PARTIAL` and summary totals update. Open the student
  details page as admin (tab visible) and as the student/parent (tab visible, data scoped); as another
  student (tab hidden, 403 on API).

## Open questions / risks
- "Paid" total is ledger-based (all payments) and may include pre-link legacy payments; acceptable per Decision 1.
- Removing a payment is not supported today, so charge-status recompute on delete is out of scope.
- `schoolYearStartMonth` defaults to August; schools with different calendars must set it in settings.
