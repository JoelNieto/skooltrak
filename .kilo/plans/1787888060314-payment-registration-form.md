# Payment Registration Form — Implementation Plan

## Goal
Add a staff-facing form to **record a student payment**, placed as a modal triggered from the existing Financial Module (`/financial-module`), mirroring the existing "Nuevo cargo" (`create-charge-form.ts`) pattern. Backend already supports this via `POST /api/v1/financial/payments`.

## Confirmed decisions
- **Placement:** Modal opened from the "Pagos" tab of `/financial-module` (same UX as "Nuevo cargo").
- **Charge linkage:** Optional `chargeId` field. After a student is selected, staff may pick one of that student's outstanding charges; posting with `chargeId` auto-recomputes charge status (`PAID`/`PARTIAL`) on the backend.

## Context / existing patterns (do not reinvent)
- Backend: `apps/dashboard-backend/src/app/financial/payments.service.ts` `create()` accepts `CreatePaymentInput { studentId, amount, paidAt, reference?, createdBy?, chargeId? }`; endpoint `POST /api/v1/financial/payments` (requires `MANAGE_FINANCIALS` server-side). Recomputes charge status when `chargeId` provided.
- Reference form: `apps/web-dashboard/src/app/admin/forms/create-charge-form.ts` (uses `form`/`FormField`/`required`/`min` from `@angular/forms/signals`, `Toast` from `#/ui`, student list from `/api/v1/students/by-school/{schoolId}`, posts via `HttpClient`).
- Modal host: `apps/web-dashboard/src/app/admin/pages/financial-module.ts` opens `CreateChargeForm` via `Modal.open(Component, { title, size })`.
- Payments list: `apps/web-dashboard/src/app/admin/components/payments-section.ts` — currently has **no** `reloadToken` input (charges-section does) and **no** create button.
- Student charges (for optional linkage): `GET /api/v1/financial/charges/by-student?studentId=`.

## Tasks

### 1. New component: `apps/web-dashboard/src/app/admin/forms/create-payment-form.ts`
Mirror `create-charge-form.ts` structure. Component (default export, standalone, `selector: 'app-create-payment-form'`):

- **Imports:** `FormField` from `@angular/forms/signals`; `HttpClient, httpResource` from `@angular/common/http`; `Toast` from `#/ui`; `Component, inject, output, signal` from `@angular/core`; `form, required, min` from `@angular/forms/signals`; `Store` from `../../core/store`; `Auth` from `../../auth/auth`.
- **Inputs/signals:**
  - `closeModal = output<void>()`
  - `students = httpResource<{id,firstName,fatherName}[]>(() => schoolId ? { url: /api/v1/students/by-school/${schoolId} } : undefined)` (schoolId from `store.currentSchoolId()`).
  - `charges = httpResource<Charge[]>(() => selectedStudentId ? { url: '/api/v1/financial/charges/by-student', params: { studentId: selectedStudentId } } : undefined)` where `Charge = { id, amount, description, dueDate, status, chargeType }`. Reload this resource whenever the student selection changes (use `linkedSignal`/effect or key the resource on `selectedStudentId`).
  - `formModel` signal: `{ studentId: '', amount: 0, paidAt: <today YYYY-MM-DD>, reference: '', chargeId: '' }`.
  - `form = form(formModel, schema => { required(studentId); required(paidAt); required(amount); min(amount, 0.01); })`.
- **Template fields:** student `<select>` (required), amount `<input type="number" step="0.01">` (required), payment date `<input type="date">` (required, default today), reference `<input type="text">` (optional), charge `<select>` (optional; options from `charges` for selected student, showing description + amount + status; empty value = "Sin cargo específico"). Buttons: Cancelar (`closeModal.emit()`) + Registrar pago (submit).
- **onSubmit:** if `form().invalid()` → `toast.showError('Completa los campos requeridos')`; build payload `{ studentId, amount, paidAt, reference: reference || undefined, chargeId: chargeId || undefined, createdBy: auth.user()?.id }`; `http.post('/api/v1/financial/payments', payload).subscribe({ next: toast.showSuccess('Pago registrado'); closeModal.emit(); error: toast.showError(err?.message ?? 'Error al registrar') })`.

### 2. `apps/web-dashboard/src/app/admin/components/payments-section.ts`
- Add `reloadToken = input<number>(0)` (like `charges-section`).
- Include `reloadToken()` in the `paymentsResource` httpResource dependency closure so changing it triggers a refetch (already returns `defaultValue` and reads signals; add `reloadToken()` to the params/deps). No other behavior change.

### 3. `apps/web-dashboard/src/app/admin/pages/financial-module.ts`
- Import `CreatePaymentForm` from `../forms/create-payment-form`.
- Add `paymentsVersion = signal(0)`.
- Add a "Registrar pago" button next to "Nuevo cargo" inside `@if (!auth.isStudent())`:
  ```
  <button class="btn btn-primary btn-sm" (click)="openCreatePayment()">
    <span class="material-symbols-outlined">add</span> Registrar pago
  </button>
  ```
- Pass `[reloadToken]="paymentsVersion()"` to `<app-payments-section>`.
- `openCreatePayment()` opens `Modal.open(CreatePaymentForm, { title: 'Registrar pago', size: 'medium' })` and on `.closed` does `paymentsVersion.update(v => v + 1)`.

## Notes / non-goals
- No new route; no server changes (endpoint + DTO already exist).
- Client does NOT add a `MANAGE_FINANCIALS` guard (consistent with existing charges flow; server enforces it). Button is hidden for students via `auth.isStudent()`.
- Date sent as `YYYY-MM-DD` string; Prisma parses `paidAt`/`Date` field correctly (same approach as `dueDate` in charge form).

## Validation
- `pnpm nx lint web-dashboard` and `pnpm nx build web-dashboard` (or `pnpm nx test web-dashboard` if a spec is added) succeed.
- Manual: open `/financial-module` → Pagos tab → "Registrar pago" → pick student, enter amount/date, optionally a charge → submit → toast success, list refreshes, and (if charge chosen) that charge's status updates in the Cargos tab.
- Edge cases: submit with missing required fields shows error; optional reference/charge omitted works; selecting a different student resets the charge list.
