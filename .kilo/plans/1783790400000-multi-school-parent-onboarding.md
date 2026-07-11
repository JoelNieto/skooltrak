# Multi-School Parent Onboarding System — Implementation Plan

## Context
Skooltrak is an Nx monorepo (NestJS `dashboard-backend` + Angular `web-dashboard` + `libs/auth`) using Prisma + better-auth. Today a `Parent` (and its `User`) is scoped to a **single `Organization`**, and the only parent onboarding path (`verify-parent.ts` → `auth.service.requestJoinSchool` → `handleParentJoin`) requires an admin/teacher to have **pre-created** a `Parent` record, matches by `documentId`, and waits for **admin approval** via `JoinRequest`. The `Parent ↔ Student` link is an implicit M2M (`Parent.students` / `Student.parents`) with **no limit** on parents per student.

We are replacing the parent onboarding with a self-service, **cross-organization (federated)** system: one global `User` (single login) federates into many Organizations via **per-org `Parent` profiles**, unified at the User level. A parent links children using a **per-student, reusable, revocable enrollment code** that **auto-links** (no admin approval), with a hard rule of **max 2 parents per student**. The parent dashboard shows a **unified "My Children"** view across all schools and switches org context per child.

## Resolved Design Decisions
1. **Tenant model:** Cross-Organization (federated). One global `User` → many `Parent` profiles (one per Organization their children attend), unified at login via better-auth `Member` (already supports a User in multiple orgs).
2. **Child linking:** Parent enters a per-student enrollment code → system resolves `Student → School → Organization` → auto-creates/links the per-org `Parent` profile to the `User` (no approval).
3. **Code lifecycle:** Unique code auto-generated at `Student` creation, stored on `Student`, reusable to link up to 2 parents, regenerable/revocable by the school.
4. **Multi-school UX:** Unified "My Children" view aggregating all children across every org the parent belongs to; drilling into a child sets the active org context to that child's school.

## Business Rules (acceptance criteria)
- One parent (global `User`) can have multiple students. ✅ (M2M, multiple `Parent` profiles)
- One student has **maximum 2 linked parents** (enforce in service + documented DB intent).
- One parent can have children across different schools/orgs (federated `Parent` per org).
- Parent identity is a single platform-wide account (`User`).

---

## 1. Data Model Changes (`prisma/schema.prisma`)
- **`Student`**: add
  - `enrollmentCode String @unique` (generate on create; regenerate on demand)
  - `enrollmentCodeGeneratedAt DateTime @default(now())`
  - index `@@index([enrollmentCode])` (implied by unique)
- **`Parent`**: change `userId String? @unique` → keep `userId String?` and add compound unique `@@unique([userId, organizationId])` (null `userId` rows remain allowed/distinct). This enables one `User` to own multiple `Parent` profiles across orgs.
- **`JoinRequest`**: keep for `STUDENT`/`TEACHER`/`ORG_ADMIN` paths; the `PARENT` path is **replaced** by code auto-link (no new JoinRequest for parents). `requestedRole` enum values stay.

Migration notes: dropping the single `parents_userId_key` unique index and adding `parents_userId_organizationId_key`. Existing rows remain valid (one profile per (user,org)). Add `students_enrollmentCode_key`.

## 2. Enrollment Code Generation
- Generate an 8-char human-friendly code (e.g., add `nanoid` dependency, or `crypto.randomBytes` base36). Ensure uniqueness with retry on collision.
- In `StudentsService.create` (apps/dashboard-backend/src/app/students/students.service.ts:22): set `enrollmentCode` in `studentData`.
- Add admin mutation `regenerateEnrollmentCode(studentId)` (and optionally a "revoke" that regenerates) in students service + controller; exposed to school admin/teacher.
- Update `CreateStudentInput`/DTO and entity to include `enrollmentCode`.

## 3. Backend — Parent Link by Code (`libs/auth/src/lib/auth.service.ts`)
Replace `handleParentJoin` usage for `PARENT` with a new method, e.g. `linkChildByCode(userId, input)` where `input = { enrollmentCode, firstName?, relationship?, phone?, email?, documentId?, ...parentDetails }`:
1. Find `Student` by `enrollmentCode` (unique); 404 if missing/expired.
2. Load `student.school.organization`.
3. **Max-2 enforcement:** count `student.parents`; if `>= 2` throw `ConflictException('Este estudiante ya tiene el máximo de 2 padres/tutores')`.
4. **Find-or-create per-org `Parent`** by `(userId, organizationId)`:
   - If exists → reuse; optionally update mutable fields (phone/email/relationship).
   - If not → create `Parent` with provided details + `organizationId` + `userId`.
5. If `student` not already connected to this `Parent` → connect (`parents.connect`); else idempotent "already linked".
6. **Federation:** `member.upsert` for `(organizationId, userId)` (role `'member'`).
7. Assign `PARENT` role to `User` (find global `PARENT` role, `organizationId: null`); set `onboardingStep: 'completed'`. Set `activeOrganizationId` to this org if the user has none.
8. Return `{ status: 'LINKED', organizationId, studentId, schoolId }`.

Update `requestJoinSchool` (auth.service.ts:555) so `requestedRole === 'PARENT'` routes to the new code path (the `verify-parent` documentId+approval path is removed for parents).

## 4. Backend — Self/Parent Endpoints
Add to `parents` module / a new `parent-self` controller (scoped to the authenticated `User`, not org-admin):
- `GET /api/v1/parents/me` → current `User`'s `Parent` profiles + their students, **across all orgs** (unified view). Query all `Parent` where `userId = req.user.id`, include `students` (with `school`, `classGroup`, `organizationId`).
- `POST /api/v1/parents/me/children` → link another child by `enrollmentCode` (calls `linkChildByCode`); supports adding children later from the dashboard.
- `PATCH /api/v1/parents/me` → parent updates their own profile fields.
- Ensure `parents.service.ts` `findAll`/`getCount` (org-scoped admin views) remain unchanged.

## 5. Frontend — Onboarding (`apps/web-dashboard/src/app/onboarding`)
- Replace `verify-parent.ts` (documentId + waiting-approval) with a new **code-based** flow (e.g. `link-child.ts`): parent is already authenticated; enters one or more enrollment codes + optional profile details; calls `POST /api/v1/parents/me/children` (or the auth link endpoint); on success sets `onboardingStep` complete and routes to the parent portal.
- `choose-path.ts` / `select-role.ts`: keep `PARENT` as a role option; remove dependency on the old `verify-parent` waiting-approval step for parents.
- `auth.guard.ts` (onboardingStep handling) already routes `completed` → dashboard; no change needed beyond ensuring parent link sets `completed`.

## 6. Frontend — Parent Portal (`apps/web-dashboard/src/app/parent`)
- `parent-portal.ts`: replace single-org child list with **unified "My Children"** sourced from `GET /api/v1/parents/me` (aggregates across orgs). Show school name per child.
- **Per-child context switch:** when a parent opens a child's progress/grades/messages/finances, set the active org context to that child's `organizationId` (better-auth `setActiveOrganization`, or send `x-organization-id` header / include `organizationId` in downstream queries). Ensure grades/messages queries are scoped to the child's org.
- Add **"Add another child"** action in the portal → reuses the code-link flow (section 5) without leaving the dashboard.
- `parent-child-progress.ts`, `parent-finances.ts`, `parent-teacher-communication.ts`: accept a selected child + its `organizationId` to scope data.

## 7. Validation / Enforcement of Max-2
- Primary: service-level check in `linkChildByCode` (count before connect) inside a transaction.
- Document intent for a future DB `CHECK`/trigger; out of scope for v1 unless trivial.
- Unit test: linking a 3rd parent throws; linking the same parent twice is idempotent; linking across two orgs creates two `Parent` profiles for one `User`.

## 8. Testing & Validation
- Unit tests (`libs/auth` / `dashboard-backend` vitest): code link success, max-2 rejection, cross-org profile creation, idempotent re-link, revoked/regenerated code returns 404, non-existent code 404.
- E2E: parent registers (reuse existing email account), links child in Org A, then links child in Org B; verify two `Parent` rows share `userId`, unified view lists both, per-child org context switches.
- Run project lint/typecheck: `nx run-many --target=lint` and `nx run-many --target=typecheck` (or `build`) for affected projects before completion.

## 9. Risks & Open Questions
- **Multi-org data scoping:** Many existing services resolve `organizationId` from `req.user` (single org). Parent-facing reads (grades, messages, finances) must be explicitly scoped per selected child's org — audit each parent portal feature for hardcoded `req.user.organizationId`.
- **`User.roleId` is singular:** a parent is `PARENT` globally; fine since role is org-agnostic. Confirm no admin UI assumes a parent belongs to exactly one org.
- **Email reuse on signup:** ensure parent signup reuses an existing `User` by email (consistent with student create at students.service.ts:61) so the "single account" holds.
- **Enrollment code security:** auto-link without approval means anyone with the code can link to a student (capped at 2 parents). Mitigation: code is random+unpredictable, regenerable/revocable by school; consider optional expiry later.
- **Migration:** coordinate Prisma migration dropping `parents_userId_key` and adding compound unique + `students.enrollmentCode`; backfill not required (new field nullable-until-create; set on create).

## 10. Out of Scope (v1)
- True cross-org federation UI for admin/teacher roles; global identity broker beyond better-auth `Member`.
- Expiry/one-time consumption of enrollment codes (reusable by design per decision 3).
