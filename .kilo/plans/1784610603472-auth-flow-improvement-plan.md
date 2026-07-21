# Auth & Onboarding Flow Improvement Plan

Combines the codebase-grounded onboarding analysis (`.kilo/plans/1783890506900-onboarding-analysis-readme.md`) with the role-specific UX redesign proposal into a single, sequenced, implementation-ready plan.

## Goal

Harden the existing onboarding/auth flows, then evolve them into a lower-friction, role-appropriate experience for the four non-platform-admin roles (`ORG_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) plus pre-schoolers — without regressing multi-tenant security.

## Guiding decisions (resolved with user)

- **Sequencing: security-first, then UX.** Phase 1 closes the security/correctness defects; later phases build frictionless features on hardened primitives.
- **Schema changes are in scope.** Includes a typed onboarding-step enum, class-group history, nullable `Student.userId` for parent-proxy pre-schoolers, and QR/magic-link/import support fields. Prisma migrations are explicit tasks.
- Plan mode cannot edit source. **Hand off to an implementation-capable agent.**

## Current-state facts (verified in this repo)

- `prisma/schema.prisma:68` — `User.onboardingStep` is a free-form `String?` (`choose-path` | `school-setup` | `waiting-approval` | `completed` | null).
- `prisma/schema.prisma:532` — `Student.userId` is **required + `@unique`**; a student cannot exist without an auth user today (blocks profile-only pre-schoolers).
- `prisma/schema.prisma:519-520` — `Student.classGroupId` is a single nullable FK; **no history/progression table** exists.
- `prisma/schema.prisma:513-514` — `Student.enrollmentCode` (`@unique`) + `enrollmentCodeGeneratedAt` exist, but no expiry/rotation/rate-limit policy.
- `prisma/schema.prisma:570` — `Parent` is per-org (`@@unique([userId, organizationId])`): cross-org parent identity is partially modeled already.
- Admin-created students/teachers get `password = bcrypt(documentId)` and start `onboardingStep: 'completed'` (`apps/dashboard-backend/src/app/students/students.service.ts`, `teachers.service.ts`).
- Backend has a **dead parent path**: `handleParentJoin` (doc + approval) is unreachable; `linkChildByCode` (enrollment code, no approval) is the live path (`libs/auth/src/lib/auth.service.ts`).
- Approval model is inconsistent: STUDENT/PARENT auto-link; TEACHER/ORG_ADMIN-join require approval.
- `available-schools` exposes all schools to any authenticated user.
- Waiting-approval uses 30s polling; a WebSocket layer exists for chats.
- No magic-link, QR-code, or bulk-import infrastructure exists.

## Key source references

- Routing/guards: `apps/web-dashboard/src/app/dashboard.routes.ts`, `apps/web-dashboard/src/app/auth/auth.guard.ts`
- Self-service UI: `apps/web-dashboard/src/app/onboarding/*` (`choose-path`, `create-school`, `setup-wizard`, `join-school`, `select-role`, `verify-student`, `verify-parent`, `confirm-request`, `waiting-approval`)
- Registration: `apps/web-dashboard/src/app/auth/register.ts`
- Backend orchestration: `libs/auth/src/lib/auth.service.ts`, `libs/auth/src/lib/auth-session.controller.ts`
- Admin-created accounts: `apps/dashboard-backend/src/app/students/students.service.ts`, `.../teachers/teachers.service.ts`
- Admin approval UI: `apps/web-dashboard/src/app/admin/pages/join-requests.ts`

---

## Phase 1 — Security & correctness hardening (do first)

Closes the defects from the original analysis. New UX phases depend on these primitives.

1. **Kill `documentId`-as-password.** In `students.service.ts` / `teachers.service.ts`, replace `bcrypt(documentId)` with a random unguessable secret and force set-password on first login via the invitation link only. Never set a login-usable password from the document ID.
2. **Introduce a typed `OnboardingStep` enum.** Add a Prisma enum (`CHOOSE_PATH`, `SCHOOL_SETUP`, `WAITING_APPROVAL`, `COMPLETED`, plus new steps introduced later) mapped onto `User.onboardingStep`; migrate existing string values. Share the enum type across backend and `apps/web-dashboard`. Centralize all transitions in one service method (no scattered string writes). Update guards in `auth.guard.ts`.
3. **Rate-limit + log identity-proving endpoints.** Add attempt throttling and audit logging to `verify-student`, `link-child`, and `request-join-school` in `auth-session.controller.ts` / `auth.service.ts`.
4. **Enrollment-code expiry/rotation.** Use `enrollmentCodeGeneratedAt` to enforce expiry; add a regenerate action and invalidate old codes on rotation.
5. **Scope `available-schools`.** Require a minimum search query length, return search-only results, and hide sensitive counts/metadata to reduce cross-tenant disclosure.
6. **Remove the dead parent path.** Delete or intentionally wire `handleParentJoin`; make `enrollmentCode` optional-vs-required contract explicit in `dto/request-join-school.input.ts`; stop threading unused `schoolId`/`schoolName` query params through `join-school → select-role → verify-*` where the code derives the school.
7. **Onboarding audit log.** Add a table capturing who/what/when for approvals, rejections, links, and code regenerations.
8. **Surface email-send failures.** Return/record invitation email failures (status badge + retry action on the created user) instead of swallowing them.
9. **ORG_ADMIN permission drift.** Resolve ORG_ADMIN "all permissions" at check time (or via migration) so newly added permissions propagate to existing org admins.

Phase 1 validation: existing onboarding e2e/manual paths still pass; no login possible with a document ID; enum migration is reversible; `available-schools` no longer enumerates tenants.

---

## Phase 2 — Shared UX primitives (foundation for role flows)

Build the reusable capabilities the redesigned role flows need.

10. **Magic-link auth.** Add magic-link issuance/verification (new `Verification`-style records or dedicated table) so invited users and email-capable students can access without creating a password. Reuse the hardened invitation pipeline from Phase 1.
11. **QR-code service.** Generate signed, scannable connect tokens (backed by rotating enrollment/connect codes) for printing on welcome letters/report cards. Add a scan/redeem endpoint.
12. **CSV bulk-import wizard (backend + UI).** Add a validated import pipeline (dry-run preview, per-row error reporting, idempotent upsert by `documentId + schoolId`) for creating Students/Teachers. Reuse Phase 1 secure credential + invitation logic per row.
13. **Class-group progression history.** Add a `StudentClassGroupHistory` model (student, classGroup, from/to dates, reason) and record a row on every `Student.classGroupId` change. Keep the current FK as the "current" pointer; promotions become history transitions, not account changes.
14. **Nullable `Student.userId` (parent-proxy).** Make `Student.userId` nullable to allow profile-only students (pre-schoolers) with no auth credentials. Audit every query that assumes a non-null student user; guard against nulls.

Phase 2 validation: magic link logs a user in exactly once and expires; QR redeem links a parent to the intended child only; bulk import of a sample CSV creates N students with secure credentials and correct error rows; a class-group change writes a history row; a student can exist with `userId = null` without breaking dashboards.

---

## Phase 3 — Role-specific flow redesign

Applies the new-analysis vision on top of Phases 1–2.

### ORG_ADMIN
15. Consolidate organization creation + first school + admin registration into a single form (`create-school.ts` + `setup-wizard.ts`), landing on an immediately usable dashboard.
16. Add a trial/limited-access state (new onboarding-step value) that grants dashboard access before verification completes, with verification proceeding in the background.
17. Add domain-based auto-join rules (email domain → org/role) for future staff, configurable by the admin.
18. Make the **bulk import wizard (task 12)** the first suggested post-setup action.

### TEACHER
19. Add a second, self-service pathway: organization-code self-registration alongside the existing invitation path; keep invitation as the controlled option.
20. Support multi-school assignment during initial setup (not retroactively). Treat cross-school teaching as a first-class feature in `teachers.service.ts` and the setup UI.
21. Use **magic links (task 10)** for invited teachers instead of password creation.

### STUDENT
22. Make **CSV bulk import (task 12)** the primary admin creation method for students.
23. Dual auth: **magic links (task 10)** for email-capable students; **parent-proxy (task 14)** for pre-schoolers.
24. Track class-group progression automatically via **history (task 13)**; identity persists across group changes.

### PARENT
25. Allow parent self-registration with **no code required upfront** (delayed connection); parents can explore before linking.
26. Multiple child-connection methods: **QR scan (task 11)**, student enrollment code, and admin-approved access requests. Requests route through the Phase 1 approval + audit pipeline.
27. Unified cross-organization parent dashboard aggregating all `Parent` profiles for a `User` across orgs (leveraging the existing per-org `Parent` model).

### Pre-schooler
28. Profile-only student accounts (task 14) with parent accounts acting as the auth proxy; add a "View as Child" mode in the parent dashboard.
29. Define an upgrade path: when a pre-schooler later gets email access, attach a `userId` and enable magic-link/independent login without losing history/profile.

### Realtime & lifecycle polish
30. Push approval/rejection events over the existing WebSocket channel (fallback to polling); add "cancel request", admin reminders, and clear `waiting-approval` expiry semantics.
31. Guard/hide ORG_ADMIN as a join option unless the target org can actually approve it (avoid the bootstrap dead end).

Phase 3 validation: each role's redesigned happy path completes end-to-end; multi-school teacher is set up correctly on day one; a parent connects to multiple children across orgs via QR and code; a pre-schooler is created and viewable via parent proxy, then upgraded to independent login.

---

## Cross-cutting validation

- End-to-end onboarding tests **per role**, covering both entry paths (self-service + admin-created) and the reject→retry loop.
- Migration tests: enum conversion, nullable `userId`, new history/audit/magic-link tables apply and roll back cleanly.
- Security regression checks: no document-ID login, rate limits enforced, `available-schools` scoped, expired codes rejected.
- Multi-tenant isolation checks for cross-org parent dashboard.

## Risks

- Making `Student.userId` nullable can break code that assumes a student always has a user — requires a codebase-wide audit (task 14 explicitly).
- Enum migration must map every existing free-form `onboardingStep` value; missing a value strands users behind guards.
- Adding self-service org-code registration (teachers/parents) reopens an attack surface Phase 1 narrowed — must reuse rate limiting/audit from Phase 1.
- QR/magic-link tokens are bearer credentials; require signing, single-use, and expiry.

## Handoff / out of scope for plan mode

- This plan requires source edits and Prisma migrations. Switch to an implementation-capable agent to execute.
- Documentation source `docs/onboarding.md` from the sibling analysis plan remains a separate deliverable; keep it updated as flows change.

## Open questions (non-blocking)

- Trial/limited-access ORG_ADMIN state: which capabilities are gated until verification? (Default recommendation: everything except billing and bulk external email.)
- Domain-based auto-join: auto-assign role immediately, or auto-create a pre-approved join request? (Default: pre-approved request, admin sees it in the audit log.)
