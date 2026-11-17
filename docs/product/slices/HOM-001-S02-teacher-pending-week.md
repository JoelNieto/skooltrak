# HOM-001-S02 — Teacher: Pendientes, period-close banner, this week's assignments

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.5 (teacher), FR-HOM-001.7 (submissions tile), FR-HOM-001.8 (partial: submissions, grade cells, unpublished grades), FR-HOM-001.9; BR-HOM-001.2, .3, .7; Q4 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-15) |
| **Branch** | `feat/HOM-001-S02-teacher-pending` (stacked on S01) |
| **Estimate** | 3 days |

## User-visible outcome
"As a teacher, my home tells me how many submissions I still have to review, which courses have missing or unpublished grades, and how close the period close is. I see this week's assignments with how many students have handed in. I can mark a submission as reviewed."

## New rule
**BR-HOM-001.17 — Submission review state (Q4):**
- `AssignmentSubmission.reviewedAt` is null until the teacher of the assignment's course, or an org admin, marks it reviewed. *"Por revisar"* means `reviewedAt IS NULL`.
- A student re-submitting replaces the submission row (`assignment-submissions.service.ts`, delete + create), so a re-submission is "to review" again.
- Marking needs `MANAGE_ASSIGNMENTS`. A teacher may only mark submissions of their own courses. Otherwise the API returns `403 Solo el docente del curso puede revisar esta entrega`. A submission outside the caller's organization returns `404`.

## Acceptance criteria
```gherkin
Scenario: submissions to review
  Given 3 submissions to T's assignments, 1 of them already marked reviewed
  When T opens /home
  Then the "Entregas por revisar" tile shows 2 with how many assignments they belong to
  And "Pendientes" shows "Revisar 2 entregas"

Scenario: mark a submission reviewed
  Given T opens an assignment of their course and its submissions list
  When T clicks "Marcar revisada" on a submission
  Then it shows "Revisada" and the home count drops by 1
  When T clicks "Quitar revisión"
  Then it is "to review" again

Scenario: another teacher's submission
  When T calls PATCH /api/v1/assignment-submissions/:id/review for a submission of another teacher's course
  Then the API responds 403 and reviewedAt is unchanged

Scenario: grade cells and unpublished grades this period
  Given the current period has 2 grades in T's course with 3 enrolled students, one grade with 1 score and unpublished
  Then "Pendientes" shows "Completar notas en 1 curso" with "5 casillas vacías"
  And "Publicar 1 calificación" for that course

Scenario: no current period
  Given no period of the school year exists
  Then the grade rows and the period banner are not shown

Scenario: period close banner
  Given the current period ends in 10 days
  Then a banner shows "Cierre del <period> en 10 días" with the number of T's courses with missing grades
  Given it ends in 20 days
  Then no banner is shown

Scenario: this week's assignments with progress
  Given an assignment of T's course due this week for group G (3 students enrolled), with 2 submissions
  Then "Asignaciones de la semana" lists it with its type and due date and "2/3 entregaron"
  And an assignment with requireSubmission = false shows "Sin entrega en línea"
  And assignments of other teachers' courses are not listed

Scenario: nothing pending
  Given all counts are zero
  Then "Pendientes" shows "Todo al día"
```

## Layers touched
- [x] **Prisma migration** `add_submission_reviewed_at`: `AssignmentSubmission.reviewedAt DateTime?`, plus an index on (`assignmentId`, `reviewedAt`).
- [x] **Nest `assignment-submissions`:** `PATCH v1/assignment-submissions/:id/review` with body `{ reviewed: boolean }` and `@RequirePermissions(Perm.MANAGE_ASSIGNMENTS)`. It enforces BR .17 and returns `{ id, reviewedAt }`. `getStudentsForAssignment` already returns full submissions, so `reviewedAt` comes through.
- [x] **Nest `home`:**
  - `summary` gains:
    - `toReview: { submissions, assignments, oldestSubmittedAt, top: { assignmentId, title, courseName, count } | null }`;
    - `grades: { periodId, emptyCells, coursesWithEmptyCells, unpublished, coursesWithUnpublished, totalCourses, topCourseId } | null` (null when there's no current period);
    - `periodClose: { name, endDate, daysLeft } | null` (when 0 ≤ days left ≤ 14).
  - New `GET v1/home/teacher/week?schoolId=` returns `{ timezone, weekStart, weekEnd, items: [{ assignmentId, title, type, requireSubmission, course, classGroup, dueAt, submitted, expected }] }`. It is built from `AssignmentDate` rows dated in the school-local week, for the teacher's courses and related groups.
  - Expected students = students of that group enrolled in that course. Submitted = those with a submission.
  - Uses grouped and filtered-count queries (no N+1).
  - New helper `localMidnight(date, tz)` turns local day boundaries into UTC instants for `DateTime` columns.
- [x] **`libs/ui`:** new `ui-meter` primitive: a label plus a native `<progress>` (DaisyUI `progress`, tones `action | success | warning | danger`), with a Storybook story and a spec.
- [x] **Angular:** (also fixes an existing crash: the submissions list called `toLocaleDateString` with `timeStyle`, which throws, so the list broke whenever a submission existed)
  - `teacher-home.ts`:
    - "Entregas por revisar" tile.
    - Period banner using `uiAlert`.
    - "Pendientes" card with link rows that hide zero counts; empty state *"Todo al día"*.
    - "Asignaciones de la semana" card using `ui-meter`. It replaces the old school-wide list built on `/assignments/by-school` (FRD Q8), which the home no longer calls.
  - `assignment-submissions-list.ts`: a *Revisada* badge and a *"Marcar revisada" / "Quitar revisión"* button per submission.
- [x] **Tests:**
  - Nest unit tests:
    - review endpoint: own course OK; other teacher's course 403; another org 404; admin OK; unreview;
    - summary counts;
    - week progress (expected and submitted per group, other teachers excluded);
    - banner window;
    - `localMidnight`.
  - Playwright `@FR-HOM-001.7`, `@FR-HOM-001.8`, `@FR-HOM-001.9`: fixtures add a current period ending in 10 days, an assignment due this week with a student submission, and a grade with missing scores.

## Out of scope for this slice
- "Pendientes" rows for unpublished habit evaluations and unscheduled quizzes: the app can't do either today (FRD Q11, Q12).
- The unanswered-family-messages row and tile (S03).
- Showing a reviewed state to students.

## Done checklist
- [x] Acceptance criteria pass: unit (`home/*.spec.ts`, `assignment-submissions/assignment-submission-review.spec.ts`, `libs/ui` `meter.spec.ts`) and Playwright `@FR-HOM-001.5/.7/.8/.9` (3 tests, `apps/web-dashboard-e2e/src/home/teacher-pending.spec.ts`). The "no current period", "20 days → no banner" and "Todo al día" scenarios are covered at unit level only
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
