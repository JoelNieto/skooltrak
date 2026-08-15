# Phase 2 Completion — Remaining Work (Auth/Onboarding Shared UX Primitives)

Follow-up to `.kilo/plans/1784955958110-auth-phase2-shared-ux-primitives.md` (items numbered 1–31 there).
This plan contains **only the pending work**, verified against the codebase at commit `1a441c8`.

Landed so far: commits `8a4fe6a`, `888063c`, `bc0cbbf`, `cb44698`, `976c0df`, `31ddd77`, `1a441c8` +
migration `prisma/migrations/20260725051932_phase2_shared_ux`.

Audit result: **10 of 31 items DONE, 17 PARTIAL, 4 NOT DONE**, plus 8 defects introduced by the
partial implementations. Zero automated test coverage for any Phase 2 feature.

**Progress: Track A is complete** (A1–A8 fixed and manually verified, plus a ninth defect A9 found
during verification). Track B/C/D remain.

## Status markers

- `[x]` done — verified in code
- `[~]` partial — some of the item shipped; the sub-bullets list what is missing
- `[ ]` pending — not implemented
- `[!]` defect — shipped code is broken or insecure; fix before extending

---

## Track A — `[x]` Defects in shipped Phase 2 code (COMPLETE)

All items verified against a running backend on 2026-08-15 (PostgreSQL 14.19, dev DB).
Test artifacts were cleaned up afterwards.

- [x] **A1. Bulk import endpoints were unreachable.** `@Controller('api/v1/imports')` sat under the
  global `api` prefix, resolving to `/api/api/v1/imports`. Now `v1/imports`
  (`apps/dashboard-backend/src/app/imports/imports.controller.ts:8`).
  Verified: `POST /api/v1/imports/dry-run` → 401 (guarded, reachable); `/api/api/v1/...` → 404.
- [x] **A2. Privilege escalation on QR issue.** `POST /v1/auth/child-connect/issue` was guarded only
  by `BetterAuthGuard`. Now `PermissionsGuard` + `@RequirePermissions(Perm.MANAGE_STUDENTS)`
  (`libs/auth/src/lib/auth-session.controller.ts:299-312`), and `issueChildConnectToken` throws
  `NotFoundException`/`ForbiddenException` instead of bare `Error`
  (`libs/auth/src/lib/auth.service.ts:1686-1712`).
  Verified: PARENT → 403, TEACHER → 403, ORG_ADMIN → token + URL.
  **Deferred to B22:** actor-level *school* scoping is not implementable today — the data model has
  no user-to-school membership (`Member` is organization-scoped only, `prisma/schema.prisma:1107`).
  Documented in the method's doc comment.
- [x] **A3. `request.user.id` vs `request.user.userId`.** `requestActor()` now reads `userId` via the
  shared `AuthUserContext` type, and the second ad-hoc reader was collapsed into it
  (`apps/dashboard-backend/src/app/students/students.service.ts:33-41,545`). `getConnectTokenQrPng`
  also returns `UnauthorizedException` rather than `NotFoundException`.
  Verified: `GET /v1/students/:id/connect-token.png` → 200, `image/png`, 3210 bytes (previously
  always threw).
- [x] **A4. Dry-run existing-record detection.** Student lookups now use the school-scoped key that
  `dryRun` builds, teachers stay org-scoped, and an existing record yields `action: 'UPDATE'` with no
  error instead of a false failure (`imports.service.ts:110-135,152-173`). `ImportJob` now records
  `createdCount`/`updatedCount` separately (`:213-246`). Both commit paths were reordered to resolve
  the existing student/teacher **first**, so a repeat import updates in place and never mints a
  second user or credential (`:346-392`, `:498-528`).
  Verified: existing doc → UPDATE, new → CREATE, invalid → SKIP; commit updated in place (1 row, no
  duplicate, no new user), created the new student, re-commit → 409, >500 rows → 400.
- [x] **A5. `StudentClassGroupHistory` FK defect.** `classGroupId` is now nullable so the SET NULL FK
  cannot violate NOT NULL and history survives class-group deletion
  (`prisma/schema.prisma:929-936`), with corrective migration
  `prisma/migrations/20260815223000_phase2_history_classgroup_nullable/`. Applied;
  `prisma migrate status` is clean.
- [x] **A6. PostgreSQL enum-migration risk — not applicable.** Target is PostgreSQL 14.19, and
  `ALTER TYPE ... ADD VALUE` inside a transaction is supported from PG 12. No split needed.
- [x] **A7. `grade-report` null-`userId` check failed open.** Now denies when `student.userId` is
  null, so no STUDENT-role user can claim a profile-only student's report
  (`apps/dashboard-backend/src/app/grade-report/grade-report.service.ts:53-59`).
- [x] **A8. Magic-link login creates a real better-auth session.** better-auth's official
  `magicLink` plugin is registered purely as the session-creation mechanism — issuance stays with
  `AuthTokenService` and its built-in `sendMagicLink` is inert
  (`libs/auth/src/lib/better-auth.ts:125-144`). `verifyMagicLink` now redeems our own token, then
  drives the plugin's verify endpoint through the typed `verifyMagicLinkInternally` accessor
  (`better-auth.ts:196-212`) using a server-side-only 30-second verification row, forwarding
  `set-cookie`; failures degrade to JWT-only instead of breaking login
  (`libs/auth/src/lib/auth.service.ts:1646-1740`). The controller passes the cookie through
  (`auth-session.controller.ts:292-306`) and the web callback sends `withCredentials`
  (`apps/web-dashboard/src/app/auth/magic-link-callback.ts:55-63`).
  Verified: 201 + `accessToken`, one signed `better-auth.session_token` cookie, exactly 1 new
  `Session` row, `GET /api/auth/get-session` authenticates with that cookie, replay → 401, no
  leftover verification rows, audit `MAGIC_LINK_CONSUMED` then `MAGIC_LINK_REJECTED`.
- [x] **A9. (new) The CSV importer could never create anyone.** Discovered once A1 made the route
  reachable: rows were validated against `MASCULINO/FEMENINO/OTRO` while the Prisma `Gender` enum is
  `MALE | FEMALE` only (`prisma/schema.prisma:1161`), so every student/teacher CREATE failed at
  insert time — and, absent a per-row transaction, left an orphan `User` + `Account` behind. Gender is
  now normalized (both Spanish and English spellings accepted) at validation time and re-normalized
  at commit time (`imports.service.ts:26-46,121-135,161-173,631-641`). Client-facing failures also
  use proper HTTP exceptions instead of bare `Error` (400 for parse/row-cap, 404/409 for job state,
  401 in the controller), so the API no longer answers 500 for user input.
  Verified: created student stored `gender = MALE`.

**Not fixed here (already tracked):** the orphan-user window that A9 exposed is the missing per-row
transaction, item **B14**.

---

## Track B — `[~]`/`[ ]` Remaining feature work, by original section

### Phase 2.0 residuals — all five items are still partial

- [~] **B1 (item 1). Centralize onboarding transitions + audit.**
  - Done: `AuthService.transitionOnboardingStep(userId, next, tx?)`
    (`libs/auth/src/lib/auth.service.ts:76-91`) calls `assertTransition` and is used by 8 call sites
    (`:673,814,845,1091,1200,1301,1438,1565`).
  - Missing: it is **private to `AuthService`**, so no other service can use it — extract it into an
    injectable `OnboardingStateService` in `libs/auth`.
  - Missing: it writes **no `OnboardingAuditLog` row** (the `audit()` helper at `:51-69` is never
    called from it).
  - Missing: 9 direct `onboardingStep:` writes still bypass the state machine —
    `auth.service.ts:550`, `libs/auth/src/lib/users/users.service.ts:40`,
    `students.service.ts:102,137,662`, `teachers.service.ts:61,96`,
    `imports.service.ts:320,457`. The two `user.update` sites
    (`students.service.ts:102`, `teachers.service.ts:61`) are genuine state-machine bypasses; the
    `user.create` sites need an explicit "initial state" entry point.
  - Per the original risk note: land `assertTransition` in **warn-only** mode for one deploy before
    throwing.
- [~] **B2 (item 2). Share the step constants properly.**
  - Done: `apps/web-dashboard/src/app/auth/auth.guard.ts:4,115,155,163,165,167` uses typed constants
    (no raw literals left).
  - Missing: `apps/web-dashboard/src/app/auth/onboarding-step.ts:1-15` is a hand-maintained
    duplicate ("keep the two in sync") of `libs/auth/src/lib/onboarding-step.ts` — exactly what the
    plan forbade. Extract into a browser-safe shared lib and delete the mirror.
- [~] **B3 (item 3). Surface `InvitationStatus` on reads + badge.**
  - Done: "Reenviar invitación" actions exist
    (`apps/web-dashboard/src/app/students/students.ts:160-170,264-278`,
    `teachers.ts:132-142,220-232`) hitting `/api/v1/auth/resend-invitation`
    (`libs/auth/src/lib/auth-session.controller.ts:229`).
  - Missing: `invitationStatus` is **write-only** in the backend
    (`auth.service.ts:99`, `students.service.ts:217,233`, `teachers.service.ts:128,144`,
    `imports.service.ts:570-575`); it is on no read include and no entity
    (`apps/dashboard-backend/src/app/students/entities/student.entity.ts:26-79`,
    `.../teachers/entities/teacher.entity.ts:7-11`).
  - Missing: no status badge in the UI (the only badge is `enrollmentStatus`,
    `students.ts:100-102`); the resend button is gated on `!user.emailVerified`, not on
    `InvitationStatus`. Wire the `FAILED → PENDING → SENT/FAILED` badge once the field is exposed.
- [~] **B4 (item 4). Tighten the join contract.**
  - Done: `schoolId` is conditionally required
    (`libs/auth/src/lib/dto/request-join-school.input.ts:11-14`).
  - Missing: `documentId?` (`:19-20`) and `enrollmentCode?` (`:22-23`) are still bare
    `@IsOptional()` strings with no per-role discrimination and no `@IsString`; enforcement lives in
    the service (`auth.service.ts:685-697`).
  - Missing: dead `schoolId`/`schoolName` query params still threaded through
    `apps/web-dashboard/src/app/onboarding/join-school.ts:147-150` →
    `select-role.ts:83-84,118-119,131,134,138` → `verify-parent.ts:149-150,165-166,206`
    (the POST body at `:178-189` uses only `enrollmentCode`). Keep them in
    `verify-student.ts:112-115,130` and `confirm-request.ts:87-91,101`.
- [~] **B5 (item 5). Fail closed on `JWT_SECRET`.**
  - Done: the `'fallback-secret'` literal is gone; `auth.service.ts:137-141` throws.
  - Missing: it throws **lazily on first `generateJwt()`**, not at module init
    (`libs/auth/src/lib/auth.module.ts:13-36` has no validation).
  - Missing: silent empty-string fallbacks remain at `libs/auth/src/lib/jwt.strategy.ts:18`
    (`?? ''`), `libs/auth/src/lib/auth.guard.ts:125` (`|| ''`), and
    `apps/dashboard-backend/src/app/chats/chat-ws-auth.service.ts:38` (`|| ''`). The app must refuse
    to boot without `JWT_SECRET`.

### Phase 2.1 — `AuthToken`

- [x] item 6 — schema + 8 new `OnboardingAuditAction` values (`prisma/schema.prisma:888-891,878-885,904-927`)
- [~] **B6 (item 7). Token lifecycle gaps.**
  - Done: `issue()` (`libs/auth/src/lib/auth-token.service.ts:31-47`), atomic single-use `redeem()`
    (`:54-90`), `revokeFor()` (`:93-106`).
  - Missing: `purge(olderThanDays = 30)` (`:114-122`) has **zero callers** and no `@Cron` — dead
    code. Schedule it (`ScheduleModule` is already configured,
    `apps/dashboard-backend/src/app/app.module.ts:44`; see
    `chats/chat-retention.service.ts:18` for the pattern).
  - Missing: `attempts` only increments on **success** (`:62-74`), so failed brute-force attempts are
    never counted; and the audit detail is a generic `'invalid/expired/used'`
    (`auth.service.ts:1662,1749`) instead of distinguishing not-found / expired / already-consumed
    in the audit row (client message stays opaque).
- [~] **B7 (item 8). Rate-limit coverage.**
  - Done: magic-link issue keyed on IP+email (`auth.service.ts:1607`), magic-link redeem per IP
    (`:1652`), child-connect redeem per IP (`:1739`).
  - Missing: **`issueChildConnectToken` is not rate-limited at all**
    (`auth.service.ts:1686-1722` — no `hitRateLimit` call).
  - Missing: a single shared 10-per-15-min bucket is used for every surface
    (`auth-token.service.ts:7-8`); split issue vs redeem thresholds.

### Phase 2.2 — Magic link

- [x] items 9, 11 (request endpoint + web request/callback routes)
- [!] item 10 → **A8** above
- [ ] **B8 (item 12). Invited-user passwordless path.**
  - `create-invitation-access-link` (`auth-session.controller.ts:96-101`,
    `auth.service.ts:319-380`) still writes `Verification` rows and returns a
    `${APP_URL}/reset-password?token=...&email=...` URL — it does not delegate to
    `AuthTokenService`.
  - Invitation emails still ship a 24h password-reset link
    (`libs/auth/src/lib/resend.service.ts:110-137`, consumed by `sendWelcomeEmail:35-88`); same for
    `resendUserInvitation` (`auth.service.ts:419-427`).
  - No optional "set a password" prompt: no `set-password` route/component in
    `apps/web-dashboard/src/app/**`, and no `hasPassword` flag on the `me` payload.
  - Reference implementation to follow: `students.service.ts:683-689` already issues a magic link on
    user attach.

### Phase 2.3 — QR child-connect

- [x] items 14, 17 (shared `linkParentToStudent` core at `auth.service.ts:951-1108`, used by both
  `linkChildByCode:917` and `redeemChildConnectToken:1769`; PNG endpoint at
  `students.controller.ts:91-100`)
- [!] item 13 authorization/scoping → **A2** above
- [~] **B9 (item 13 remainder). Route shape + TTL config.** The endpoint is
  `POST /v1/auth/child-connect/issue` with body `{ studentId }`
  (`auth-session.controller.ts:299-309`), not the planned `POST /students/:id/connect-token`;
  decide whether to keep the auth-scoped route or add the students-scoped one for consistency with
  `students.controller.ts:91`. TTL is hardcoded at 30 days (`auth.service.ts:1704`) — make it
  configurable as the plan specified.
  - Also note: `GET /students/:id/connect-token.png` calls `issueChildConnectToken`, which
    `revokeFor`s prior tokens (`auth.service.ts:1700`) — **every PNG fetch invalidates the QR
    already printed or shown on screen**. Add a "reuse if unconsumed and not near expiry" path.
- [~] **B10 (item 15). Register path never redeems a pending scan.**
  - Done: token is preserved in `localStorage` and never redeemed pre-auth
    (`apps/web-dashboard/src/app/auth/connect-child.ts:56-85`); redeem-after-auth wired for password
    login (`auth.ts:225`, impl `:398-422`) and magic link (`magic-link-callback.ts:61`).
  - Missing: `apps/web-dashboard/src/app/auth/register.ts:561-584` sets the token and navigates to
    `/onboarding` **without** calling `redeemPendingChildConnect()`, and `connect-child.ts` only ever
    redirects to `/login`. A parent who scans then registers is not linked.
- [~] **B11 (item 16). Extract the QR renderer into a component.** Working QR exists but is inline
  in `apps/web-dashboard/src/app/students/student.ts:9,231-282,521-556` (uses `qrcode`,
  `package.json:76`). Extract a reusable component so parent/report/print surfaces can use it.

### Phase 2.4 — CSV bulk import

- [x] item 18 (`ImportJob` + enums, `prisma/schema.prisma:893-902,950-969`)
- [!] items 20/21 correctness → **A1**, **A4** above
- [~] **B12 (item 19). Parsing hardening.**
  - Done: `papaparse` (`package.json:72`), 500-row cap (`imports.service.ts:24,68-70`).
  - Missing: **no max upload size** — `main.ts:13-14` creates the app with `bodyParser: false` and no
    `express.json({ limit })` is ever registered.
  - Missing: unknown columns are silently carried into `data` (`imports.service.ts:102,132`) instead
    of being rejected.
  - Missing: no column-mapping layer — header names are hardcoded (`:26-48`) with no mapping input in
    the DTO/controller (`imports.controller.ts:16-22`).
- [~] **B13 (item 20). Dry-run validation depth.**
  - Missing: `documentId` **format** validation (only emptiness is checked, `:84-90`).
  - Missing: **in-file duplicate detection** — the duplicate set is built solely from DB rows
    (`:153-159`); no per-file seen-set.
  - Missing: class-group name resolution is not validated at dry-run; it is silently nulled at commit
    (`:353-357,379`), so the preview lies about the outcome.
- [~] **B14 (item 21). Commit semantics.**
  - Missing: **no re-validation** — commit replays the stored dry-run `errors` JSON (`:218-219`).
  - Missing: **no per-row transaction** — `commitStudentRow` (`:284-414`) and `commitTeacherRow`
    (`:416-525`) are unwrapped sequential awaits (`user.create`, `account.create`, `student.create`,
    history write, invitation); a mid-row failure leaves partial data. Only a per-row `try/catch`
    exists (`:227-245`).
  - Missing: reuse of `StudentsService`/`TeachersService` — the credential/enrollment-code logic is a
    second copy (`imports.service.ts:547-549,556-567`); only `sendUserInvitation` is shared (`:399`).
    Collapse onto the service methods so Phase 1 security logic cannot drift.
- [~] **B15 (item 22). Wizard gaps.** Upload, preview, commit, results, and error-CSV download exist
  (`apps/web-dashboard/src/app/admin/pages/imports.ts:33-136,209-229`; route
  `dashboard.routes.ts:436-441`). Missing: the **column-mapping step**, the **downloadable template
  CSV** (currently only placeholder text in the textarea, `:49`), and any client-side size/row
  pre-check.

### Phase 2.5 — Class-group progression history

- [x] items 23, 24 (model `prisma/schema.prisma:929-948`; backfill `migration.sql:136-140`) —
  but see **A5** for the FK defect
- [ ] **B16 (item 25). Centralize class-group assignment.**
  - Two independent implementations: `students.service.ts:550-582` `recordClassGroupChange`
    (private; called from create `:203-205` and update `:537-540`) and
    `imports.service.ts:586-607` `recordImportedClassGroup` (called at `:386-394`).
  - Neither is transactional: the `updateMany` (close) + `create` (open) are separate statements, and
    the `Student.classGroupId` FK write happens in a different statement again
    (`students.service.ts:190,481,516-520`, `imports.service.ts:379`).
  - **`CLASS_GROUP_CHANGED` is never written** — the enum value exists
    (`prisma/schema.prisma:885`) with zero usages anywhere.
  - `class-groups.service.ts` has no bulk-assignment method today (file is CRUD only), so add the
    shared method and route both existing callers — and any future bulk assignment — through it.
- [ ] **B17 (item 26). Expose the history.** `students.service.ts:437-463` `findOne` does not include
  `classGroupHistory`; there is no history route in `students.controller.ts:35-136`; there are zero
  `studentClassGroupHistory` **reads** in the codebase and zero references in
  `apps/web-dashboard/src`. Add the API include/route plus the timeline UI on the student detail
  page, and assert the invariant "at most one open (`endedAt: null`) row per student".

### Phase 2.6 — Nullable `Student.userId` / parent-proxy

- [x] items 27, 31 (`prisma/schema.prisma:539-540`; `attachUser` at
  `students.service.ts:611-692` + `POST v1/students/:id/attach-user`,
  `students.controller.ts:102-110`)
- [ ] **B18 (item 28). Move search/sort off the `user` relation.** This is the item that makes 2.6
  actually usable, and none of it shipped:
  - `students.service.ts:327-343` `findAll` filters on `user.firstName/lastName/email`
    (`:330-334`) → profile-only students are absent from **every** search.
  - `getCount` repeats the same filter (`:352-356`).
  - `findManyByCourseId` orders by `{ user: { firstName: 'asc' } }` (`:372`).
  - Correct pattern already in use for reference: `class-groups.service.ts:118`
    (`orderBy: { firstName: 'asc' }`). Keep `email` as an optional null-safe `user` relation branch.
- [~] **B19 (item 29). Finish null-guarding.**
  - Guarded: `chats/chat-sync.service.ts:103`, `chats/chats.service.ts:151,175,197`,
    `parents/parents.service.ts:45,79,132` (by omission), `class-groups.service.ts:116-119`,
    `apps/web-dashboard/src/app/groups/group-students.ts:30`, `groups/group-habits.ts:121`,
    `students.controller.ts:19-20`, `students.service.ts:524,527`.
  - Missing: **entity types still lie** —
    `apps/dashboard-backend/src/app/students/entities/student.entity.ts:71-72`
    (`user: User; userId: string;`) and `libs/auth/src/lib/users/entities/student.entity.ts:31`
    (`userId: string;`) must become nullable, which will surface the remaining unguarded consumers at
    compile time.
  - Missing: the create path dereferences `user.id` unguarded at `students.service.ts:253,256`
    (only survives because of the surrounding `try/catch` at `:258`).
  - Missing: `grade-report.service.ts:55` → see **A7**.
- [~] **B20 (item 30). Profile-only students end to end.**
  - Done: backend create supports it (`students.service.ts:80-151,187,208`; optional email in
    `dto/create-student.input.ts:37`).
  - Missing: **CSV import fabricates accounts** — blank email becomes
    `` `imported-${documentId}@placeholder.local` `` with a real `User` + credential `Account`
    (`imports.service.ts:309-333,314`; teachers `:451`). Must create profile-only students instead.
  - Missing: the web form **requires** email (`students/student-form.ts:461-462,515`); no
    "sin acceso / profile-only" toggle exists anywhere in `apps/web-dashboard/src`.
  - Missing: the "profile-only student has no linked parent" warning (nothing in
    `students.service.ts` create, nothing in the UI).
- [~] **B21 (item 31 remainder).** `attachUser` writes **no audit-log row** and has **no UI entry
  point** (zero `attach-user` references in `apps/web-dashboard/src`). The UI can stay in Phase 3,
  but add the audit row now.
- [ ] **B22 (from A2). School-level authorization is not expressible.** Staff authorization can only
  be scoped to an organization today: `Member` (`prisma/schema.prisma:1107-1119`) has no `schoolId`,
  and neither `Teacher` nor `User` carries a school link, so `AuthUserContext`
  (`libs/auth/src/lib/auth.guard.ts:18-23`) cannot expose one. Every "scoped to the student's
  org+school" requirement in Phase 2/3 therefore degrades to org-only. Decide on a user↔school
  membership model (extend `Member` with a nullable `schoolId`, or add a join table), surface it on
  `AuthUserContext`, then tighten `issueChildConnectToken` and the students/teachers read paths.

---

## Track C — Migrations

- [ ] **C1. Corrective migration for A5** — done as
  `20260815223000_phase2_history_classgroup_nullable`, applied locally. Still needs to run on every
  other environment.
- [x] **C2. A6 resolved.** Target is PostgreSQL 14.19; multi-value `ALTER TYPE ... ADD VALUE` in a
  transaction is supported (PG ≥ 12). No split required.
- [~] **C3. The 4 planned migrations shipped as 1.** `20260725051932_phase2_shared_ux` bundles
  `phase2_auth_token`, `phase2_import_job`, `phase2_student_class_group_history`, and
  `phase2_student_user_optional` (including the `students.userId` DROP NOT NULL at
  `migration.sql:31`), so none is individually reversible. Accept as-is (it is already applied) and
  enforce one-directory-per-change going forward. `prisma migrate status` is currently clean
  (86 migrations, database up to date).

---

## Track D — Validation / tests (nothing shipped)

No spec file references magic-link, child-connect, imports, or class-group history;
`libs/auth/src/lib/auth.service.spec.ts` only mocks `AuthTokenService`. All original Phase 2
validation criteria are unverified.

- [ ] **D1. Magic link:** single successful login; second redeem of the same token fails; expired
  token fails; unknown email returns 200 with no email sent; rate limit trips and audits.
- [ ] **D2. QR:** links only the intended child; cross-org redeem rejected; regenerate invalidates
  the previous token; unauthenticated scan survives **both** login and register (B10); PNG endpoint
  and issue endpoint enforce identical authorization (A2).
- [ ] **D3. Bulk import:** dry-run reports per-row errors with no writes; commit creates N students
  with random credentials + invitations; re-running the same file yields UPDATE/SKIP (A4); one
  invalid row does not abort the batch; >500 rows rejected; oversized upload rejected (B12).
- [ ] **D4. Class-group history:** each change writes exactly one closed + one open row; no student
  ever has two open rows; deleting a class group does not error (A5).
- [ ] **D5. Profile-only student:** creatable with `userId = null`; **appears in student lists,
  search, and sorted views** (B18); group/chat/grade-report pages do not throw; grade report is not
  readable by unrelated students (A7); `attachUser` upgrades without losing history.
- [ ] **D6. Phase 2.0:** illegal transition rejected and audited; web guard behavior unchanged after
  removing the duplicated constants; forced Resend failure shows a FAILED badge and retry succeeds;
  app refuses to boot without `JWT_SECRET`.
- [ ] **D7. Regression:** no document-ID login; rate limits hold; `available-schools` scoped;
  expired enrollment codes rejected.

---

## Suggested ordering

~~`Track A (A1–A8)`~~ (done, plus A9) → `B18 + B19 + A7` (make 2.6 real) → `B1 + B5` (state machine +
fail-closed) → `B16 + B17` (history centralization/exposure) → `B12–B15` (importer hardening, depends
on B16/B20) → `B6 + B7` (token lifecycle/limits) → `B8 + B10 + B11` (magic-link invitations, register
redeem, QR component) → `B2 + B3 + B4 + B9 + B21` (cleanup) → `B22` (needs a schema decision) →
`Track D` alongside each.

Next up: **B18 + B19**. A7 is already done; B18/B19 are the difference between "the column is
nullable" and "profile-only students work", and the importer (B12–B15) should not be hardened until
the class-group and profile-only write paths it must call are centralized.

## Toolchain note

The Prisma CLI cannot run on Node 20.9 in this repo (`ERR_REQUIRE_ESM` from
`@prisma/dev` → `zeptomatch`). Use Node 22 for any Prisma command, e.g.
`PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" npx prisma migrate status`.
Also note `dashboard-backend:test` has 18 pre-existing failing suites (specs do not provide
`PrismaService`), unrelated to Phase 2 — do not read them as regressions.

## Out of scope (unchanged from Phase 2)

- Phase 3 role-flow redesign (original items 15–31 of the parent plan), "View as Child", cross-org
  parent dashboard.
- Redis-backed distributed rate limiting (the limiter remains process-local,
  `libs/auth/src/lib/rate-limiter.ts:1-7`).
- Async/queued imports beyond the 500-row cap.
- Refreshing `docs/onboarding.md`.
