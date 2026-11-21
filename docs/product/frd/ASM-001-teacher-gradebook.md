# ASM-001 — Teacher gradebook

| | |
|---|---|
| **Status** | Ready (open questions answered 2026-11-19) |
| **Context** | ASM — Assessment (see [capabilities](../capabilities.md#asm-assessment)) |
| **Owner** | — |
| **Last updated** | 2026-11-20 |
| **Related** | Design canvas "Skooltrak — Courses redesign (desktop)", board *Teacher — Gradebook* (claude.ai/artifact/MGaGctNuxxJd1rouLSYTaa) · [ACA-001](ACA-001-course-experience.md) (course page, student grades tab) · [HOM-001](HOM-001-persona-home-dashboards.md) (grade thresholds, published-only, teacher scope) · current code: `apps/web-dashboard/src/app/teacher/teacher-gradebook.ts` (mock), `grades/course-grades.ts`, `grades/grades-form.ts`, `grades/student-grade-form.ts`; `apps/dashboard-backend/src/app/grades/`, `student-grades/`, `grade-buckets/` |

## 1. Problem & outcome
Teachers can't enter grades efficiently today.
- *Libro de calificaciones* in the sidebar (`/teacher/gradebook`) shows **hard-coded sample data**.
- The real grid on the course page (`course-grades.ts`) is read-only. Each score is typed into a modal, one student at a time (`student-grade-form.ts`).
- There is no "excused" mark. A score that is changed after publishing leaves no trace: `StudentGradeRevision` exists but nothing writes to it.
- Until 2026-11-20, none of the grade endpoints checked permissions or ownership (Q10). Fixed in S01: #32 on 2026-11-20, and #33 on 2026-11-21 (it reached `main` via #43).

When this ships, a teacher grades a whole column from the keyboard. They see each student's weighted average and status update as they type, save a draft, and publish when ready. Families see only published grades. Every change after publishing is kept in a history.

**Success metric:** *proposal:* the median time from a grade column's `date` to `published` drops below 7 days. This matches the existing unpublished-grades reminder; measure it from `Grade.date` and the publish time, which needs a `publishedAt` (S04).

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| Teacher | Open the gradebook of their courses, enter and save scores, excuse, comment, publish, see history, export, add columns | `MANAGE_GRADES` (+ `VIEW_GRADES`) | Own courses (BR-HOM-001.7) |
| School admin | Same, for any course | All (admins pass every check) | Organization |
| Student, parent | Never see the gradebook. They read published grades through ACA-001 FR .14 and the existing grade views | `VIEW_GRADES` | Self / linked children |

## 3. Functional requirements
- **FR-ASM-001.1**: A teacher opens **Libro de calificaciones** from the course page tab, or from the sidebar (`/teacher/gradebook`). The sidebar page opens the course last graded, with a course switcher at the top; on a first visit it shows the picker (decided 2026-11-19, Q8). An admin opens it from any course page.
- **FR-ASM-001.2**: The grid shows one row per enrolled student of the selected class group (roster: [ACA-001](ACA-001-course-experience.md) BR .15), ordered by first name. A group selector appears when the course's enrolled students span more than one group; a manually enrolled student appears under their own group.
  - **Columns:** the course's grades for the period, grouped by bucket. Each group header shows the bucket's name and weight (*"Trabajo diario · 40 %"*). Each column header shows the grade's title and date, and *"Borrador"* while unpublished.
  - **Last columns:** **Promedio** and status (BR .5).
  - **Footer:** *"Promedio del grupo"* per column and overall.
- **FR-ASM-001.3**: A period switcher lists the periods of the school's current year and defaults to the current period (BR-HOM-001.3).
- **FR-ASM-001.4**: Every cell is an input.
  - **Enter** or **Tab** moves to the next student in the same column; **Shift+Tab** moves back.
  - Typing **EX** excuses the student (BR .3).
  - Changed cells are highlighted until saved. Invalid cells are outlined in the danger tone with the reason (BR .2).
  - A legend reads *"Escala {min}–{max} · nota mínima {pass} · escribe EX para exentar · Tab pasa al siguiente estudiante"*.
- **FR-ASM-001.5**: Student averages, statuses and the footer recalculate as the teacher types, from unsaved and draft values (BR .4, .6).
- **FR-ASM-001.6**: **Guardar borrador** saves every changed cell (score, excused, comment) in one request. **Descartar** reverts to the last saved state.
  - The bar shows *"{n} cambios sin guardar"*, *"{n} valores inválidos"* or *"Guardado"*. Saving is disabled while any value is invalid.
  - Leaving the page with unsaved changes asks for confirmation.
- **FR-ASM-001.7**: **Publicar calificaciones** saves pending changes, then asks which draft columns to publish. Columns changed in this session are pre-ticked. Publishing makes the chosen columns visible to students and parents, and sends the existing *published grade* notifications (`grades.service.ts:131`).
- **FR-ASM-001.8**: Selecting a cell opens a side panel with:
  - the student, column and bucket;
  - the value and its band badge;
  - an editable comment, saved with the draft;
  - the cell's history: who changed it, when, and from what to what.
- **FR-ASM-001.9**: Changing a **published** score keeps the new value visible to students and parents as soon as it is saved, and writes a revision (BR .8).
- **FR-ASM-001.10**: The teacher sees *"EX"* in excused cells. Students and parents see *"Exenta"* (ACA-001 FR .14, .17).
- **FR-ASM-001.11**: **Nueva calificación** opens the existing grade form (title, bucket, date). It can optionally be linked to one of the course's assignments, and the column then takes that assignment's title and date (BR .11).
- **FR-ASM-001.12**: *"Buscar estudiante"* filters rows by name or student code.
- **FR-ASM-001.13**: **Exportar** downloads a CSV of the current group and period: student, code, one column per grade, the average and the status. Excused cells are written as `EX`.
- **FR-ASM-001.14**: When a published score is below the pass mark, the homeroom teacher of the student's group gets an in-app notification, once per student and grade (BR .12).
- **FR-ASM-001.15**: Every existing grade, student-grade and grade-bucket endpoint enforces permission, organization and ownership (BR .1, .13).

## 4. Business rules
- **BR-ASM-001.1**: **Scope.**
  - Teachers may use the gradebook only for courses they teach (BR-HOM-001.7); admins for any course in their organization.
  - Otherwise the API returns `403 Solo puedes calificar tus propios cursos`, and the UI shows the error state.
  - A course in another organization is refused the same way.
- **BR-ASM-001.2**: **Valid value.** A cell is valid when it is:
  - empty;
  - `EX` (any case);
  - or a number within [`GradeMetric.minimum`, `GradeMetric.maximum`] of the course's study plan, with at most one decimal (decided 2026-11-19, Q7).

  The API rejects the **whole** save with `400`, listing each invalid cell. If the plan has no grade metric, cells are read-only with *"Escala de notas no configurada"* (BR-HOM-001.1).
- **BR-ASM-001.3**: **Excused.** An excused cell has `excused = true` and no score. It is left out of every average, both numerator and weight. A request with both a score and `excused` gets `400`.
- **BR-ASM-001.4**: **Average** *(decided 2026-11-19, Q2)*. One formula for the whole product: the API, home pages, grade report and every UI.
  1. For each bucket, take the mean of the student's scored cells.
  2. Weight those means: Σ(mean_b × weight_b) ÷ Σ weight_b, over the buckets that have at least one scored cell.

  Empty and excused cells are skipped. A student with no scored cell has no average (*"Sin notas"*). Example: Daily work 40 % (4, 4, 4, 4) and Tests 60 % (2) give **2.8**. Today's per-score weighting gives 3.5, and the current grid's unweighted mean (`course-grades.ts:185`) gives 3.6.
- **BR-ASM-001.5**: **Status band** *(decided 2026-11-19, Q3)*:
  - *"En riesgo"*: average < `minimumApproval`;
  - *"Atención"*: average < `minimumApproval` + 0.5;
  - *"Al día"*: otherwise.

  These match the design's At risk / Watch / On track.
- **BR-ASM-001.6**: **Drafts.**
  - Unpublished columns are never visible to students or parents (BR-HOM-001.2).
  - The teacher's averages include drafts, and the *Promedio* header then reads *"Incluye borradores"*.
- **BR-ASM-001.7**: **Conflicting edits.**
  - Each saved cell carries the `updatedAt` it was loaded with.
  - If any of those rows changed since, the whole save is refused with `409` and the cells concerned.
  - The UI keeps the teacher's values, shows *"Otra persona cambió estas notas; revisa antes de guardar"*, and reloads only those cells' saved values.
- **BR-ASM-001.8**: **Revisions.**
  - Saving a change to a cell whose column is published writes one `StudentGradeRevision`, in the same transaction, with the previous and new value, the excused flag, the author, the time and a **required reason** *(decided 2026-11-19, Q5)*.
  - The reason must be 3–300 characters. A save that changes a published cell without one is refused with `400 Indica el motivo del cambio`.
  - In the UI, saving asks once for a reason covering every changed published cell. The side panel can set a different reason for a single cell.
  - Changes to draft columns write no revision.
  - Revisions are never edited or deleted.
- **BR-ASM-001.9**: **Publishing** stamps `publishedAt` and the publisher, and is one-way from the gradebook. **Unpublishing is for admins only** *(decided 2026-11-19, Q6)*: a teacher setting `published: false` gets `403 Solo un administrador puede despublicar calificaciones`. Unpublishing clears `publishedAt`, writes no revisions and sends no notification.
- **BR-ASM-001.10**: **Rows.**
  - A missing (`gradeId`, `studentId`) row is created on first save. The pair becomes unique, and duplicates are merged in the migration, keeping the most recently updated row.
  - Students who leave the roster keep their rows, but only rows for the current roster are shown.
- **BR-ASM-001.11**: **Assignment link.**
  - The assignment must belong to the same course and organization (`400` otherwise).
  - An assignment links to at most one grade (`409 Esta asignación ya tiene una calificación`).
  - Deleting the assignment clears the link and keeps the grade.
- **BR-ASM-001.12**: **Homeroom alert.**
  - Sent on publish, or on saving a published cell, when the score is below `minimumApproval`.
  - It goes to `ClassGroup.teacher` of the student's group, unless that is the grading teacher.
  - It is sent at most once per (student, grade), even if the score changes again.
- **BR-ASM-001.13**: **Endpoint scope** (fixes Q10).
  - **Reads** require `VIEW_GRADES`. Students get only their own rows, parents only their linked children's, and homeroom teachers only their homeroom group's students in other teachers' courses (published only, ACA-001 BR .16). Any other `studentId` gets `403`.
  - **Writes** require `MANAGE_GRADES` plus BR .1.
  - Every query filters by the caller's `organizationId`.
  - Students and parents never receive unpublished grades.
- **BR-ASM-001.14**: **Comment** at most 500 characters (`400`). It is visible to the student and parents once the column is published.

## 5. Data
- **`StudentGrade`:**
  - `excused Boolean @default(false)` (S05);
  - `@@unique([gradeId, studentId])`, with a migration that merges duplicates (S03).
- **`StudentGradeRevision`:** add `previousScore Decimal?`, `excused Boolean`, `changedById String?` (relation to `User`); keep `reason String` required; make `score` nullable (S04).
- **`Grade`:**
  - `publishedAt DateTime?`, `publishedById String?` (S04);
  - `assignmentId String? @unique` (relation to `Assignment`, `onDelete: SetNull`) (S06).
- **`Notification`** (existing) for the homeroom alert (S08).
- **Tenancy:** every query is filtered by `organizationId`, via `Course.organizationId`, plus BR .1 and .13.
- **Audit:** revisions are the audit trail for published scores. Publish actions record `publishedById`.

## 6. API surface
New module `gradebook` (ASM).

| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `GET /api/v1/gradebook/courses` | Teacher's courses for the picker (admins: the school's) | `MANAGE_GRADES` | .1 |
| `GET /api/v1/gradebook/:courseId?periodId=&classGroupId=` | Metric, buckets, columns, rows, cells (+ `updatedAt`), averages | `MANAGE_GRADES` | .2 .3 .5 |
| `PUT /api/v1/gradebook/:courseId/cells` | Bulk save `{ periodId, reason?, cells: [{ gradeId, studentId, value, comment, reason?, updatedAt }] }` | `MANAGE_GRADES` | .4 .6 .9 .10 |
| `POST /api/v1/gradebook/:courseId/publish` | Publish `{ gradeIds }` | `MANAGE_GRADES` | .7 |
| `GET /api/v1/gradebook/cells/:studentGradeId/history` | Revisions | `MANAGE_GRADES` | .8 |
| `GET /api/v1/gradebook/:courseId/export?periodId=&classGroupId=` | CSV | `MANAGE_GRADES` | .13 |
| `POST /api/v1/grades` (existing) | Create column; gains `assignmentId` | `MANAGE_GRADES` | .11 |
| `GET` / `POST` / `PATCH` / `DELETE` `/api/v1/grades*`, `/student-grades*`, `/grade-buckets*` (existing) | Tightened | per BR .13 | .15 |

Side effects: published-grade emails (existing) and the homeroom in-app notification (S08).

## 7. UX
- **Entry points:**
  - the course page tab *Libro de calificaciones*, which replaces today's read-only *Calificaciones* grid for staff;
  - the sidebar *Libro de calificaciones* (`/teacher/gradebook`), which replaces the mock.

  *Ponderación* (weights) stays as its own tab.
- **States:**
  - a skeleton grid while loading;
  - no columns: *"Aún no hay calificaciones en este periodo"* with *Nueva calificación*;
  - no metric: BR .2;
  - no access: BR .1;
  - a save error: an inline banner that keeps the teacher's values;
  - a conflict: BR .7.
- **Components:** `libs/ui` only: `UiTable` (sticky first column and header), `UiInput`, `Button`, `Badge`, `UiTabs`, `Modal`, `ConfirmationDialog`, `UiField`, `Toast`, plus a side-panel layout. Cell states use the existing tone tokens (action / danger / success), never raw palette colors.
- **Copy:** Spanish. The canvas is the layout reference only.

## 8. Non-functional
- **Performance:**
  - Loading a group of 40 students × 30 columns takes ≤ 500 ms p95.
  - A bulk save of up to 1,200 cells runs in one transaction, ≤ 1 s p95.
  - Recalculation as the teacher types is client-side, with no request per keystroke.
- **Accessibility:**
  - The grid is a real `<table>` with header associations.
  - Every input has the accessible name *"{estudiante}, {columna}"*, as in the design.
  - Invalid state uses `aria-invalid` plus text, never color alone.
  - Keyboard-only grading works end to end.
- **Privacy:** these are minors' grades. Keep scores and comments out of logs; errors log ids only. The CSV is generated on demand and never stored.
- **Reliability:** an unsaved draft survives an accidental reload through per-viewer local storage, keyed by course, period and group. It is restored with *"Recuperamos cambios sin guardar"*.

## 9. Out of scope
- The assignment form redesign, including *"counts toward the average"* when creating an assignment (step 5 of the plan). Linking happens from the gradebook here (FR .11).
- A per-cell or per-column *"Avisar a la familia al publicar"* toggle. Publishing always notifies the student and every parent (decided 2026-11-19, Q4). Translating comments waits for COM translation.
- Locking a period after its end date, grade appeals, and approval of grade changes.
- Habit evaluations and quizzes in the gradebook.

## 10. Open questions
All answered on 2026-11-19.
- [x] **Q1: Roster.** **Decided:** a stored roster with electives and exemptions, specified in [ACA-001](ACA-001-course-experience.md) BR .15 and built in ACA-001-S11, which comes before S02.
- [x] **Q2: Average formula.** **Decided:** weight each bucket's mean (BR .4). This changes figures on the home pages, the grade report and today's course grid; built in S09.
- [x] **Q3: "Atención" band.** **Decided:** pass mark + 0.5 (BR .5).
- [x] **Q4: Per-cell family notice.** **Decided:** no toggle. Publishing always notifies the student and parents.
- [x] **Q5: Reason for changes to published scores.** **Decided:** required (BR .8).
- [x] **Q6: Unpublishing.** **Decided:** admins only (BR .9), enforced in S01.
- [x] **Q7: Decimals.** **Decided:** one decimal (BR .2).
- [x] **Q8: Sidebar entry.** **Decided:** open the course last graded, with a switcher (FR .1).
- [x] **Q10: Unprotected grade endpoints (security).** `grades.controller.ts`, `student-grades.controller.ts` and `grade-buckets.controller.ts` have no `@RequirePermissions`, and the global `PermissionsGuard` lets such routes through (`libs/auth/src/lib/auth.guard.ts:200`). Their services don't filter by organization. Any signed-in user, including a student, can call `PATCH /api/v1/student-grades` with any id and score, and read any student's grades via `GET /student-grades/by-course/:courseId?studentId=`. Established from code, not reproduced against a running app. **Decided:** fix in S01 as a standalone PR, ahead of the rest. **Fixed** in #32 on 2026-11-20 (grade, student-grade and bucket endpoints) and in #33 (`/students/:id/grades` and `/students/:id/average-score`), which reached `main` via #43 on 2026-11-21.

## 11. Slices
Listed in build order.

| Slice | Title | FRs | Status |
|---|---|---|---|
| [ASM-001-S01](../slices/ASM-001-S01-lock-down-grade-endpoints.md) | Lock down grade, student-grade and bucket endpoints; unpublish for admins only | .15, BR .9 .13 | Done (#32, #33 via #43) |
| [ASM-001-S09](../slices/ASM-001-S09-one-average-formula.md) | One average formula everywhere (API, home pages, grade report, course grid) | BR .4 | In review (#48) |
| ASM-001-S02 | Gradebook grid, read-only: columns by bucket, averages, bands, group and period switchers; replaces the mock | .1 .2 .3 .5, BR .1 .4 .5 .6 | Proposed (after ACA-001-S11, S09) |
| ASM-001-S03 | Inline entry, validation and bulk save draft | .4 .6, BR .2 .7 .10 | Proposed |
| ASM-001-S04 | Publish, revisions with a required reason, side panel with comment and history | .7 .8 .9, BR .8 .9 .14 | Proposed |
| ASM-001-S05 | Excused (EX) | .10, BR .3 | Proposed |
| ASM-001-S06 | Columns linked to assignments | .11, BR .11 | Proposed |
| ASM-001-S07 | Find student and CSV export | .12 .13 | Proposed |
| ASM-001-S08 | Homeroom alert for scores below the pass mark | .14, BR .12 | Proposed |
