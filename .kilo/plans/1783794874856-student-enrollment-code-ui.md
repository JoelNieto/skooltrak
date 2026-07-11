# Plan: Enrollment code display + regenerate action in Student component

## Goal
Surface the student enrollment code in the UI of
`apps/web-dashboard/src/app/students/student.ts`, with a **copy** action and a
permission-gated **regenerate** action. All backend endpoints and the
component-class logic already exist; only the template is missing.

## Current state (verified)
- Class already has (student.ts:382-416):
  - `regenerating = signal(false)`
  - `regenerate()` → `POST /api/v1/students/:id/enrollment-code/regenerate`,
    on success toasts + `studentResource.reload()`
  - `copyCode()` → reads `studentResource.value()?.enrollmentCode`, writes to clipboard, toasts
  - `toasts = inject(Toast)`
- `Toast` is imported from `#/ui` (student.ts:1). `DatePipe` already imported/registered.
- Backend `GET /api/v1/students/:id` (`findOne`) returns full student model, so
  `enrollmentCode` and `enrollmentCodeGeneratedAt` are present on
  `studentResource.value()`.
- Regenerate endpoint requires `MANAGE_STUDENTS` (students.controller.ts:83-88);
  component already uses `auth.hasPermission('MANAGE_STUDENTS')` for the Edit button (student.ts:99).
- **Gap:** the template renders no enrollment-code section and never calls
  `regenerate()` / `copyCode()`. The methods are currently dead code.

## Decisions (resolved)
- **Placement:** header card (always visible).
- **Confirm guard:** add `window.confirm` before regenerate (destructive — revokes old code).

## Implementation tasks (single file)
Edit `apps/web-dashboard/src/app/students/student.ts`.

1. Add an enrollment-code section inside the header card body (student.ts:60-108),
   below the name/status row, so it stays visible regardless of the active tab.

2. Render the code value using `@let student = studentResource.value()!` (already
   available in scope at student.ts:51):
   - If `student.enrollmentCode` exists: show it (monospace badge / `kbd` or
     `badge badge-soft`), plus generated-at date via
     `{{ student.enrollmentCodeGeneratedAt | date: 'dd/MM/yyyy HH:mm' }}`.
   - If absent: show a "Sin código" placeholder (`text-base-content/50`).

3. Copy button:
   - `(click)="copyCode()"`, `btn btn-ghost btn-sm`, `material-symbols-outlined`
     icon `content_copy`.
   - Disable when `!student.enrollmentCode`.

4. Regenerate button (permission-gated):
   - Wrap in `@if (auth.hasPermission('MANAGE_STUDENTS'))` to mirror Edit button.
   - `(click)="regenerate()"`, `btn btn-sm`, icon `refresh`.
   - Disable + show spinner while `regenerating()` is true
     (`[disabled]="regenerating()"` plus DaisyUI `loading loading-spinner` class).
   - Add a confirm guard: at the top of `regenerate()` (before the POST), call
     `if (!window.confirm('Regenerar el código revocará el actual. ¿Continuar?')) return;`.
     This is the only class-level change; everything else is template-only.

## Style / consistency notes
- Reuse existing DaisyUI classes already in this file: `btn`, `btn-sm`,
  `btn-ghost`, `btn-primary`, `badge badge-soft`, `material-symbols-outlined`.
- Keep Spanish labels consistent with rest of file ("Código de matrícula",
  "Copiar", "Regenerar").

## Out of scope
- No changes to backend, service, entity, or DTOs (already complete).
- No new imports needed (`Toast`, `DatePipe`, `Auth` all present).
- Only class change is the `window.confirm` guard in `regenerate()`.

## Validation
1. `pnpm nx lint web-dashboard` — no new lint errors (the currently-unused
   `regenerate`/`copyCode` become used, which may also clear any unused warnings).
2. `pnpm nx build web-dashboard` (or `typecheck`) — template compiles; note
   `StudentView` is `any`, so `enrollmentCode` access won't type-error.
3. Manual: open a student page.
   - Code + generated-at render; "Copiar" copies to clipboard (success toast).
   - As `MANAGE_STUDENTS` user: "Regenerar" shows spinner, code changes, success
     toast, page data reloads.
   - As non-`MANAGE_STUDENTS` user: Regenerate button hidden; copy still works.
   - Student with no code: placeholder shown, copy disabled.

## Open decisions
None — placement and confirm guard resolved above.
