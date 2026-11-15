# Capability map

Each bounded context has a code, the code that implements it, and its capabilities. The **FRD** column links to the spec. `—` means the capability exists in code but has no FRD yet. Write one (as-is) the first time you change it.

Status: **Live** = in code and reachable in the app · **Partial** = in code with known gaps · **Planned** = agreed but not built · **Legacy** = being replaced.

---

## IAM: Identity & Access
Code: `libs/auth` (better-auth, guards, users, roles, permissions, organizations), `apps/web-dashboard/src/app/auth`, `…/onboarding`

| Capability | Status | FRD |
|---|---|---|
| Email/password login, JWT + session | Live | — |
| Magic-link login | Live | — |
| Sign-up with email verification | Live | — |
| Password reset | Live | — |
| Invitations (accept invitation) | Live | — |
| Onboarding: choose path → join school / create school / connect child | Live | — (see `docs/onboarding.md`) |
| Join requests & approval | Live | — |
| Roles & permissions management | Live | — |
| API authentication by default (deny-by-default guard) | Live | — |
| Per-endpoint permission + tenant scoping on all controllers | Partial | — |

## SET: School Setup
Code: `schools`, `periods`, `degrees`, `study-plans`, `subjects`, `class-groups`, `groups-schedules`; `web-dashboard` `/schools`, `/study-plans`, `/degrees`, `/subjects`, `/groups`, `/onboarding/setup`

| Capability | Status | FRD |
|---|---|---|
| Schools (create, edit, branding/theme) | Live | — |
| Academic periods | Live | — |
| Degrees & study plans (incl. enrolment cost) | Live | — |
| Subjects | Live | — |
| Class groups | Live | — |
| Weekly group schedules | Live | — |
| School setup wizard | Live | — |

## PPL: People
Code: `students`, `teachers`, `parents`, `imports`; routes `/students`, `/teachers`, `/parents`, `/imports`, `/verify-student`, `/verify-parent`

| Capability | Status | FRD |
|---|---|---|
| Student records, enrolment code | Live | — |
| Teacher records | Live | — |
| Parent ↔ student linking (multi-school) | Live | — |
| Bulk CSV import (dry run → commit) | Live | — |
| Class-group history per student | Live | — |

## ACA: Academics
Code: `courses`, `assignments`, `assignment-submissions`, `quizzes`, `files`

| Capability | Status | FRD |
|---|---|---|
| Courses (per study plan) | Live | — |
| Assignments & submissions | Live | — |
| Quizzes (questions, schedules, submissions) | Live | — |
| Files & sharing (user / school / group / course) | Live | — |

## ASM: Assessment
Code: `grade-metrics`, `grade-buckets`, `grades`, `student-grades`, `grade-report`, `habit-metrics`, `habit-evaluations`

| Capability | Status | FRD |
|---|---|---|
| Grade metrics & buckets (weighting) | Live | — |
| Grades: create, publish, notify | Live | — |
| Student grades with revision history | Live | — |
| Teacher gradebook | Live | — |
| Grade report per student | Live | — |
| Habit metrics & evaluations | Live | — |
| Unpublished-grades reminder (cron) | Live | — |

## ATT: Attendance
Code: `attendance`; routes `/teacher/attendance`, `/student/attendance`, `/attendance-reporting`

| Capability | Status | FRD |
|---|---|---|
| Attendance sessions & records | Live | — |
| Attendance reporting | Live | — |

## COM: Communication
Code: `communication` (REST + Socket.IO `/communication`), legacy `chats`, `messages`, `newsletters`; plan `.kilo/plans/school-communication-platform-v2.md`

| Capability | Status | FRD |
|---|---|---|
| Teacher ↔ family threads (parents reply-only) | Live | — (COM-001) |
| Broadcasts with approval & optional replies | Live | [COM-002](frd/COM-002-broadcasts.md) |
| Org-admin communication console & audit | Live | — |
| Delivery fan-out (email/push/SMS via Novu) | Partial (stub) | — |
| Recipient preferences / quiet hours | Partial | — |
| Translation | Planned (deferred) | — |
| Emergency voice | Planned (deferred) | — |
| Newsletters | Live | — |
| Chats & messages (pre-v2) | Legacy | — |

## FIN: Finance
Code: `financial`; routes `/financial-module`, `/parent/finances`; plans `student-balance`, `financial-filters-pagination`, `payment-registration-form`

| Capability | Status | FRD |
|---|---|---|
| Charges (incl. auto-generated study-plan charges) | Live | — |
| Payment registration | Live | — |
| Student / child balance | Live | — |

## STO: School Store
Code: `store`; routes `/store`, `/store/:schoolSlug`

| Capability | Status | FRD |
|---|---|---|
| Public catalogue (categories, products, variants) | Live | — |
| Cart & orders | Live | — |
| Store admin (products, order status) | Live | — |

## HOM: Home dashboards
Read-only views that combine data from the other contexts into one home per persona. HOM owns no data of its own.
Code: `home` (planned); `web-dashboard` `/home` → `home.ts`, `teacher-home.ts`, `student-home.ts`, `parent-home.ts`

| Capability | Status | FRD |
|---|---|---|
| Teacher home (my day, pending, week, attention) | Partial (HOM-001 S01–S03 in review; Pendientes rows for habits/quizzes blocked by Q11/Q12) | [HOM-001](frd/HOM-001-persona-home-dashboards.md) |
| Student home (today, work, progress) | Partial (HOM-001 S04–S05 in review; quizzes wait for Q12, habits publishing for Q11) | [HOM-001](frd/HOM-001-persona-home-dashboards.md) |
| Parent home (per-child alerts, progress, account) | Partial (HOM-001 S06–S07 in review) | [HOM-001](frd/HOM-001-persona-home-dashboards.md) |
| School admin home (attention, KPIs, academics, finance, reach) | Partial (legacy home) | [HOM-001](frd/HOM-001-persona-home-dashboards.md) |

## PLT: Platform Administration
Code: `apps/web-admin`, `apps/admin-backend`

| Capability | Status | FRD |
|---|---|---|
| Organizations management | Live | — |
| Global users, roles, permissions | Live | — |
| Global grade/habit metrics, periods, subjects | Live | — |
| Restrict admin API to `SYSADMIN` | Planned | — |
