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
| Course experience: colored course cards with progress, course page with assignments/grades/participants | Shipped (color and icon S01, roster S11, students' *Mis cursos* cards with schedule, teacher and period average S02, next delivery, progress and stats row S03, subject areas and filter chips S04, the same view for parents per child S05, course page header, Resumen and Asignaciones with access limited to the course's people S06, Calificaciones with category bars S07, Participantes S08, teachers set color, icon or cover photo S09, admins add and remove students on a course S12, the homeroom teacher's read-only Cursos de {grupo} S13, staff cards with area chip and course name S14; course channels on the course page S15, unread badges on Mis cursos S16, "Preguntar en el curso" S17, channels read and written inside the course S18–S19, "por responder" S20, assignment Q&A channels in the course S21) | [ACA-001](frd/ACA-001-course-experience.md) |
| Assignments & submissions | Live (work reads *Calificada · n* / *Exenta* once its linked grade is published, ACA-001-S10) | — |
| Quizzes (questions, schedules, submissions) | Live | — |
| Files & sharing (user / school / group / course) | Live | — |

## ASM: Assessment
Code: `grade-metrics`, `grade-buckets`, `grades`, `student-grades`, `grade-report`, `habit-metrics`, `habit-evaluations`

| Capability | Status | FRD |
|---|---|---|
| Grade metrics & buckets (weighting) | Live | — |
| Grades: create, publish, notify | Live | — |
| Student grades with revision history | Live | — |
| Teacher gradebook | Live (gradebook grid on the course tab and `/teacher/gradebook` (ASM-001-S02); scores are typed into and saved from the grid (S03); columns are published from it, and changes to published scores need a reason and are kept in each cell's history (S04); `EX` excuses a student from a grade (S05); a column can be linked to one of the course's assignments (S06); students are found by name or cédula and the view exports as CSV (S07); homeroom teachers are alerted to published scores below the pass mark (S08); grade endpoints scoped by role, organization and ownership in ASM-001-S01; one bucket-weighted average everywhere in ASM-001-S09) | [ASM-001](frd/ASM-001-teacher-gradebook.md) |
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
Code: `communication` (REST `/v1/communication/channels`, `/v1/communication/direct`); routes `/communication/channels`, `/communication/direct`

| Capability | Status | FRD |
|---|---|---|
| Channels at org / school / plan / group / course level, with read counts and read confirmations | Shipped (assignment Q&A channels S02, *por responder* for managers S03) | [COM-003](frd/COM-003-channels-and-direct.md) |
| Direct messages staff ↔ parents | Shipped | [COM-003](frd/COM-003-channels-and-direct.md) |
| Broadcasts, v2 threads, chats, legacy messages, newsletters | Removed (replaced by COM-003) | [COM-002](frd/COM-002-broadcasts.md) |

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
| School admin home (attention, KPIs, academics, finance, reach) | Partial (HOM-001 S08 in review; S09–S10 proposed) | [HOM-001](frd/HOM-001-persona-home-dashboards.md) |

## PLT: Platform Administration
Code: `apps/web-admin`, `apps/admin-backend`

| Capability | Status | FRD |
|---|---|---|
| Organizations management | Live | — |
| Global users, roles, permissions | Live | — |
| Global grade/habit metrics, periods, subjects | Live | — |
| Restrict admin API to `SYSADMIN` | Planned | — |
