# Phase 2 — Shared UX Primitives (Auth/Onboarding)

Execution plan for Phase 2 of `.kilo/plans/1784610603472-auth-flow-improvement-plan.md`.
Requires an implementation-capable agent (source edits + Prisma migrations).

## Goal

Build the reusable primitives the Phase 3 role flows depend on: magic-link auth, QR child-connect tokens, CSV bulk import, class-group history, and profile-only (parent-proxy) students — plus close the residual Phase 1 gaps found during verification.

## Verified starting state

Phase 1 is largely implemented. Confirmed done:

- Random-secret credentials + invitation instead of `bcrypt(documentId)` — `apps/dashboard-backend/src/app/students/students.service.ts:59`, `apps/dashboard-backend/src/app/teachers/teachers.service.ts:37`
- Sliding-window rate limiter + audit on join/link — `libs/auth/src/lib/rate-limiter.ts:14`, `libs/auth/src/lib/auth.service.ts:19,657,812`
- Enrollment code expiry (90d) + rotation — `libs/auth/src/lib/auth.service.ts:16,841`, `students.service.ts:279`
- `available-schools` min 3-char search, projected response — `libs/auth/src/lib/auth-session.controller.ts:241`
- `handleParentJoin` removed; PARENT branch delegates to `linkChildByCode` — `libs/auth/src/lib/auth.service.ts:684,763`
- `OnboardingAuditLog` + `OnboardingAuditAction` — `prisma/schema.prisma:859`, migration `20260723045135_phase1_onboarding_security`
- `InvitationStatus` model + write sites — `prisma/schema.prisma:887`
- ORG_ADMIN permissions resolved at check time — `libs/auth/src/lib/auth.guard.ts:188`, `apps/web-dashboard/src/app/auth/auth.ts:246`

Residual gaps (folded in below as Phase 2.0).

## Decisions (resolved with user)

1. **Phase 1 residual gaps are folded in as Phase 2.0** — done before new features.
2. **New `AuthToken` table** for magic links and QR connect tokens; store only a token *hash*. Leave `Verification` untouched for better-auth invitation/password-reset flows.
3. **CSV import is synchronous**: dry-run + capped commit (500 rows), with a persisted `ImportJob` record for reporting. No queue/worker infra.
4. **`Student.userId` becomes nullable**, and display/search/sort move to Student-owned fields (Student already has `firstName`/`middleName`/`fatherName`/`motherName`). Chats/grade-report skip null-userId students.
5. **QR: API returns a signed redeem URL**; web renders the QR client-side. A server PNG/SVG endpoint exists only for printable welcome letters/report cards.
6. `onboardingStep` stays a `String?` column (no Prisma enum migration); typing is enforced via the existing shared TS constants in `libs/auth/src/lib/onboarding-step.ts` used on both backend and frontend.

---

## Phase 2.0 — Close Phase 1 residuals

1. **Enforce onboarding transitions.** `canTransition`/`assertTransition` (`libs/auth/src/lib/onboarding-step.ts:32,41`) are defined but never called. Route every `onboardingStep` write through a single `OnboardingStateService.transition(userId, next, tx?)` that calls `assertTransition`, persists, and writes an `OnboardingAuditLog` row. Replace the direct writes at `libs/auth/src/lib/auth.service.ts:504,591,745,787,959,1064,1132,1314,1438`, `libs/auth/src/lib/users/users.service.ts:40`, `students.service.ts:83,118`, `teachers.service.ts:61,96`.
2. **Share the step constants with the web app.** Replace raw literals in `apps/web-dashboard/src/app/auth/auth.guard.ts:114,154,162,164,166` with imports from `libs/auth` (`ONBOARDING_STEP`). Verify `libs/auth` is importable from `apps/web-dashboard` (tsconfig path + Nx project tags); if the lib is server-only, extract the constants into a shared lib rather than duplicating them.
3. **Surface invitation status.** Expose `InvitationStatus` on the students/teachers read endpoints and entities (`apps/dashboard-backend/src/app/students/entities/student.entity.ts`, teachers equivalent). Add a status badge + "Resend invitation" action in the web UI wired to the existing `resend-invitation` endpoint (`libs/auth/src/lib/auth-session.controller.ts:229`), flipping status `FAILED → PENDING → SENT/FAILED`.
4. **Tighten the join contract.** In `libs/auth/src/lib/dto/request-join-school.input.ts:10`, split the loose `documentId?`/`enrollmentCode?` pair into a discriminated shape per role (TEACHER/ORG_ADMIN → documentId + schoolId; PARENT → enrollmentCode) with validation. Remove the unused `schoolId`/`schoolName` query params threaded through `apps/web-dashboard/src/app/onboarding/join-school.ts:145` → `select-role.ts:110` → `verify-parent.ts:160,203`; keep them only where actually consumed (`verify-student.ts`, `confirm-request.ts`).
5. **Fail closed on JWT secret.** `libs/auth/src/lib/auth.service.ts:79` falls back to `'fallback-secret'`. Throw on missing `JWT_SECRET` at module init instead.

---

## Phase 2.1 — `AuthToken` primitive (prerequisite for magic link + QR)

6. **Schema.** Add to `prisma/schema.prisma`:
   - `enum AuthTokenType { MAGIC_LINK, CHILD_CONNECT }`
   - `model AuthToken { id, type AuthTokenType, tokenHash String @unique, userId String?, studentId String?, organizationId String?, metadata Json?, expiresAt DateTime, consumedAt DateTime?, consumedByUserId String?, createdById String?, attempts Int @default(0), createdAt, updatedAt }` with indexes on `[type, expiresAt]`, `[userId]`, `[studentId]`, and `@@map("auth_tokens")`. Relations set `onDelete: Cascade` from `User`/`Student`.
   - New `OnboardingAuditAction` values: `MAGIC_LINK_ISSUED`, `MAGIC_LINK_CONSUMED`, `MAGIC_LINK_REJECTED`, `CHILD_CONNECT_ISSUED`, `CHILD_CONNECT_CONSUMED`, `CHILD_CONNECT_REJECTED`, `BULK_IMPORT_COMMITTED`, `CLASS_GROUP_CHANGED`.
7. **Service.** `libs/auth/src/lib/auth-token.service.ts`:
   - `issue({ type, ttlMs, userId?, studentId?, organizationId?, metadata })` → generates `randomBytes(32).toString('base64url')`, persists `sha256(raw)` as `tokenHash`, returns the raw token once.
   - `redeem({ type, rawToken, ip })` → single-use: atomic `updateMany` on `{ tokenHash, consumedAt: null, expiresAt: { gt: now } }` setting `consumedAt`; reject if `count === 0`. Distinguish not-found / expired / already-consumed in audit detail only, never in the client-facing message.
   - `revokeFor({ type, userId?, studentId? })` for rotation.
   - A cleanup routine (cron or on-issue sweep) deleting consumed/expired rows older than 30 days.
8. **Rate limit both surfaces** using the existing `libs/auth/src/lib/rate-limiter.ts` (issue: per user/actor; redeem: per IP). Note in code that the limiter is process-local — document the Redis requirement for multi-instance deploys.

## Phase 2.2 — Magic-link auth (plan task 10)

9. `POST /auth/magic-link/request` — body `{ email }`. Always returns 200 regardless of account existence (no enumeration). If the user exists and is eligible, issue a `MAGIC_LINK` token (TTL 15 min) and email a link via `libs/auth/src/lib/resend.service.ts` (`sendEmail`, new template alongside `sendUserInvitation:94`).
10. `POST /auth/magic-link/verify` — body `{ token }`. Redeems, then issues the normal JWT via `generateJwt` (`auth.service.ts:79`) and creates a `Session` row consistent with `loginWithEmail` (`:529`). Returns the same login payload shape so the web app reuses its post-login handling. Audit issue/consume/reject.
11. **Web route** `apps/web-dashboard/src/app/auth/magic-link.ts` (+ route entry): request form, and a callback route reading `?token=` that calls verify, stores the session, then defers to the existing onboarding-step redirect logic in `auth.guard.ts`.
12. **Invited-user path.** For invited teachers/students, make the invitation email's access link a `MAGIC_LINK` token so no password is ever created; keep `create-invitation-access-link` (`auth-session.controller.ts:96`) working by delegating to the new token service. Users who log in via magic link and have no usable password get an optional "set a password" prompt, not a requirement.

## Phase 2.3 — QR child-connect service (plan task 11)

13. `POST /students/:id/connect-token` (ORG_ADMIN/staff, scoped to the student's org+school) → issues a `CHILD_CONNECT` token (default TTL 30 days, configurable) with `studentId` + `organizationId`, returns `{ token, url }` where url is `${WEB_APP_URL}/onboarding/connect-child?token=...`. Rotating/re-issuing revokes prior unconsumed tokens for that student.
14. `POST /auth/connect-child/redeem` — authenticated PARENT redeems the token: creates/reuses the per-org `Parent` record (`prisma/schema.prisma:570`, `@@unique([userId, organizationId])`), links the student, transitions onboarding to completed via `OnboardingStateService`, and audits. Reuse the link validation logic in `linkChildByCode` (`auth.service.ts:812`) — extract the shared "link parent to student" core so code-based and QR-based paths cannot diverge.
15. **Unauthenticated scan handling.** `/onboarding/connect-child?token=` when not logged in: preserve the token through register/login (query param or short-lived storage) and redeem immediately after auth. Do not redeem before authentication.
16. **Web QR rendering.** Add a QR component in `apps/web-dashboard` using a client-side QR library; show it in the student detail page next to the existing enrollment-code block (`apps/web-dashboard/src/app/students/student.ts:222`) with copy-link + regenerate actions.
17. **Printable output.** Add `GET /students/:id/connect-token.png` (or `.svg`) generating the QR server-side for welcome letters/report cards. This is the only place a QR image lib is needed on the backend.

## Phase 2.4 — CSV bulk import (plan task 12)

18. **Schema.** `model ImportJob { id, organizationId, schoolId, entityType (STUDENT|TEACHER), status (DRY_RUN|COMMITTED|FAILED), createdById, totalRows, createdCount, updatedCount, errorCount, errors Json, createdAt, completedAt? }` + `enum ImportEntityType`, `enum ImportJobStatus`.
19. **Parsing.** Add a CSV parser dependency (papaparse or csv-parse) and a column-mapping/validation layer. Enforce a **500-row cap** and a max upload size. Required columns per entity mirror the create DTOs; unknown columns rejected with a clear error.
20. `POST /imports/dry-run` — parses, validates every row (documentId format, duplicate detection within file, existing-record detection by `documentId + schoolId`, class-group name resolution), returns per-row `{ rowNumber, action: CREATE|UPDATE|SKIP, errors[] }` and persists a `DRY_RUN` `ImportJob`. No writes to Student/Teacher/User.
21. `POST /imports/:jobId/commit` — re-validates, then processes rows idempotently, **one transaction per row** so a single bad row cannot abort the batch. Reuses the Phase 1 secure-credential + invitation logic (`students.service.ts:59,185`, `teachers.service.ts:37,121`) per row. Records counts + per-row errors on the job, writes a `BULK_IMPORT_COMMITTED` audit row. Commit is rejected if the job is already committed.
22. **Web wizard** (`apps/web-dashboard/src/app/admin/pages/import/*`): upload → column mapping → dry-run preview table with per-row errors → commit → results summary with downloadable error CSV. Provide a downloadable template CSV.

## Phase 2.5 — Class-group progression history (plan task 13)

23. **Schema.** `model StudentClassGroupHistory { id, studentId, classGroupId, schoolId, organizationId, startedAt, endedAt?, reason String?, createdById?, createdAt }` with indexes `[studentId, startedAt]` and `[classGroupId]`. `Student.classGroupId` (`prisma/schema.prisma:519`) remains the "current" pointer.
24. **Backfill migration.** For every student with a non-null `classGroupId`, insert one open history row (`startedAt` = `student.createdAt`, `reason = 'backfill'`).
25. **Write path.** Centralize class-group assignment in a single method (`students.service.ts` update path + any class-group bulk assignment in `class-groups.service.ts`): close the open row (`endedAt = now`), open a new one, update the FK — all in one transaction. Audit `CLASS_GROUP_CHANGED`. Ensure the CSV import (task 21) uses this method rather than writing `classGroupId` directly.
26. **Read path.** Expose the history on the student detail API/UI as a timeline. Invariant to test: at most one open (`endedAt: null`) row per student.

## Phase 2.6 — Nullable `Student.userId` / parent-proxy (plan task 14)

27. **Schema.** `Student.userId String? @unique`, `user User?` (`prisma/schema.prisma:532`). Aligns with the already-nullable `Teacher.userId` (`:594`) and `Parent.userId` (`:564`). Add `Student.lastName String?` only if the existing `fatherName`/`motherName` fields are insufficient for display; otherwise add a computed display-name helper over the existing Student fields.
28. **Move search/sort off the user relation.** `students.service.ts:305-308,327-330` (search filters on `user.*`) and `:346` (`orderBy: { user: { firstName } }`) must use Student-owned fields so profile-only students appear correctly. Keep `email` search as an optional `user` relation filter (`OR` with a null-safe branch).
29. **Null-guard every consumer** found in verification:
   - `apps/dashboard-backend/src/app/grade-report/grade-report.service.ts:55`
   - `apps/dashboard-backend/src/app/chats/chat-sync.service.ts:105,109` and `chats.service.ts:143-195` — skip students with null `userId` when building participants (a pre-schooler has no chat identity; the parent does).
   - `students.service.ts:167` (create no longer requires `userId`), `:180,310,338,345,493`, `:498-505`
   - `apps/dashboard-backend/src/app/parents/parents.service.ts:45`, `class-groups.service.ts:117`
   - `apps/web-dashboard/src/app/groups/group-students.ts:6`, `group-habits.ts:8`
   - Entities: `apps/dashboard-backend/src/app/students/entities/student.entity.ts`, `libs/auth/src/lib/users/entities/student.entity.ts:14`
30. **Create path.** Add a "profile-only student (no login)" option to student creation and to CSV import (blank email ⇒ no `User`/`Account`, no invitation, no credential). Guard: profile-only students must have at least one linked parent before they are considered fully set up (warn, don't block).
31. **Attach-user upgrade helper.** `attachUserToStudent(studentId, { email, ... })` that creates the `User` + `Account`, sets `Student.userId`, issues a magic link, and preserves all history/grades/attendance. This is the seam Phase 3 task 29 builds on; implement the service method now even if the UI lands in Phase 3.

---

## Suggested ordering

2.0 → 2.1 → (2.2 ‖ 2.3) → 2.5 → 2.6 → 2.4

Rationale: 2.1 unblocks both token features; 2.5 and 2.6 must land before the CSV importer so the importer writes history rows and can create profile-only students without a follow-up rewrite.

## Migrations

Add these as separate, individually reversible migrations under `prisma/migrations/` (flat `<timestamp>_<name>` layout; there are no `db:migrate` package scripts — Prisma is run ad hoc):

1. `phase2_auth_token` — `AuthToken` + `AuthTokenType` + new `OnboardingAuditAction` values
2. `phase2_import_job` — `ImportJob` + enums
3. `phase2_student_class_group_history` — table + backfill of open rows
4. `phase2_student_user_optional` — `Student.userId` nullable (+ optional display field)

Avoid the duplicate-migration mistakes already present in the repo (e.g. `20260711130000_` vs `20260711180039_multi_school_parent_onboarding`): one directory per change, verify `prisma migrate status` is clean before and after.

## Validation

- **Magic link:** logs in exactly once; second redeem of the same token fails; expired token fails; unknown email returns 200 with no email sent and no enumeration signal; rate limit trips and audits.
- **QR:** redeem links the parent to the intended child only; cross-org redeem is rejected; regenerate invalidates the previous token; unauthenticated scan survives register/login then redeems; PNG endpoint enforces the same authorization as the issue endpoint.
- **Bulk import:** a sample CSV dry-run reports per-row errors without writing; commit creates N students with random credentials + invitations; re-running the same file produces UPDATE/SKIP rows, not duplicates; one invalid row does not abort the batch; >500 rows is rejected.
- **Class-group history:** every assignment change writes exactly one closed + one open row; no student ever has two open rows; backfill produced one row per currently-assigned student.
- **Profile-only student:** creatable with `userId = null`; appears in student lists, search, and sorted views; group/chat/grade-report pages do not throw; `attachUserToStudent` upgrades without losing history.
- **Phase 2.0:** an illegal onboarding transition is rejected and audited; web guard behavior unchanged after switching to shared constants; a forced Resend failure shows a FAILED badge and retry succeeds; app refuses to boot without `JWT_SECRET`.
- **Regression:** all Phase 1 checks still pass (no document-ID login, rate limits, scoped `available-schools`, expired enrollment codes rejected).

## Risks

- Nullable `Student.userId` touches chats, grade reports, group views, and student search — task 29's list is the minimum audit scope; re-grep for `student.userId`, `students: { include: { user` and `orderBy: { user` after the schema change.
- Enforcing `assertTransition` retroactively may reject transitions that currently happen in production data order; log-only for one deploy (warn instead of throw) before failing hard, and confirm `ALLOWED_TRANSITIONS` (`onboarding-step.ts:19`) covers every observed path.
- Magic links and QR tokens are bearer credentials: hash at rest, single-use via atomic conditional update, short TTL for magic links, and never leak redeem-failure reasons to clients.
- The rate limiter is process-local; magic-link and QR redeem are now brute-forceable across instances in a scaled deployment. Track the Redis-backed limiter as a follow-up.
- Adding a self-service magic-link request endpoint is a new unauthenticated surface — it must be rate-limited by IP *and* email.

## Out of scope for Phase 2

- Role-specific flow redesign (Phase 3 tasks 15–31), including the "View as Child" parent mode and cross-org parent dashboard.
- Redis-backed distributed rate limiting.
- Async/queued import processing for files larger than the 500-row cap.
- Updating `docs/onboarding.md` (separate deliverable, but should be refreshed as these flows land).
