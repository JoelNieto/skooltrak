# ASM-001-S02 — Gradebook grid, read-only

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.1, .2, .3, .5 (read-only), BR-ASM-001.1, .4, .5, .6 |
| **Status** | Done: #51 (2026-11-21) |
| **Branch** | `feat/ASM-001-S02-gradebook-grid` |
| **Estimate** | 3 days |

## User-visible outcome
"As a teacher, I open *Libro de calificaciones* from my course or the sidebar. I see one row per student of a group and the period's grades grouped by category with their weight, plus each student's average and status (*En riesgo*, *Atención*, *Al día*) and the group's averages. No more sample data."

Scores are still entered as today: the column header opens the grade page. Inline entry comes in S03.

## Acceptance criteria
```gherkin
Scenario: the course tab shows the gradebook
  Given teacher T teaches course C, and group G has students on C's roster
  When T opens C and the tab "Libro de calificaciones"
  Then the grid shows one row per student of G on the roster, ordered by first name
  And the period's columns grouped under "<bucket> · <weight> %", each with its title and date
  And "Borrador" on unpublished columns
  And the columns "Promedio" and "Estado", and a footer row "Promedio del grupo"

Scenario: averages and status
  Given the plan's pass mark is 3.0
  Then each student's "Promedio" follows BR .4, drafts included
  And "Estado" reads "En riesgo" below 3.0, "Atención" below 3.5, otherwise "Al día"
  And a student with no scored cell shows "Sin notas" and no status
  And when a draft column has a score, the "Promedio" header reads "Incluye borradores"

Scenario: period and group switchers
  Given the school's current year has several periods
  Then the period switcher defaults to the current period (BR-HOM-001.3)
  And a group switcher appears only when C's roster spans more than one group

Scenario: sidebar entry
  Given T graded course C most recently
  When T opens "Libro de calificaciones" in the sidebar
  Then the gradebook of C opens, with a course switcher listing T's courses
  And on a first visit, with nothing graded yet, T picks a course from a list

Scenario: another teacher's course
  Given teacher T does not teach course D
  When T requests D's gradebook
  Then the API answers 403 "Solo puedes calificar tus propios cursos"
  And the page shows that message
```

## Decisions made in this slice
These fill gaps the FRD leaves open; each is easy to change.
- **Footer:** a column's group average is the mean of its scored cells. The overall group average is the mean of the students' averages (students without one are left out).
- **Status uses the shown average:** the band (BR .5) is taken from the average rounded to one decimal, so a "3.0" never reads *En riesgo*.
- **"Last graded" course:** the course with the most recent change to one of its grades or scores. Ties and never-graded courses are ordered by name.
- **Students without a group** (a manual enrollment of a student with no class group) are listed under *Sin grupo* in the group switcher.
- **No grade metric:** scores and averages still show; status is blank and the grid shows *"Escala de notas no configurada"* (BR-HOM-001.1).
- **Buckets without a column in the period** are not shown. Buckets keep the order they were created in; columns are ordered by date, then title.

## Layers touched
- [x] **Shared** (`libs/shared`): `gradeStatus(average, passMark)` for BR .5, `meanOf(values)`, next to `courseAverage`. S03 reuses them to recalculate as the teacher types.
- [x] **Nest** (`apps/dashboard-backend/src/app/gradebook`, new module):
  - `GET /api/v1/gradebook/courses?schoolId=`: the caller's courses (admins: the school's), most recently graded first, with `lastGradedAt`.
  - `GET /api/v1/gradebook/:courseId?periodId=&classGroupId=`: metric, periods of the school's current year, groups on the roster, buckets with columns, rows with cells (+ `updatedAt`), averages, statuses and the footer. Defaults: current period, first group by name.
  - Both `@RequirePermissions(Perm.MANAGE_GRADES)`; the course endpoint calls `GradeAccessService.assertCanWriteCourse` (BR .1: organization, then teacher of the course or admin).
  - Rows: students on the roster (`enrolledIn`, ACA-001 BR .15) with `enrollmentStatus` ACTIVE. Duplicated (grade, student) rows (unique from S03): the most recently updated one wins.
- [x] **OpenAPI:** `bun run openapi` (new `gradebook` tag).
- [x] **Angular:**
  - `gradebook/gradebook-grid.ts`: switchers, the grid (a real `<table>`, sticky first column, two header rows with `scope`), skeleton, empty (*"Aún no hay calificaciones en este periodo"* + *Nueva calificación*), no-metric and error states.
  - The course page tab *Calificaciones* becomes *Libro de calificaciones* for staff and shows the grid. It replaces `grades/course-grades.ts`, which is deleted. *Nueva calificación* and the column link to the grade page stay until S03 / S06.
  - `/teacher/gradebook` (`gradebook/gradebook-page.ts`) replaces the mock `teacher/teacher-gradebook.ts`: course switcher, last graded course, picker on a first visit; `?course=` keeps the choice in the URL. The sidebar entry reads *Libro de calificaciones*.
- [x] **Tests:**
  - Shared: BR .5 bands, including the edges and the rounding rule.
  - Nest: rows on the roster only and ordered by first name, the group filter, bucket grouping, averages, drafts flag, footer, default period, 403 for another teacher's course and another organization's course.
  - Playwright `@FR-ASM-001.2 @BR-ASM-001.5`: the course tab grid with the seeded scores; `@FR-ASM-001.1`: the sidebar opens the teacher's course; `@BR-ASM-001.1`: the other teacher's course is refused. The S09 average spec moves to the new grid.

## Out of scope for this slice
- Entering scores in the grid, saving drafts, conflicts (S03).
- Publishing from the gradebook, comments, history (S04); excused cells (S05).
- *Nueva calificación* linked to an assignment (S06); search and CSV export (S07).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
