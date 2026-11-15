# HOM-001 — Persona home dashboards

| | |
|---|---|
| **Status** | Draft |
| **Context** | HOM — Home dashboards (see [capabilities](../capabilities.md#hom-home-dashboards)) |
| **Owner** | — |
| **Last updated** | 2026-11-14 |
| **Related** | Approved designs: [Persona Home Dashboards canvas](https://claude.ai/artifact/1i9feViJJ3sijUXSczA3h3) (approved 2026-11-14) · current homes `apps/web-dashboard/src/app/home.ts`, `teacher-home.ts`, `student-home.ts`, `parent-home.ts` · [COM-002](COM-002-broadcasts.md) FR .6 (recent broadcasts widget) · `.kilo/plans/1783889752522-parent-home-page.md` |

## 1. Problem & outcome
Every role lands on `/home`, but today's four homes show mostly counts and lists that don't lead to action. For example, the admin home lists the latest students and teachers created, and the teacher home shows **school-wide** course and student counts (`teacher-home.ts:583-604`) instead of the teacher's own. The student home lists **every** assignment in the school, because `GET /v1/assignments/by-school` has no group filter (`assignments.service.ts:43`).

After this ships, each persona's home answers one question:

- **School admin:** "What needs me today?"
- **Teacher:** "What's my day, and what's pending?"
- **Student:** "What's due, and where do I go?"
- **Parent:** "Is my child OK?"

Every number is scoped to what that person is responsible for. Pass and excellence marks come from the grade metric of each student's study plan. Areas reserved for charts are placeholders, to be built later.

**Success metric:** <to define — proposals: (a) teachers: share of scheduled classes with attendance recorded on the same day rises from today's baseline; (b) parents: median time from an unexcused-absence record to the first parent view of it; (c) home → action click-through ≥ 30 % of sessions>

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| School admin | See the school home: attention items, KPIs, attendance, academics, finance, communication, store | **New** `Perm.VIEW_SCHOOL_DASHBOARD` (Q1, seeded in S08). Finance section also needs `VIEW_FINANCIALS`; store section needs `VIEW_STORE` | Organization → selected school (`currentSchoolId`) |
| Teacher | See their day, pending work, their courses' assignments, students needing attention, unanswered family messages | `VIEW_COURSES` **and** a `Teacher` record in the org (BR .7) | Own courses + class groups related to them (same relation as BR-COM-002.7) |
| Student | See today's classes, upcoming work and quizzes, grades, attendance, habits, unread messages | `VIEW_GRADES` **and** a `Student` record linked to the user (BR .8) | Self |
| Parent | Switch between linked children; per child see alerts, KPIs, work, grades, attendance, account and teacher messages | `VIEW_GRADES` **and** the child is linked to them (BR .9). Account section needs `VIEW_FINANCIALS` | Linked children, possibly across schools |

## 3. Functional requirements

### Common
- **FR-HOM-001.1**: Every persona's home opens with a greeting using their first name, today's date in the school's timezone, and the current period name (BR .3, .4).
- **FR-HOM-001.2**: Any grade shown as passing, failing or excellent is judged against the grade metric of the student's study plan: `minimumApproval`, `minimumExcellence`, and `maximum` as the scale (BR .1).
- **FR-HOM-001.3**: Each section loads independently. While loading it shows a skeleton. If its request fails, it shows an inline error with *"Reintentar"* and the other sections still render.
- **FR-HOM-001.4**: Areas reserved for future charts show a placeholder with the chart's name and *"Gráfico por desarrollar"*. They never show invented data.
- **FR-HOM-001.5**: When an end-of-period date is ≤ 14 days away, admins and teachers see a banner: *"Cierre del {period} en N días"*, with their incomplete-grades count and a link to resolve it.

### Teacher
- **FR-HOM-001.6**: A teacher sees **"Mi día"**: today's schedule slots for their courses, in time order, including recess. Each slot shows its state: done, now, later, or missed (attendance not taken after the start time). It also shows the recorded attendance (`29/31`) or a *"Tomar asistencia"* action. Remote slots show *"Abrir enlace"* (BR .15).
- **FR-HOM-001.7**: A teacher sees KPIs scoped to their own courses: submissions received for review (Q4), attendance rate of their groups this week with the lowest group named, average of their courses this period, and unanswered family messages.
- **FR-HOM-001.8**: A teacher sees **"Pendientes"**, a list that hides zero-count rows:
  - submissions to review;
  - grade cells with no score in their courses this period;
  - grades not yet published;
  - habit evaluations saved but not published;
  - unanswered family messages;
  - quizzes with no schedule.
- **FR-HOM-001.9**: A teacher sees this week's assignments for their courses (Monday–Sunday). Each row shows its type and due date and, where `requireSubmission` is set, a submission progress bar (`18/27 entregaron`).
- **FR-HOM-001.10**: A teacher sees up to 5 students in their groups who need attention, each with reason chips (BR .11).
- **FR-HOM-001.11**: A teacher sees the latest unanswered family threads, with sender, time and preview (BR .13).

### Student
- **FR-HOM-001.12**: A student sees the current class ("Ahora", ending at …) and the next class, with teacher and room or remote link, plus a strip of today's classes.
- **FR-HOM-001.13**: A student sees KPIs:
  - period average, with the change from the previous period;
  - attendance rate this period, with absence and late counts;
  - work pending, including how many are due tomorrow;
  - unread messages.
- **FR-HOM-001.14**: A student sees work due in the next 14 days and work overdue in the last 7 days, for **their class group only**. Each item has a type chip, a due date and a status (*Pendiente · Entregado · Vencida · Presencial*). A hand-in action appears where submission is required (BR .12).
- **FR-HOM-001.15**: A student sees quizzes open now (with closing time and *"Comenzar"*) and quizzes opening within 7 days.
- **FR-HOM-001.16**: A student sees their average per course this period, coloured by band (excellent / passing / below the pass mark) with a legend taken from their study plan's metric. Below it are the 3 most recent published grades.
- **FR-HOM-001.17**: A student sees a habits summary for the current period: how many marks are *S*, and which habits are marked *R* or *X*. Only published evaluations count.

### Parent
- **FR-HOM-001.18**: A parent sees one switcher button per linked child (name, group, alert count). Choosing one reloads every child section. The choice persists through `ParentContext` and defaults per BR .9.
- **FR-HOM-001.19**: For the selected child, a parent sees **"Requiere tu atención"** alerts:
  - unexcused absence in the last 7 days;
  - overdue work;
  - a course average below the pass mark;
  - a charge overdue or due within 7 days;
  - 3 or more late arrivals this week.

  Each alert has an action link. With no alerts the section reads *"Todo al día"*.
- **FR-HOM-001.20**: For the selected child, a parent sees the same KPIs as FR .13, with *"Saldo"* replacing *"Mensajes"*. Saldo needs `VIEW_FINANCIALS`.
- **FR-HOM-001.21**: For the selected child, a parent sees upcoming work (as in FR .14, read-only) and the 4 most recent published grades.
- **FR-HOM-001.22**: For the selected child, a parent sees an account summary: status chip, next charge with due date, last payment, and a link to `/parent/finances`.
- **FR-HOM-001.23**: For the selected child, a parent sees the latest messages from that child's teachers (`STUDENT_GUARDIANS` threads).

### School admin
- **FR-HOM-001.24**: An admin sees **"Requiere tu atención"** tiles, each linking to the page that resolves it. Zero-count tiles are hidden, and *"Todo al día"* shows when all are zero. Tiles:
  - pending join requests;
  - broadcasts pending approval;
  - classes with no attendance today;
  - overdue charges (count, amount, families);
  - import jobs with errors;
  - study plans with no grade metric.
- **FR-HOM-001.25**: An admin sees KPIs for the selected school:
  - active students, with candidates;
  - attendance today, against last week;
  - collection this month, as % and amounts;
  - % of students passing every course this period.
- **FR-HOM-001.26**: An admin sees the 6 class groups with the lowest attendance this week, plus groups with classes today but no attendance recorded.
- **FR-HOM-001.27**: An admin sees up to 5 students in follow-up (BR .11) with group, reason chips and period average, plus a link to the full list.
- **FR-HOM-001.28**: An admin sees this month's finance: collected, pending, overdue, and the next due dates with amounts.
- **FR-HOM-001.29**: An admin sees the latest 3 broadcasts with urgency and read rate (`READ` deliveries ÷ all deliveries), plus the count of `FAILED` and `BOUNCED` deliveries.
- **FR-HOM-001.30**: An admin with `VIEW_STORE` sees store orders waiting to be prepared (`PENDING`, `CONFIRMED`, `PROCESSING`), with count and total.

## 4. Business rules
- **BR-HOM-001.1**: **Grade thresholds.** Use `Student.classGroup.studyPlan.gradeMetric`, or for course figures `Course.studyPlan.gradeMetric`. A grade is below the pass mark when `score < minimumApproval`. It is excellent when `score ≥ minimumExcellence`. If the plan has no grade metric (`gradeMetricId` is null), the API returns `null` for every threshold-dependent value. The UI then shows "—" with the hint *"Escala de notas no configurada"*, and the admin attention tile counts the plan (FR .24). No threshold is ever hard-coded.
- **BR-HOM-001.2**: **Published only.** Student, parent and admin figures use only `Grade.published = true`, the same as `grades.service.ts:82`. Teachers also see their own unpublished grades, but only as a pending item (FR .8).
- **BR-HOM-001.3**: **Current period.** The current period is the `Period` with `year = school.currentYear` and `startDate ≤ today ≤ endDate`. If none matches, use the most recent period that has ended. If there is none, period-based sections show *"No hay un periodo activo"*. The previous period is the one ending immediately before the current one.
- **BR-HOM-001.4**: **Time.** "Today", "now", "this week" (Monday–Sunday) and "this month" are evaluated in `School.timezone` (Q2). Schedule times (`HH:mm`) are read in that timezone.
- **BR-HOM-001.5**: **Attendance rate** = (`PRESENT` + `LATE`) ÷ (all records − `EXCUSED` − `SICK_LEAVE`) over the window (Q3). With no records in the window, the rate is `null` and the UI shows "—".
- **BR-HOM-001.6**: **Unexcused absence** means a record with status `ABSENT`.
- **BR-HOM-001.7**: **Teacher scope.**
  - Courses: `Course.teacherId = teacher.id`.
  - Groups: class groups whose study plan contains one of those courses (same as BR-COM-002.7).
  - Homeroom alone grants nothing.
  - Teacher endpoints resolve `teacher.findFirst({ userId, organizationId })`. If there is no teacher record they return `403 No teacher profile in this organization`.
- **BR-HOM-001.8**: **Student scope.** Student endpoints resolve `Student` by `userId` within the caller's organization, and return `403` if there is none. They take no `studentId` parameter. A student without a class group sees *"Aún no tienes grupo asignado"* in schedule and work sections.
- **BR-HOM-001.9**: **Parent scope.**
  - `studentId` must be among the caller's linked students (`/v1/parents/me`). Otherwise the API returns `403 No puedes ver la información de este estudiante`, and no data about that student is returned.
  - The default child is the one with the most alerts; ties go to the first alphabetically.
  - Each child's data comes from that child's school and organization.
- **BR-HOM-001.10**: **Admin scope.** `schoolId` must belong to the caller's organization (`403` otherwise). Every query filters by `organizationId` and `schoolId`.
- **BR-HOM-001.11**: **Needs attention / follow-up.** A student qualifies if either condition holds:
  - 3 or more `ABSENT` records in the current week;
  - 2 or more courses with a period average below the pass mark (BR .1).

  For a teacher, only their courses and groups count. Teachers also see two extra reasons: an average that dropped ≥ 0.5 from the previous period, and ≥ 3 `LATE` records this week. All thresholds are fixed constants in v1 (Q5).
- **BR-HOM-001.12**: **Work status.** Due dates come from `AssignmentDate` for the student's class group, not `Assignment.date`.
  - *Vencida*: the date has passed, `requireSubmission` is true, and there is no `AssignmentSubmission`.
  - *Entregado*: a submission exists.
  - *Presencial*: `requireSubmission` is false.
  - *Pendiente*: anything else.
- **BR-HOM-001.13**: **Unanswered thread.** A non-broadcast thread where the teacher is a participant and the last message was sent by a parent. It is highlighted when older than 48 h.
- **BR-HOM-001.14**: **Finance.**
  - Month figures use charges with `dueDate` in the current month.
  - *Collected* = sum of their payments.
  - *Overdue* = charges not `PAID` with `dueDate < today`, amount = `charge.amount − Σ payments`.
  - *Families* = distinct students' parent sets.
  - Amounts are formatted with `school.currencyCode`.
- **BR-HOM-001.15**: **Missed attendance.** A schedule slot for today that is not recess, whose start time has passed, and has no `AttendanceSession` for (`courseId`, `classGroupId`, `date = today`).
- **BR-HOM-001.16**: **Permission-gated sections are omitted.** If a section needs a permission the caller lacks, the API doesn't return it and the UI doesn't draw it. It is not shown as empty.

## 5. Data
- Read-only over existing models: `Period`, `ClassGroupWeeklySchedule`, `AttendanceSession` / `AttendanceRecord`, `Course`, `ClassGroup`, `StudyPlan` → `GradeMetric`, `Grade` / `StudentGrade` / `GradeBucket`, `HabitEvaluation` / `StudentHabitEvaluation`, `Assignment` / `AssignmentDate` / `AssignmentSubmission`, `Quiz` / `QuizSchedule` / `QuizSubmission`, `CommunicationThread` / `CommunicationMessage` / `ThreadParticipant` / `MessageDelivery`, `Charge` / `Payment`, `JoinRequest`, `ImportJob`, `StoreOrder`, `Student`, `Parent`, `Teacher`.
- **Schema changes:** `School.timezone String @default("America/Panama")` (Q2, in S01) and `AssignmentSubmission.reviewedAt DateTime?` (Q4, in S02).
- **New permission:** `Perm.VIEW_SCHOOL_DASHBOARD` (Q1, in S08).
- Tenancy: every query filters by the caller's `organizationId`, plus `schoolId` / ownership per BR .7–.10.
- Audit: none (read-only).

## 6. API surface
New Nest module `apps/dashboard-backend/src/app/home/`. It holds one endpoint per home section, so sections load independently (FR .3). Each section is a read model computed with aggregate queries, with no N+1.

| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `GET /api/v1/home/teacher/today?schoolId=` | Mi día | `VIEW_COURSES` + teacher record | .1 .6 |
| `GET /api/v1/home/teacher/summary?schoolId=` | KPIs + Pendientes + period banner | `VIEW_COURSES` + teacher record | .5 .7 .8 |
| `GET /api/v1/home/teacher/week?schoolId=` | This week's assignments + progress | `VIEW_COURSES` + teacher record | .9 |
| `GET /api/v1/home/teacher/attention?schoolId=` | Students needing attention + unanswered threads | `VIEW_COURSES` + teacher record | .10 .11 |
| `GET /api/v1/home/student/today` | Now/next + today strip | `VIEW_GRADES` + student record | .1 .12 |
| `GET /api/v1/home/student/work` | Upcoming/overdue work + quizzes | `VIEW_GRADES` + student record | .14 .15 |
| `GET /api/v1/home/student/progress` | KPIs, per-course averages, recent grades, habits | `VIEW_GRADES` + student record | .13 .16 .17 |
| `GET /api/v1/home/parent/children` | Switcher with alert counts | `VIEW_GRADES` + parent record | .18 |
| `GET /api/v1/home/parent/child/:studentId` | Alerts, KPIs, work, grades, messages | `VIEW_GRADES` + linked child | .19 .20 .21 .23 |
| `GET /api/v1/home/parent/child/:studentId/account` | Account summary | `VIEW_FINANCIALS` + linked child | .22 |
| `GET /api/v1/home/admin/attention?schoolId=` | Attention tiles + period banner | `VIEW_SCHOOL_DASHBOARD` (Q1) | .5 .24 |
| `GET /api/v1/home/admin/kpis?schoolId=` | KPI row | `VIEW_SCHOOL_DASHBOARD` | .25 |
| `GET /api/v1/home/admin/academics?schoolId=` | Lowest-attendance groups + follow-up students | `VIEW_SCHOOL_DASHBOARD` | .26 .27 |
| `GET /api/v1/home/admin/finance?schoolId=` | Month finance | `VIEW_SCHOOL_DASHBOARD` + `VIEW_FINANCIALS` | .28 |
| `GET /api/v1/home/admin/communication?schoolId=` | Broadcast reach + store orders | `VIEW_SCHOOL_DASHBOARD` (+ `VIEW_STORE` for orders) | .29 .30 |

Shared helpers inside `home/`: `resolveCurrentPeriod`, `schoolNow` (timezone), `gradeThresholds(studyPlanId)`, `teacherScope(userId, orgId)` (reusing the BR-COM-002.7 `where` helpers in `communication`), and `attendanceRate`. Existing endpoints stay unchanged. The recent-broadcasts widget keeps using `GET /communication/inbox/broadcasts` (COM-002 FR .6).

Events / side effects: none. Sections are fetched on page load, with no sockets in v1.

## 7. UX
- Entry point: `/home`. The existing `canMatch` role guards in `dashboard.routes.ts` pick `home.ts`, `teacher-home.ts`, `student-home.ts` or `parent-home.ts`, and each file is rewritten in place to match the approved design.
- Layout per the canvas: header (greeting, date and period, primary actions) → banner → attention → KPI row → two-column sections (main `flex: 999 1 560px`, side `flex: 1 1 340px`, stacked on phones).
- States per section: skeleton · error with retry · empty (copy from the designs, e.g. *"Todo al día"*, *"No hay un periodo activo"*) · omitted when permission is missing.
- Design-system components: `PageHeader`, `StatCard`, `Card`, `Badge`, `Table`, `Alert`, `EmptyState`, `Spinner`, `Button`. **New `libs/ui` primitives:** `Meter` (thin progress bar with label, used for attendance, collection and submission progress) and `ChartPlaceholder` (dashed frame, title, chart type, *"Gráfico por desarrollar"*). Both get Storybook stories. No raw palette colours: band colours map to `success` / `primary` / `error` tokens.
- The existing `RecentBroadcasts` widget becomes the "Avisos" / "Comunicados" card on student and parent homes. The admin card adds read rates (FR .29).

## 8. Non-functional
- **Performance:** p95 ≤ 800 ms per section endpoint for a school of 1,500 students and 100 courses. The KPI "% passing every course" and follow-up lists need per-student, per-course averages: compute them with one grouped query per period, not per student. If that misses the budget, cache per school for 10 min (Q6).
- **Privacy:** these views aggregate minors' grades, attendance and finances. Parent and student endpoints never take a free `studentId` without the link check (BR .8, .9). Message previews are truncated to 140 characters and excluded from logs.
- **i18n:** copy is Spanish and quoted from the designs. Dates use the `es` locale. Money uses `school.currencyCode`.
- **Accessibility:** tiles and rows are real links or buttons with ≥ 44 px targets. The child switcher uses `aria-pressed`. Colour bands always come with the number or text.
- **Mobile:** single-column layout below 640 px, as drawn.

## 9. Out of scope
- Real charts. Placeholders only (FR .4); each chart gets its own slice later.
- A parent "justify absence" workflow (Q7). The alert links to *"Escribir al docente"* instead.
- Configurable thresholds per school (Q5).
- Real-time updates (sockets) on the home pages.
- Fixing the existing unscoped endpoints used by the old homes. Those are recorded as Q8–Q9 for their own contexts. The new homes don't call them.
- `web-admin` (SYSADMIN) home.

## 10. Open questions
- [x] **Q1 — Admin permission.** **Decided 2026-11-14:** add a new key, `Perm.VIEW_SCHOOL_DASHBOARD`, seeded to `ORG_ADMIN` (SYSADMIN/ADMIN pass any check). It can later be granted to coordinators without giving them edit rights. Added to `permissions.constants.ts` and the seed in S08.
- [x] **Q2 — School timezone.** **Decided 2026-11-14:** add `School.timezone String @default("America/Panama")`, an IANA name editable in school settings. The migration ships in S01.
- [x] **Q3 — Attendance rate formula.** **Decided 2026-11-14:** (`PRESENT` + `LATE`) ÷ (all − `EXCUSED` − `SICK_LEAVE`), as in BR .5, on all home pages. The existing `getStudentAttendanceStats` (`attendance.service.ts:343`, present ÷ total) is unchanged for now. Aligning it is a follow-up in the future ATT FRD, together with Q9.
- [x] **Q4 — "Entregas por revisar".** **Decided 2026-11-14:** add `AssignmentSubmission.reviewedAt DateTime?`. It is set when the teacher grades the submission or marks it reviewed; "to review" means `reviewedAt IS NULL`. The migration and the assignments change ship in S02.
- [ ] **Q5 — Follow-up thresholds.** Are the fixed values right: 3 absences per week, 2 courses below the pass mark, a 0.5 drop, 3 late arrivals? Should they be configurable per school later?
- [ ] **Q6 — Caching.** Is a 10-minute stale "% passing" or follow-up list acceptable for admins?
- [ ] **Q7 — Justifying absences.** The design's parent alert says *"Enviar justificación"*, but no justification flow exists. Keep *"Escribir al docente"* for now (proposed), or plan an ATT feature?
- [ ] **Q8 — Gap: assignments by school.** `GET /v1/assignments/by-school` (`assignments.controller.ts:24`) has no `@RequirePermissions`, filters only by `schoolId` (no `organizationId`), and doesn't scope to the caller's groups or courses. The current student and teacher homes therefore list every assignment in the school. → candidate slice in a future ACA as-is FRD.
- [ ] **Q9 — Gap: attendance stats ownership.** `GET /v1/attendance/stats/by-student/:studentId` (`attendance.service.ts:326`) checks neither organization nor ownership. Any `VIEW_ATTENDANCE` holder, including any student or parent, can read any student's stats by id. → candidate slice in a future ATT as-is FRD.
- [ ] **Q10 — Slice order.** Ship teacher first (proposed, because it fixes the school-wide numbers and is used daily), or parent first (largest audience)?

## 11. Slices
Each slice replaces its part of the existing home in place. Old widgets that aren't replaced yet stay until their slice lands, so every slice ships on its own.

| Slice | Title | FRs | Status |
|---|---|---|---|
| [HOM-001-S01](../slices/HOM-001-S01-teacher-my-day.md) | Teacher: "Mi día" with attendance state + scoped attendance KPI (home module foundation, school timezone) | .1 .6 .7 (attendance tile), BR .3 .4 .5 .7 .15 | Ready |
| HOM-001-S02 | Teacher: Pendientes, period-close banner, this week's assignments with progress (adds `Meter`, `AssignmentSubmission.reviewedAt`) | .5 .7 .8 .9, BR .2 | Proposed |
| HOM-001-S03 | Teacher: students needing attention, unanswered family threads, average KPI, grade-distribution placeholder (adds `ChartPlaceholder`, grade thresholds) | .2 .4 .7 .10 .11, BR .1 .11 .13 | Proposed |
| HOM-001-S04 | Student: now/next, today strip, upcoming/overdue work for own group, quizzes (adds student e2e persona) | .1 .12 .14 .15, BR .8 .12 | Proposed |
| HOM-001-S05 | Student: KPIs, per-course averages with bands, recent grades, habits, progress placeholder | .2 .13 .16 .17, BR .1 .2 | Proposed |
| HOM-001-S06 | Parent: child switcher with alert counts, alerts and KPIs for the selected child (adds parent e2e persona) | .18 .19 .20, BR .9 | Proposed |
| HOM-001-S07 | Parent: upcoming work, recent grades, teacher messages, account summary, attendance and trend placeholders | .21 .22 .23 .4, BR .14 .16 | Proposed |
| HOM-001-S08 | Admin: attention tiles, period banner, KPI row (adds `VIEW_SCHOOL_DASHBOARD`) | .5 .24 .25, BR .10 .14 .15 .16 | Proposed |
| HOM-001-S09 | Admin: lowest-attendance groups, follow-up students, attendance and academics placeholders | .26 .27 .4, BR .11 | Proposed |
| HOM-001-S10 | Admin: month finance, broadcast read rates, store orders; remove the old "Últimos estudiantes / Docentes recientes" | .28 .29 .30, BR .14 .16 | Proposed |
