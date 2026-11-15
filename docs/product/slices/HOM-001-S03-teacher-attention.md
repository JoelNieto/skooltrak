# HOM-001-S03 — Teacher: students needing attention, family messages, average KPI

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.2, FR-HOM-001.4 (teacher), FR-HOM-001.7 (average + messages tiles), FR-HOM-001.8 (messages row), FR-HOM-001.10, FR-HOM-001.11; BR-HOM-001.1, .2, .11, .13 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-14) |
| **Branch** | `feat/HOM-001-S03-teacher-attention` (stacked on S02) |
| **Estimate** | 3 days |

## User-visible outcome
"As a teacher, my home tells me which of my students are struggling and why: low average in my course against their study plan's pass mark, absences, lateness, or a drop since last period. It shows the family messages I haven't answered, and my courses' average. The teacher home now matches the approved design."

## Rules applied
- **Course average** (same formula as `grades.service.ts:getAverageScoreForStudent`): mean of the student's scores in the course's **published** grades of the period, weighted by the grade bucket's weight. Unlike that method, a student with no scored grade has **no** average (null), not 0.
- **Thresholds** (BR .1): from `Course.studyPlan.gradeMetric`. A course without a metric adds nothing to "below the pass mark" and is counted in `coursesWithoutScale`.
- **Average tile:** the mean of the student averages across the teacher's courses. A value is shown only when every course with averages uses the same scale (`maximum`). Otherwise it shows "—", but the below-pass count still shows.
- **Needs attention** (BR .11, teacher view; up to 5, most reasons first, then lowest average). A student qualifies with any of:
  - an average below `minimumApproval` in one of the teacher's courses;
  - ≥ 3 `ABSENT` this week in the teacher's classes;
  - ≥ 3 `LATE` this week in the teacher's classes;
  - an average that dropped ≥ 0.5 from the previous period in one of the teacher's courses.

  Only active students of the teacher's related groups who are enrolled in the course count.
- **Unanswered family thread** (BR .13): a non-broadcast `ACTIVE` thread the teacher participates in, whose latest non-deleted message was sent by a user with the `PARENT` role. It is highlighted when older than 48 h, and *unread* when newer than the teacher's `lastReadAt`. Previews are cut to 140 characters.

## Acceptance criteria
```gherkin
Scenario: a student below the pass mark of their study plan
  Given T's course belongs to a study plan whose grade metric has minimumApproval 3.0 and maximum 5.0
  And student S has a weighted average of 2.4 in T's published grades this period
  When T opens /home
  Then "Necesitan atención" lists S with "Matemáticas 2.4"
  And "Promedio de mis cursos" shows the average "/ 5.0" with "1 estudiante bajo la nota mínima"

Scenario: unpublished grades don't count
  Given S's only low score is in an unpublished grade
  Then S is not listed for that course

Scenario: no grade metric
  Given T's course's study plan has no grade metric
  Then no "below the pass mark" reason is shown for that course
  And the tile hint says the scale is not configured

Scenario: absences and lateness this week
  Given S has 3 ABSENT records this week in T's classes
  Then S is listed with "3 ausencias"

Scenario: unanswered family message
  Given a parent's message is the latest in a thread with T
  Then "Mensajes de acudientes" lists it with sender, time and preview
  And the tile and "Pendientes" show "Responder 1 mensaje"
  When T replies
  Then it is no longer listed

Scenario: chart placeholder
  Then "Distribución de calificaciones" shows a placeholder marked "Gráfico por desarrollar", with no data

Scenario: scope
  Given a student of another teacher's course with low grades
  Then they are not listed on T's home
```

## Layers touched
- [x] **Nest `home`:**
  - `summary` gains:
    - `average: { value, max, studentsBelowPass, coursesWithoutScale }`;
    - `familyMessages: { unanswered, stale }`.
  - New `GET v1/home/teacher/attention?schoolId=` returns:
    - `students: [{ id, name, classGroup, worstAverage, reasons: [{ kind: 'BELOW_PASS'|'ABSENCES'|'LATE'|'DROP', course?, value }] }]`;
    - `threads: [{ id, title, senderName, lastMessageAt, preview, unread, stale }]`.
  - Shared private helpers: `courseAverages(ctx, periodIds)` (one `studentGrade.findMany` over published scored grades of the teacher's courses) and `unansweredThreads(ctx)`.
  - Uses `resolveCurrentPeriod` and the previous period (the one ending just before the current one).
- [x] **`libs/ui`:** new `ui-chart-placeholder` primitive with title, chart kind, description and a decorative skeleton (`bars` | `line`). It is marked *"Gráfico por desarrollar"*, has `role="img"` with an `aria-label`, and gets a story and a spec.
- [x] **Angular `teacher-home.ts`:**
  - "Promedio de mis cursos" and "Mensajes de acudientes" tiles.
  - "Responder N mensajes" row in "Pendientes".
  - "Necesitan atención" card beside the week card.
  - Grade-distribution placeholder and "Mensajes de acudientes" card.
  - Removes the old messages (`/api/v1/messages`) and newsletters cards: the teacher's newsletters remain at `/newsletters`.
- [x] **Tests:**
  - Nest unit tests: weighted average and null-without-scores; threshold from the plan metric; no-metric; mixed scales → no value; each attention reason; scope (other teachers' courses excluded); ranking; unanswered/stale/unread threads; parent-vs-teacher last sender.
  - Playwright `@FR-HOM-001.10`, `@FR-HOM-001.11`. Fixtures add:
    - a grade metric on the teacher's study plan, and a published low grade for one related student;
    - a STUDENT_GUARDIANS thread whose last message is from a seeded parent.

## Out of scope for this slice
- The real grade-distribution chart (placeholder only).
- Replying from the home (the row links to `/teacher/communication`).

## Done checklist
- [x] Acceptance criteria pass: unit (`home/*.spec.ts`, `libs/ui` `chart-placeholder.spec.ts`) and Playwright `@FR-HOM-001.2/.8/.10/.11` (2 tests, `apps/web-dashboard-e2e/src/home/teacher-attention.spec.ts`; the full suite was run by the user). The "no grade metric", "absences and lateness" and "scope" scenarios are covered at unit level only
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
