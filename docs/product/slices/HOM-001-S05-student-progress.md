# HOM-001-S05 — Student: KPIs, per-course averages with bands, recent grades, habits

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.2, FR-HOM-001.4 (student), FR-HOM-001.13, FR-HOM-001.16, FR-HOM-001.17; BR-HOM-001.1, .2, .3, .5, .8 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-14) |
| **Branch** | `feat/HOM-001-S05-student-progress` (stacked on S04) |
| **Estimate** | 2–3 days |

## User-visible outcome
"As a student, my home shows my period average and how it moved since last period, my attendance, what I still have to hand in and my unread messages. I see each course's average coloured by my study plan's scale, my latest grades and my habits. The student home now matches the approved design."

## Rules applied
- **Scale** (BR .1): `Student.classGroup.studyPlan.gradeMetric`. Bands are:
  - `EXCELLENT`: score ≥ `minimumExcellence`;
  - `PASSING`: score ≥ `minimumApproval`;
  - `BELOW`: anything lower;
  - none when the plan has no metric. The legend then reads *"Escala de notas no configurada"*.
- **Averages:** per course, the published-score weighted average of the period (same helper as S03). The period average is the mean of the course averages that exist. The change is the difference from the previous period's average, shown when both exist.
- **Courses listed:** the courses the student is enrolled in (`Student.courses`), in the organization. A course with no scored grade shows "—".
- **Recent grades:** the student's 3 most recent scored grades among published grades (by grade date).
- **Attendance:** BR .5 rate over the student's records with session dates from the period start to today, plus `ABSENT` and `LATE` counts.
- **Unread messages:** threads the student participates in whose latest message wasn't sent by them and is newer than their `lastReadAt` (or they never read it), split into teacher threads and broadcasts.
- **Habits** (FR .17): published `HabitEvaluation`s of the student's group in the current period. It shows how many marks are `S`, and lists the habits marked `R` or `X`. Publishing isn't possible from the UI yet (FRD Q11), so the empty state *"Aún no hay hábitos publicados"* is expected for now.
- **Work pending tile:** derived on the client from S04's `GET /home/student/work` (`PENDIENTE` + `VENCIDA`, and how many are due tomorrow).

## Acceptance criteria
```gherkin
Scenario: per-course average on the student's scale
  Given S's study plan uses a metric with pass 3.0, excellence 4.5, maximum 5.0
  And S has published scores in course C averaging 4.0, and an unpublished 1.0 in C
  When S opens /home
  Then "Mis calificaciones" shows C with 4.0 in the passing band
  And the legend shows "Excelencia (4.5+)" and "Aprobado (3.0+)"

Scenario: period average and KPIs
  Then "Promedio del periodo" shows the average "/ 5.0"
  And "Asistencia" shows the period rate with absences and late arrivals
  And "Por entregar" counts pending and overdue work
  And "Mensajes nuevos" counts unread threads

Scenario: recent grades
  Then the 3 most recent published grades are shown with their band

Scenario: no scale
  Given S's study plan has no grade metric
  Then averages show without bands and the legend reads "Escala de notas no configurada"

Scenario: chart placeholder
  Then "Mi progreso" shows a line-chart placeholder marked "Gráfico por desarrollar"
```

## Layers touched
- [x] **Nest `home`:** `GET v1/home/student/progress` returns:
  - `{ studentId, period, previousPeriod, scale, average: { value, previous, delta } }`;
  - `courses: [{ id, name, average, band }]`;
  - `recentGrades: [{ id, title, course, score, band, date }]`;
  - `attendance: { rate, absences, late }`;
  - `messages: { unread, fromTeachers, broadcasts }`;
  - `habits: { total, satisfactory, flagged: [{ name, value }] } | null`.

  Reuses `weightedAverages`, `toThresholds` and `resolvePeriodPair`, with a new `gradeBand` helper.
- [x] **Angular `student-home.ts`:**
  - KPI row with four tiles.
  - "Mis calificaciones" card (`ui-meter` per course, tone by band) with legend and recent-grade badges.
  - "Mi progreso" card (`ui-chart-placeholder`, line) with the habits summary.
  - *"Ver informe completo"* links to `/students/:id/grade-report`.
  - Removes the old grade-report, legacy messages and newsletter cards. `RecentBroadcasts` stays as the "Avisos" card.
- [x] **Tests:**
  - Nest unit tests: bands and no-scale; course list with and without averages; period average and delta; unpublished excluded by query; recent grades; attendance window; unread split; habits; scope (no student record → 403).
  - Playwright `@FR-HOM-001.13`, `@FR-HOM-001.16`.

## Out of scope for this slice
- The real progress chart (placeholder only).
- Publishing habits (FRD Q11).

## Done checklist
- [x] Acceptance criteria pass: unit (`home/student-home.service.spec.ts`, `home/home-helpers.spec.ts`) and Playwright `@FR-HOM-001.2/.13/.16/.17` (2 tests, `apps/web-dashboard-e2e/src/home/student-progress.spec.ts`; full suite 22/22). The "no scale" scenario and the attendance/messages tile values are covered at unit level only (other specs change them in e2e)
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
