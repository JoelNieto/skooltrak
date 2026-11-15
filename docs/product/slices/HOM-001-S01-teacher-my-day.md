# HOM-001-S01 — Teacher: "Mi día" with attendance state

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.1, FR-HOM-001.6, FR-HOM-001.7 (attendance tile only); BR-HOM-001.3, .4, .5, .7, .15 |
| **Status** | Ready (Q2 and Q3 decided 2026-11-14) |
| **Branch** | `feat/HOM-001-S01-teacher-my-day` |
| **Estimate** | 3 days |

## User-visible outcome
"As a teacher, my home tells me which classes I have today, which one is happening now, and which ones still need attendance. I can take attendance in one click. The attendance number at the top is about my own groups, not the whole school."

## Acceptance criteria
```gherkin
Scenario: today's classes in order with their state
  Given teacher T teaches course C, scheduled today for class group G at 07:00–07:45 and 13:00–13:45
  And an attendance session exists for (C, G, today) with 29 of 31 students PRESENT or LATE
  And the school's local time is 10:00
  When T opens /home
  Then "Mi día" lists 07:00–07:45 "Asistencia tomada · 29/31" before 13:00–13:45 "Más tarde"

Scenario: missed attendance
  Given a slot for T today at 08:00–08:45 with no attendance session
  And the school's local time is 09:00
  Then that slot shows "Tomar asistencia", linking to /teacher/attendance with the course, group and date preselected

Scenario: current class
  Given a slot for T today at 09:00–10:30 and the school's local time is 09:15
  Then that slot is highlighted with "Ahora"

Scenario: recess and remote slots
  Given a recess slot and a remote slot with a link in T's schedule today
  Then the recess slot shows "Recreo" with no action
  And the remote slot shows "Abrir enlace", opening its link in a new tab

Scenario: no classes today
  Given T has no schedule slots on today's weekday
  Then "Mi día" shows the empty state "No tienes clases hoy"

Scenario: scoped attendance KPI
  Given T's groups have 90 records this week: 80 PRESENT, 2 LATE, 5 ABSENT, 3 EXCUSED
  When T opens /home
  Then "Asistencia de mis grupos" shows 94% (82 / 87) and names the lowest group
  And no school-wide course or student count is shown

Scenario: homeroom alone is not scope
  Given T is homeroom teacher of class group H but teaches no course in H's study plan
  Then no slot or attendance figure for H appears on T's home

Scenario: not a teacher
  Given a user with the STUDENT role, or an ORG_ADMIN with no Teacher record
  When they call GET /api/v1/home/teacher/today
  Then the API responds 403 "No teacher profile in this organization"

Scenario: cross-tenant school
  Given school S belongs to another organization
  When T calls GET /api/v1/home/teacher/today?schoolId=S
  Then the API responds 403
```

## Layers touched
- [ ] **Prisma migration** `add_school_timezone`: `School.timezone String @default("America/Panama")`, an IANA name. Validate it with `Intl.supportedValuesOf('timeZone')` in the school DTO. Add a timezone select to the school edit form under SET; the field is small, so it is included here.
- [ ] **Nest**: new module `apps/dashboard-backend/src/app/home/`, created with `bun nx g @nx/nest:module` (check `--help` first). It contains:
  - `home-time.ts`: a `Clock` injection token (so tests can fake "now") and `schoolNow(school)`, returning local date, time and weekday.
  - `home-period.ts`: `resolveCurrentPeriod(year, today)` per BR .3.
  - `home-scope.ts`: `teacherScope(userId, organizationId)` returns `{ teacher, courseIds, classGroupIds }`. It reuses the BR-COM-002.7 `where` helpers from `communication` (extract them to a shared helper if needed). It throws `403 No teacher profile in this organization`.
  - `home-attendance.ts`: `attendanceRate(where)` per BR .5. Do a single `groupBy` on `status`.
  - `teacher-home.controller.ts`, guarded by `@RequirePermissions(Perm.VIEW_COURSES)`:
    - `GET v1/home/teacher/today?schoolId=` → `{ greetingName, date, periodName, slots: [{ startTime, endTime, recess, remote, remoteLink, location, course: {id,name}, classGroup: {id,name}, state: 'DONE'|'NOW'|'LATER'|'MISSED', attendance: { sessionId, presentOrLate, total } | null }] }`
    - `GET v1/home/teacher/summary?schoolId=` → `{ attendanceWeek: { rate, lowestGroup: {id,name,rate} | null } }`. Later slices add the remaining fields.
  - The school is validated against the caller's `organizationId` (BR .10 pattern). Slots come from one `classGroupWeeklySchedule.findMany` (weekday = today, `courseId in courseIds`) plus one `attendanceSession.findMany` with `_count` of present/late records. No N+1.
- [ ] **OpenAPI**: Swagger DTOs for both responses, then `bun run openapi:orval` (regenerates `libs/api-client-dashboard`).
- [ ] **Angular** `teacher-home.ts`:
  - New header: *"Buenos días, {firstName}"*, date and period, actions *"Nueva asignación"* and *"Tomar asistencia"*.
  - "Mi día" card, using `Card`, `Badge` and `Button` from `libs/ui`.
  - KPI row with the attendance `StatCard`. Remove the school-wide *"Cursos activos"* and *"Estudiantes"* tiles.
  - Each section uses `httpResource` with skeleton, error-with-retry and empty states (FR .3).
  - Keep the existing broadcasts, messages and newsletter cards until S02 and S03.
  - Check whether `/teacher/attendance` can take query params to preselect course, group and date. If it can't, add `courseId`, `classGroupId` and `date` query-param handling there.
- [ ] **Tests**
  - Nest unit (`home/teacher-home.service.spec.ts`): states DONE/NOW/LATER/MISSED using the fake clock, including the timezone edge where UTC date ≠ local date; recess; homeroom-only group excluded; attendance rate with EXCUSED/SICK_LEAVE excluded; no teacher record → 403; school in another org → 403.
  - Playwright `@FR-HOM-001.6` / `@FR-HOM-001.7` (`apps/web-dashboard-e2e/src/home/teacher-home.spec.ts`). Fixtures go in `fixtures.ts` and `prepare-db.ts`. Make them deterministic regardless of run time: on **every weekday**, add slots for `teacher`'s course and group at 00:00–00:30 (always past, no session → missed), 00:30–01:00 (always past, session seeded for today → done) and 23:00–23:30 (later). Seed attendance records for this week's KPI.

## Out of scope for this slice
- Pendientes, period banner, week assignments (S02); students needing attention, messages, average KPI (S03).
- Any change to `/v1/assignments/by-school` (FRD Q8).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] `libs/ui` components only, no raw palette colours
- [ ] OpenAPI client regenerated
- [ ] FRD slice table + `capabilities.md` updated
