# HOM-001-S04 — Student: now / next, today's classes, upcoming and overdue work

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.1 (student), FR-HOM-001.12, FR-HOM-001.14; BR-HOM-001.4, .8, .12 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-14) |
| **Branch** | `feat/HOM-001-S04-student-today-work` (stacked on S03) |
| **Estimate** | 2–3 days |

## User-visible outcome
"As a student, my home tells me which class I'm in now and which comes next, with teacher and room or link. It shows today's classes, and the work due in the next two weeks plus anything I missed, for my own group only. Each item has its status and a button to hand it in."

## Decisions
- **Quizzes (FR .15) are not in this slice.** Nothing creates `QuizSchedule` rows today (FRD Q12, decided 2026-11-14: option 1). The section ships once quiz scheduling exists.
- The current student home lists **every** assignment in the school (`/assignments/by-school`, FRD Q8) and shows school-wide course counts. Both are removed here. The KPI row, grades and habits come in S05; the existing grade-report, messages and newsletter cards stay until then.

## Rules applied
- **Scope** (BR .8): the student is resolved by `Student.userId = caller` within the caller's organization; otherwise `403 No student profile in this organization`. The endpoints take no `studentId`. Time is read in the student's school's `timezone`.
- **No class group:** schedule and work are empty, with *"Aún no tienes grupo asignado"*.
- **Now / next:** "now" is the non-recess slot with `start ≤ now < end`; "next" is the first non-recess slot starting after now, today.
- **Work window:** `AssignmentDate` rows for the student's class group due in the next 14 days, plus those due in the last 7 days that are *Vencida*. Status per BR .12:
  - *Entregado*: a submission exists;
  - *Presencial*: `requireSubmission` is false;
  - *Vencida*: past due, submission required and missing;
  - *Pendiente*: anything else.
- **Order:** overdue first (oldest first), then by due date.

## Acceptance criteria
```gherkin
Scenario: next class with teacher and room
  Given student S of class group G, and G has a class of course C today later than now
  When S opens /home
  Then "Siguiente" shows C with its teacher's name and room

Scenario: today's classes
  Then the strip lists today's slots of G in time order, recess excluded

Scenario: upcoming and overdue work for my group only
  Given G has an assignment due in 3 days requiring submission (no submission), one due today that S handed in,
        one due 2 days ago requiring submission (none), and an in-class exam tomorrow
  And another group has an assignment due tomorrow
  Then "Próximas entregas y evaluaciones" lists, in order: the overdue one "Vencida",
       today's "Entregado", the exam "Presencial", and the one in 3 days "Pendiente" with "Entregar"
  And the other group's assignment is not listed

Scenario: not a student
  When a teacher calls GET /api/v1/home/student/today
  Then the API responds 403
```

## Layers touched
- [x] **Nest `home`:** `student-home.controller.ts` with `@RequirePermissions(Perm.VIEW_GRADES)`. It provides:
  - `GET v1/home/student/today` returns `{ firstName, timezone, date, time, period, classGroup, now, next, slots: [{ id, startTime, endTime, recess, remote, remoteLink, location, course, teacherName, state }] }`.
  - `GET v1/home/student/work` returns `{ timezone, today, items: [{ assignmentId, title, type, requireSubmission, course, dueAt, status, submittedAt }] }`.

  It reuses `schoolLocalTime`, `localMidnight`, `resolveCurrentPeriod` and `slotState` (moved to a shared helper). There's no N+1: one schedule query, one assignment-date query with this student's submission.
- [x] **Angular `student-home.ts`:**
  - Header: greeting, date, group, and the week's summary (*"Esta semana tienes N entregas…"*).
  - "Ahora / Siguiente" card with today's strip.
  - "Próximas entregas y evaluaciones" card with type and status badges. *"Entregar"* links to the assignment page, where students hand in work.
  - Removes the school-wide tiles and the school-wide "Asignaciones próximas" card.
- [x] **Tests:**
  - Nest unit tests: now/next/strip; no class group; status rules and window; ordering; other group excluded by query; no student record 403; school timezone.
  - Playwright `@FR-HOM-001.12`, `@FR-HOM-001.14`. Fixtures add a `student` persona linked to the first related student, plus assignments for the four statuses and one for another group.

## Out of scope for this slice
- Quizzes (FR .15, Q12).
- KPIs, grades, habits (S05).

## Done checklist
- [x] Acceptance criteria pass: unit (`home/student-home.service.spec.ts`) and Playwright `@FR-HOM-001.12/.14` (3 tests, `apps/web-dashboard-e2e/src/home/student-home.spec.ts`; full suite 20/20). The "no class group" scenario is covered at unit level only
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
