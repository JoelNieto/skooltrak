# Allow Editing Global Default Roles (Block Delete Only)

## Goal
Permit updating global default roles (`organizationId === null`) while continuing to
forbid deleting them. Editing must not change a role's `organizationId` (a global role
stays global; it cannot be reassigned to an organization via update).

## Context
File: `libs/auth/src/lib/roles/roles.service.ts`

- `update()` (line 61) and `remove()` (line 96) both currently call
  `assertNotGlobalRole(id)` (lines 62 and 97), which throws
  `ForbiddenException('Global default roles cannot be modified or deleted')` when
  `role.organizationId === null` (lines 107-116).
- `update()` maps `organizationId` into a Prisma `organization.connect` (lines 67-76).
  Today the guard blocks global roles entirely, so this path was never reached for them.
  Once editing is allowed, this must be locked down.
- Controller (`roles.controller.ts`) `PATCH /v1/roles` and `DELETE /v1/roles/:id` both
  already require `Perm.MANAGE_ROLES`; no controller changes needed.

## Decisions
- Global roles become editable for name / description / permissions.
- `organizationId` on a global role must NOT be changeable via `update()`.
- Delete of global roles remains forbidden.

## Tasks
1. In `roles.service.ts`, remove the `await this.assertNotGlobalRole(id);` call from
   `update()` (line 62). Keep it in `remove()` (line 97).
2. Rename `assertNotGlobalRole` and its comment to reflect delete-only intent, e.g.
   `assertNotGlobalRoleForDelete`, and update the error message to
   `'Global default roles cannot be deleted'`. Update the call site in `remove()`.
3. Prevent `organizationId` reassignment during `update()`:
   - Before building the update payload, fetch the existing role's `organizationId`
     (reuse a `findUnique` with `select: { organizationId: true }`).
   - If the existing role is global (`organizationId === null`), ignore/strip any
     incoming `organizationId` (do not add the `organization.connect` block) so the
     role stays global. Optionally throw `ForbiddenException` if the caller explicitly
     sends a non-null `organizationId` for a global role, to make the constraint
     explicit rather than silent. Recommended: throw for an explicit change attempt.
   - Leave existing behavior unchanged for non-global (org-scoped) roles.
4. Confirm `UpdateRoleInput` (`dto/update-role.input.ts`) needs no changes — it extends
   `PartialType(CreateRoleInput)` so all fields remain optional.

## Failure Modes / Edge Cases
- Update payload with no `organizationId`: safe, no reassignment attempted.
- Update payload with `organizationId` equal to null for a global role: no-op, stays global.
- Update payload with a real `organizationId` for a global role: rejected (recommended)
  or silently ignored (fallback) — pick one; recommendation is reject with
  `ForbiddenException`.
- Delete of a global role: still throws `ForbiddenException`.
- Non-existent role id: `findUnique` returns null; existing code already treats missing
  role as "not global" and proceeds — behavior unchanged.

## Validation
- Unit tests in `roles.service.spec.ts` (currently only a smoke test). Add cases with a
  mocked `PrismaService`:
  - `update()` succeeds for a global role (organizationId null) editing name/permissions.
  - `update()` does not reassign a global role to an org (either throws or strips it,
    per chosen behavior).
  - `update()` still works for org-scoped roles including changing permissions.
  - `remove()` throws `ForbiddenException` for a global role.
  - `remove()` succeeds for an org-scoped role.
- Run: `pnpm nx test auth` (verify correct project name via nx-workspace if it differs).
- Manual: `PATCH /v1/roles` on a global role id returns updated role; `DELETE /v1/roles/:id`
  on a global role returns 403.

## Out of Scope
- Changing permission model or `Perm.MANAGE_ROLES` requirement.
- Frontend/web-dashboard changes.
- Migrations or schema changes.
