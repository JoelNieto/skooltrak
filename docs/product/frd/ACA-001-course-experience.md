# ACA-001 — Course experience: course list and course page

| | |
|---|---|
| **Status** | In build (course channels, S15–S17) |
| **Context** | ACA — Academics (see [capabilities](../capabilities.md#aca-academics)) |
| **Owner** | — |
| **Last updated** | 2026-11-23 |
| **Related** | Design canvas "Skooltrak — Courses redesign (desktop)", boards *Courses — list* and *Course details — Mathematics* (claude.ai/artifact/MGaGctNuxxJd1rouLSYTaa) · [HOM-001](HOM-001-persona-home-dashboards.md) (reuses its grade, period, scope and work-status rules) · [ASM-001](ASM-001-teacher-gradebook.md) (gradebook, assignment-linked grades) · [COM-003](COM-003-channels-and-direct.md) (channels, membership and unread counts used by FR .21–.25) · current code: `apps/web-dashboard/src/app/courses/courses.ts`, `courses/course.ts`, `apps/dashboard-backend/src/app/courses/` |

## 1. Problem & outcome
Today *Cursos* is a grid of identical cards: the same stock photo, the subject name and the teacher. A student can't tell from it how a course is going, what's due next or when the class meets. They have to open each course and then each tab. Parents have no course view for their child at all. The course page leads with tabs, and its Participants tab is a placeholder.

When this ships, every course has its own color and icon, so it is recognisable wherever it appears. A student or parent sees on one page, for each course: the period average and whether it is on track, the next piece of work and its due date, and how much work is done. One click opens a course page that leads with the class schedule, the student's assignments with their status, a grade breakdown by category, and the people in the course.

**Success metric:** *proposal:* overdue assignments per active student fall by 20 % over the first full period after release, compared with the same period before it. This is measured from `AssignmentDate` and `AssignmentSubmission`, so it needs no analytics tooling.

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| Student | See *Mis cursos* with their progress; open their course pages | `VIEW_COURSES`, `VIEW_GRADES`, `VIEW_ASSIGNMENTS` | Self (BR .1) |
| Parent / guardian | Same as the student, for the selected linked child; no classmates list | `VIEW_COURSES`, `VIEW_GRADES`, `VIEW_ASSIGNMENTS` | Linked children (BR .2) |
| Teacher | See their courses with the new look; open their course pages; set color and cover of their own courses (S09). As homeroom teacher, view colleagues' courses read-only for their homeroom group's students (S13) | `VIEW_COURSES`; **new** `CUSTOMIZE_COURSES` (S09) | Own courses; homeroom group (BR .3) |
| School admin | Everything above for any course; set color of any course and icon/area of any subject; add or remove individual students on a course (S12) | `MANAGE_COURSES`, `MANAGE_SUBJECTS` (+ `CUSTOMIZE_COURSES`) | Organization |

## 3. Functional requirements

### Course appearance
- **FR-ACA-001.1**: Every course has a color tag chosen from 8 (BR .11). With no cover image, the course's cover is that color plus the subject's icon. The color also shows as a dot next to the course name in the course page header.
- **FR-ACA-001.2**: A school admin can set a course's color in the course form, and a subject's icon and area in the subject form.
- **FR-ACA-001.3**: The teacher of a course, or an admin, can set its color, and choose either an icon (from the subject icon list; it overrides the subject's icon for this course) or a cover photo (BR .12). With a photo, the photo replaces the color cover, and the color stays as the dot.

### *Mis cursos* (student and parent)
- **FR-ACA-001.4**: A student sees one card per course of their class group's study plan, ordered by subject name. Each card shows:
  - the cover and the subject-area chip;
  - the course name and schedule (BR .9);
  - the teacher's avatar and name;
  - **Próxima entrega**: the next item and its due text (BR .8);
  - **Promedio**: the period average and band label (BR .5);
  - a progress bar, *"{done} de {total} completadas"* (BR .7).

  The whole card links to the course page.
- **FR-ACA-001.5**: *Mis cursos* always shows the current period of the school's current year (BR-HOM-001.3), with no period switcher: averages, progress, *Próxima entrega* and the stats row are for that period. Other periods are reached through the course page's *Calificaciones* tab, which has its own switcher (FR .14) *(decided 2026-11-23)*.
- **FR-ACA-001.6**: Above the cards, a stats row shows:
  - **Promedio del periodo**: as in FR-HOM-001.13;
  - **Esta semana**: the number of items due this week, with *"{n} vencida(s)"* when any are overdue (BR .10);
  - **Completadas**: *"{done} de {total}"* across all courses (BR .7).
- **FR-ACA-001.7**: Filter chips show *"Todas"* plus one chip per subject area among the user's courses, each with its count (BR .14). Choosing a chip filters the cards. The existing search box still filters by name.
- **FR-ACA-001.8**: A parent sees *Mis cursos* for the child selected in the child switcher, which is shared with the parent home (`ParentContext`). Everything in FR .4–.7 applies, computed for that child.
- **FR-ACA-001.9**: Teachers and admins see the same card design without personal progress: cover, area chip, course name, study plan badge and teacher.

### Course page
- **FR-ACA-001.10**: The course page header shows:
  - the cover, the color dot, the course name and the area chip;
  - the class group (student and parent: their own group; staff: the study plan);
  - the teacher;
  - the schedule days and times, and the room (BR .9).

  A *"Ver calendario"* button opens the assignments calendar, which is today's `course-assignments` component.
- **FR-ACA-001.11**: Students and parents see the tabs **Resumen · Asignaciones · Calificaciones · Participantes · Recursos**. The *Asignaciones* tab shows *"{n} pendientes"* and *Participantes* shows the head count. Staff keep their current tabs (attendance, weights), and the *Calificaciones* tab becomes the gradebook in [ASM-001](ASM-001-teacher-gradebook.md).
- **FR-ACA-001.12**: **Resumen** shows the next 3 items of work, the grade summary from FR .14 without the table, and the course's teachers.
- **FR-ACA-001.13**: **Asignaciones** has two lists, *Próximas* and *Pasadas*, the latter ordered most recent first. Each row shows:
  - a type icon and the title;
  - *"{tipo} · {fecha}"*;
  - a status pill (BR .6).

  The row links to `/assignments/:id`.
- **FR-ACA-001.14**: **Calificaciones** has its own period switcher and shows:
  - the current average on the plan's scale, *"{avg} / {max}"*, with its band and the pass mark;
  - one bar per grade bucket, with its name, weight and average;
  - a table of the published grades, most recent first: title, bucket, date, teacher's comment and score.
- **FR-ACA-001.15**: **Participantes** lists the course's teachers (the course teacher; the student's homeroom teacher labelled *"Docente consejero"*) and its students, with a name search. Parents see teachers only (BR .13).
- **FR-ACA-001.16**: **Recursos** is today's course files tab, unchanged.
- **FR-ACA-001.17**: When an assignment has a linked grade ([ASM-001](ASM-001-teacher-gradebook.md) FR .11) that is published and scored for the student, its status pill reads *"Calificada · {score}"*. If the grade is excused, it reads *"Exenta"*.

### Homeroom teacher
- **FR-ACA-001.18**: A teacher who is homeroom teacher (*docente consejero*) of a class group sees a *"Cursos de {grupo}"* section on *Cursos*. It lists the group's courses taught by colleagues. Each course opens read-only, with the data limited to that group's students (BR .16).

### Course roster
- **FR-ACA-001.19**: A school admin can open a course's roster, which lists each enrolled student and their origin: *"Plan de estudio"* or *"Agregado"*. The admin can:
  - add a student who is not in the course's study plan, for example for an elective;
  - remove a student from a course of their plan, for example for an exemption.
- **FR-ACA-001.20**: Every course list, page, roster and gradebook uses the same roster (BR .15). This includes students created by CSV import.

### Course channels (students and parents)
These read the course's channels from [COM-003](COM-003-channels-and-direct.md). Nothing here creates, posts to or changes a channel.
- **FR-ACA-001.21**: The course page gains a **Canales** tab, between *Calificaciones* and *Participantes*, that lists the course's channels (BR .17). Each row shows:
  - the channel's name and its kind (BR .18);
  - the latest post's preview and time, or *"Sin publicaciones"*;
  - *"{n} nuevo(s)"* when it has unread posts.

  Archived channels come last with an *"Archivado"* badge. A row opens `/communication/channels/:id`, which marks its posts read (FR-COM-003.8). The tab label shows *"{n} nuevos"* when the course has unread posts. With no channels the tab shows *"Este curso aún no tiene canales"*.
- **FR-ACA-001.22**: **Resumen** gains a *Canales* card with up to 3 of the course's non-archived channels, by latest post, and *"Ver todos"*, which opens the *Canales* tab. The card is hidden when the course has no channels.
- **FR-ACA-001.23**: A *Mis cursos* card whose course has unread channel posts shows *"{n} nuevos"* on its cover, and its accessible name gains *"{n} mensajes nuevos."*
- **FR-ACA-001.24**: The *Mis cursos* stats row gains **Nuevo en canales**: the unread posts across the shown courses' channels, with *"en {k} curso(s)"*, or *"Nada nuevo"* at 0.
- **FR-ACA-001.25** *(blocked on Q9)*: a student can ask a question to the class from the course header (the design's *"Ask in #general"*).

## 4. Business rules
- **BR-ACA-001.1**: **Student scope.**
  - The student is resolved as in BR-HOM-001.8.
  - Their courses are the courses they are enrolled in (BR .15).
  - A student with no class group and no enrollment sees *"Aún no tienes grupo asignado"* instead of cards.
- **BR-ACA-001.2**: **Parent scope.**
  - `studentId` must be a linked child, as in BR-HOM-001.9. Otherwise the API returns `403 No puedes ver la información de este estudiante` and no data.
  - Student endpoints ignore `studentId`.
- **BR-ACA-001.3**: **Course page access.** `GET /courses/:id` and every course-page endpoint allow:
  - students: courses from BR .1;
  - parents: courses of a linked child (BR .2);
  - teachers: their own courses (BR-HOM-001.7), with full access;
  - homeroom teachers: read-only access to the other courses their homeroom group's students are enrolled in, limited to those students (BR .16);
  - admins: any course in their organization.

  Otherwise the API returns `403 No tienes acceso a este curso` and the UI shows the error state with a link back to *Mis cursos*. A course in another organization is refused the same way. *This tightens current behaviour: today any authenticated user can read any course by id (decided 2026-11-19, Q8).*
- **BR-ACA-001.4**: **List tenancy.** The `schoolId` passed to `GET /courses` and `GET /courses/mine` must belong to the caller's organization (`403` otherwise). *Today it is not checked (`courses.service.ts:184`).*
- **BR-ACA-001.5**: **Averages and bands.**
  - Averages use only published grades (BR-HOM-001.2) and the category-weighted formula in BR-ASM-001.4.
  - Thresholds come from the study plan's grade metric (BR-HOM-001.1).
  - The card label is *"En riesgo"* below the pass mark and *"Al día"* otherwise.
  - With no scored grade the card shows "—" and *"Sin notas"*; with no metric, "—" and *"Escala de notas no configurada"*.
- **BR-ACA-001.6**: **Work status pills.** These extend BR-HOM-001.12 and use due dates from the student's group `AssignmentDate`. In order of precedence:
  1. *"Calificada · {score}"* or *"Exenta"* (FR .17);
  2. *"Entregada"*;
  3. *"Vencida"*;
  4. *"Presencial"*;
  5. *"Vence en {n} día(s)"*, or *"Vence hoy"*, when the item would be *Pendiente* and is due within 7 days;
  6. *"Próxima"* otherwise.
- **BR-ACA-001.7**: **Done / total** *(decided 2026-11-19, Q4)*.
  - **Total:** assignments with an `AssignmentDate` for the student's class group inside the selected period.
  - **Done:** items that are *Entregada*, *Calificada* or *Exenta*, or *Presencial* with the date in the past.
- **BR-ACA-001.8**: **Próxima entrega.**
  - If the course has a *Vencida* item, show the oldest one, with *"Vencida desde {día}"* in the danger tone.
  - Otherwise show the nearest item due now or later, with *"Vence {día}, {hora}"*.
  - Otherwise show *"Nada pendiente"*.
- **BR-ACA-001.9**: **Schedule text.** Built from the non-recess `ClassGroupWeeklySchedule` rows for (the student's class group, the course).
  - Days are abbreviated and joined: *"Lun, Mié, Vie"*. Monday to Friday becomes *"Todos los días"*.
  - The location is the most frequent non-empty value. If every slot is remote, it is *"Virtual"*.
  - The header adds the time range when every slot shares it, for example *"7:00–7:45"*.
  - Staff without a group context see no schedule text.
- **BR-ACA-001.10**: **This week** is Monday to Sunday in `School.timezone` (BR-HOM-001.4).
- **BR-ACA-001.11**: **Color tag.**
  - `Course.color` is one of 8 keys: `INDIGO`, `TEAL`, `ROSE`, `VIOLET`, `AMBER`, `SLATE`, `FUCHSIA`, `GREEN`.
  - It renders through `libs/ui` tokens (`--color-course-<key>` and `-content`, defined for light and dark), never raw hex. The icon on the cover meets 3:1 contrast against it.
  - An unset color falls back to a key derived from the course id, so it is stable without any setup.
  - Any other value gets `400`.
- **BR-ACA-001.12**: **Cover photo.**
  - JPEG, PNG or WebP, at most 2 MB, stored privately in S3 and served by presigned URL (as files and avatars are today).
  - Only admins, or the course's teacher with `CUSTOMIZE_COURSES`, can set or remove it (`403` otherwise). Other file types or sizes get `400`.
  - Admins and teachers may change only the color and the cover through this path, never the subject, plan or teacher.
- **BR-ACA-001.13**: **Participant privacy.**
  - Students see classmates' full names and initials only, never email, codes or contact details.
  - Parents see teachers only; the API returns no student rows for a parent.
  - The roster is defined by BR .15.
- **BR-ACA-001.14**: **Subject area.**
  - `Subject.area` is optional free text set by an admin (decided 2026-11-19, Q2). It is trimmed, and matched case-insensitively when building chips.
  - Chips show the distinct areas among the user's courses, sorted alphabetically, plus *"Otras"* for courses whose subject has no area.
  - Chips with no courses are not shown.
- **BR-ACA-001.15**: **Roster** *(decided 2026-11-19, Q1)*. A course's students are its enrollments. Each enrollment has a source:
  - **Plan.** Created for every student whose class group belongs to the course's study plan. This happens when the course is created, when a student is created (including CSV import, which skips this today), and when a student joins a group.
  - **Manual.** Added by an admin (FR .19).

  Admins can also mark a plan enrollment *excluded*. Sync rules:
  - A class-group change removes the old plan's enrollments, exclusions included, and adds the new plan's.
  - A change of a course's study plan does the same for the course: its plan enrollments, exclusions included, are replaced by the new plan's students *(decided 2026-11-20)*.
  - Manual enrollments are kept across group changes. An admin removes them explicitly.
  - Sync never touches manual enrollments or excluded flags within the same plan.
  - Removing a student from a course keeps their grades and submissions; they are hidden from the course, not deleted.
  - Only admins change enrollments (`MANAGE_COURSES`; `403` otherwise). A student from another organization or school gets `400`.
  - **Backfill** *(decided 2026-11-20)*: the migration creates plan enrollments by the rule above and keeps every stored link it doesn't cover (a course outside the student's current plan) as **Manual**, so no student loses a course they see today.
- **BR-ACA-001.16**: **Homeroom read-only view** *(decided 2026-11-19, Q8)*.
  - Applies to `ClassGroup.teacherId` of the group only. Teaching a group grants nothing here, unlike BR-HOM-001.7.
  - The teacher sees the course header, assignments, resources, and the published grades of enrolled students of their homeroom group. That includes the Calificaciones summary per student, chosen from a student picker.
  - They never see drafts, the gradebook, attendance taking or weights, and they get no write actions.
  - Participants shows the teachers and their homeroom group's students only.
- **BR-ACA-001.17**: **A course's channels.**
  - They are the channels in the caller's `GET /communication/channels` list with `scope = COURSE` and `courseId` = the course. Membership, and so who sees which channel, is COM-003's (BR-COM-003.4, the course roster). Class-group, study-plan, school and organization channels never show on a course.
  - A parent sees the channels whose audience includes parents. One list covers every linked child; *Mis cursos* and the course page filter it by the child's courses.
  - Unread counts are COM-003's per-channel `unread` (FR-COM-003.11).
  - Without `COMMUNICATION_VIEW` the tab, the Resumen card, the card badges and the stat are hidden, and the list is not requested.
  - If the list fails to load, the tab and the Resumen card show an inline error with *"Reintentar"*. *Mis cursos* still renders its cards without badges, and the stat shows "—".
- **BR-ACA-001.18**: **Channel kind**, from the viewer's side (the reply settings in FR-COM-003.3–.4):
  - the viewer's audience can't reply: *"Solo anuncios"*;
  - it can reply and `replyVisibility = PUBLIC`: *"Conversación del curso"*;
  - it can reply and `replyVisibility = PRIVATE`: *"Preguntas al docente"*.
- **BR-ACA-001.19**: **Staff and homeroom.** Teachers and admins keep the header's *Canal* button (COM-003 §7) and get no *Canales* tab or badges: they manage these channels, and COM-003 counts unread only for members. The homeroom read-only view (BR .16) shows no channel elements: a homeroom teacher is neither a manager nor a member of a colleague's course channels (BR-COM-003.2).

## 5. Data
- **Schema changes:**
  - `Course.color CourseColor?` with a new enum `CourseColor` (S01);
  - `Course.coverKey String?` (S09);
  - `Subject.icon String?`, a key from a curated subset of `libs/ui` icon names, falling back to `book-open` (S01);
  - `Subject.area String?` (S04);
  - **new** `CourseEnrollment { courseId, studentId, source PLAN|MANUAL, excluded Boolean, addedById?, createdAt }` with `@@unique([courseId, studentId])`. It replaces the implicit `Course.students` relation; the migration backfills it from `_CourseToStudent` plus the plan rule, so imported students are included (S11).
- **New permission:** `Perm.CUSTOMIZE_COURSES` for `TEACHER`; admins pass every check (S09).
- **Read-only on:** `Assignment`, `AssignmentDate`, `AssignmentSubmission`, `Grade`, `StudentGrade`, `GradeBucket`, `GradeMetric`, `Period`, `ClassGroupWeeklySchedule`, `Teacher`, `Student`, `Parent`.
- No aggregates are stored. Averages and progress are computed per request using the `home-grades.ts` helpers.
- **Tenancy:** every query filters by the caller's `organizationId`. Student, parent and teacher queries are also scoped by BR .1–.3.
- **Audit:** none beyond `updatedAt`. Cover uploads and removals are logged with ids only.

## 6. API surface
| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `GET /api/v1/courses/mine?periodId=&studentId=` | Cards with progress + stats row + area chips | `VIEW_COURSES` + `VIEW_GRADES`; student or parent record | .4–.8 |
| `GET /api/v1/courses?schoolId=…` (existing) | Staff list; gains `color`, `coverUrl`, `subject.icon`, `subject.area` | `VIEW_COURSES` | .9, BR .4 |
| `GET /api/v1/courses/:id` (existing, tightened) | Header data | `VIEW_COURSES` | .10, BR .3 |
| `GET /api/v1/courses/:id/work?studentId=` | Assignments with status + tab count | `VIEW_ASSIGNMENTS` | .12 .13 .17 |
| `GET /api/v1/courses/:id/grades-summary?periodId=&studentId=` | Average, bucket bars, published grades | `VIEW_GRADES` | .12 .14 |
| `GET /api/v1/courses/:id/participants?studentId=` | Teachers + roster (BR .13) | `VIEW_COURSES` | .15 |
| `PATCH /api/v1/courses` (existing) | Admin sets `color` | `MANAGE_COURSES` | .2 |
| `PATCH /api/v1/subjects` (existing) | Admin sets `icon`, `area` | `MANAGE_SUBJECTS` | .2 |
| `PATCH /api/v1/courses/:id/appearance` | Teacher/admin sets `color` | `CUSTOMIZE_COURSES` | .3 |
| `POST` / `DELETE /api/v1/courses/:id/cover` | Upload / remove the cover photo | `CUSTOMIZE_COURSES` | .3 |
| `GET /api/v1/courses/:id/roster` | Enrollments with source and excluded flag | `MANAGE_COURSES` | .19 |
| `POST /api/v1/courses/:id/roster` · `DELETE /api/v1/courses/:id/roster/:studentId` | Add a manual enrollment / remove (manual: delete; plan: exclude) | `MANAGE_COURSES` | .19, BR .15 |
| `GET /api/v1/courses/homeroom?schoolId=` | *"Cursos de {grupo}"* for a homeroom teacher | `VIEW_COURSES` + teacher record | .18, BR .16 |
| `GET /api/v1/communication/channels` (COM-003, existing) | The caller's channels with unread counts; filtered by course on the client | `COMMUNICATION_VIEW` | .21–.24, BR .17 |

Side effects: none. Regenerate the dashboard API client (`bun run openapi:orval`) in every slice that changes the API.

## 7. UX
- **Entry points:** sidebar *Cursos* → `/courses`, which shows *Mis cursos* for students and parents and the staff list for others; `/courses/:id`.
- **States:**
  - per section, a skeleton while loading and an inline error with *"Reintentar"* (as in FR-HOM-001.3);
  - an empty list: *"No tienes cursos en este periodo"*;
  - no class group: BR .1;
  - no access: BR .3;
  - a filter with no results: the existing *"No se encontraron cursos"* empty state.
- **Components:** `libs/ui` only: `Card`, `Badge`, `Meter` (progress, category bars), `UiTabs`, `PageHeader`, `StatCard`, `Icon`, `EmptyState`, `Skeleton`, `UiTable`, `Breadcrumbs`. Filter chips use the `libs/ui` `Chip` toggle (`button[uiChip]`), and the course header uses `CourseCover`'s `banner` variant. The *Calificaciones* period control becomes a `libs/ui` primitive too, never one-off markup.
- **Copy:** Spanish. The design canvas is in English and is the layout reference only.

## 8. Non-functional
- **Performance:** `GET /courses/mine` answers in ≤ 600 ms p95 for a student with 12 courses. Averages come from one grouped query per period (as in HOM-001 §8), not one per course.
- **Accessibility:**
  - Each card is one link with an accessible name that summarises it, as in the design (*"Matemáticas, Prof. Ana Rodríguez. Promedio 4.6. Próxima: …"*).
  - Chips and period buttons are toggle buttons with `aria-pressed`.
  - Pills and bands never rely on color alone: each has a text label.
- **Privacy:** these are minors' grades. Parents get no classmates' data (BR .13). Covers are private objects behind presigned URLs.
- **Mobile:** cards stack to one column, and the stats row and chips wrap or scroll horizontally.

## 9. Out of scope
- **Assignment Q&A channels** (the design's `#fractions-worksheet` and the per-assignment question count), and channels closing 3 days after the due date. COM-003 has no assignment channels (Q10).
- Creating, posting to or moderating channels from the course page: that stays in COM-003 (the *Canal* button).
- Support teachers or more than one teacher per course: deferred to its own FRD (decided 2026-11-19, Q5).
- **Switching HOM-001 and COM-002 to the enrollment roster.** They used the study-plan rule, and the two agree except for manual enrollments and exclusions. A follow-up slice in each FRD aligns them: COM-002 in [COM-002-S07](../slices/COM-002-S07-roster-audience.md), since replaced by [COM-003](COM-003-channels-and-direct.md), whose course channels use the roster; HOM-001 still to do.
- The teacher assignment form redesign (step 5 of the plan), and assignment categories, late policy and hand-in modes.
- A teacher's own *Mis cursos* with teaching metrics (to review, attendance), which HOM-001 covers on the home page.

## 10. Open questions
Q1–Q8 answered on 2026-11-19. Q9 and Q10 are open (2026-11-23).
- [x] **Q1: Course roster.** The code had two answers that drift apart.
  - **Stored link.** `Course.students` is written on course creation (`courses.service.ts:112`), on student creation (`students.service.ts:155`) and on a class-group change (`students.service.ts:529`, which *replaces* the student's courses).
  - **Study-plan rule.** HOM-001 and COM-002-S04 derive a course's students from the class groups of its study plan.
  - **The drift.** CSV imports (`imports.service.ts:445`) never link students to courses.

  **Decided:** a stored roster is the source of truth, and admins can add or remove individual students (electives, exemptions), as in BR .15 and FR .19–.20. An explicit `CourseEnrollment` with a source is needed because today's group-change sync would wipe electives. Shared with ASM-001 Q1.
- [x] **Q2: Subject area.** **Decided:** optional free text on `Subject` (BR .14).
- [x] **Q3: Teacher customisation.** **Decided:** teachers set the color and cover of their own courses through the new `CUSTOMIZE_COURSES` permission; admins can override (FR .3, BR .12).
- [x] **Q4: What counts as "done".** **Decided:** BR .7 as written. In-class work counts once its date has passed.
- [x] **Q5: Support teacher.** **Decided:** deferred to its own FRD. One teacher per course.
- [x] **Q6: Channels.** **Decided:** every channel element waits for the COM channels FRD.
- [x] **Q7: Classmates for parents.** **Decided:** parents see teachers only (BR .13).
- [ ] **Q9: "Ask in #general".** In COM-003 only managers post; members can only reply under a post (FR-COM-003.6, BR-COM-003.5). So a student can't start a question. Options:
  - **(a)** the button opens the course's *Conversación del curso* channel, where the student replies under the latest post;
  - **(b)** COM-003 lets members start posts in channels that allow it (a COM-003 change);
  - **(c)** drop the button.

  Blocks S17 only.
- [ ] **Q10: Assignment Q&A channels.** Should an assignment get its own channel (a new `ASSIGNMENT` level in COM-003, closing 3 days after the due date as in the design), or should questions stay in the course channel? This is a COM-003 decision. Until it is made, ACA-001 shows no per-assignment questions.
- [x] **Q6 follow-up (2026-11-23).** COM-003 shipped in #84, so the course channel elements Q6 held back are specified as FR .21–.25.
- [x] **Q8: Teachers opening other courses.** **Decided:** full access to their own courses, plus read-only access to colleagues' courses limited to their **homeroom** group's students (BR .3, .16, FR .18).

## 11. Slices
Listed in build order.

| Slice | Title | FRs | Status |
|---|---|---|---|
| [ACA-001-S01](../slices/ACA-001-S01-course-color-icon.md) | Course color and subject icon on cards and header | .1 .2, BR .11 | Done (#38, #41) |
| [ACA-001-S11](../slices/ACA-001-S11-course-roster.md) | Course roster: `CourseEnrollment`, backfill, plan sync incl. CSV import, all readers switched | .20, BR .15 | Done (#40, #41) |
| [ACA-001-S02](../slices/ACA-001-S02-mis-cursos.md) | Student *Mis cursos*: cards with schedule, teacher, average and period switcher | .4 (part) .5, BR .1 .4 .5 .9 | Done (#64) |
| [ACA-001-S03](../slices/ACA-001-S03-progress.md) | Próxima entrega, progress and stats row | .4 (rest) .6, BR .7 .8 .10 | Done (#65) |
| [ACA-001-S04](../slices/ACA-001-S04-area-chips.md) | Subject areas and filter chips | .2 (area) .7, BR .14 | Done (#68) |
| [ACA-001-S05](../slices/ACA-001-S05-parent-courses.md) | Family view of *Mis cursos* | .8, BR .2 | Done (#69) |
| [ACA-001-S06](../slices/ACA-001-S06-course-page.md) | Course page header, Resumen and Asignaciones with status; course access tightened | .10 .11 .12 .13, BR .3 .6 | Done (#70) |
| [ACA-001-S07](../slices/ACA-001-S07-grades-tab.md) | Calificaciones tab | .14, BR .5 | Done (#71) |
| [ACA-001-S08](../slices/ACA-001-S08-participants.md) | Participantes tab | .15, BR .13 | Done (#72) |
| [ACA-001-S12](../slices/ACA-001-S12-course-roster-admin.md) | Admin manages a course roster (electives, exemptions) | .19, BR .15 | Done (#74) |
| [ACA-001-S13](../slices/ACA-001-S13-homeroom-view.md) | Homeroom teacher's read-only view of colleagues' courses | .18, BR .16 | Done (#75) |
| [ACA-001-S09](../slices/ACA-001-S09-customize-course.md) | Teacher sets color and cover photo | .3, BR .12 | Done (#73) |
| [ACA-001-S10](../slices/ACA-001-S10-graded-status.md) | *"Calificada · n"* status from linked grades | .17 | Done (#63) |
| [ACA-001-S14](../slices/ACA-001-S14-staff-cards.md) | Staff *Cursos* cards: area chip and course name | .9, BR .14 | Done (#82) |
| [ACA-001-S15](../slices/ACA-001-S15-course-channels.md) | Canales tab and Resumen card on the course page | .21 .22, BR .17 .18 .19 | Ready |
| ACA-001-S16 | Unread channel badges on *Mis cursos* cards and the *Nuevo en canales* stat | .23 .24, BR .17 | Proposed |
| ACA-001-S17 | *"Preguntar en #general"* | .25 | Proposed (blocked on Q9) |
