# HOM-001-S01 — Teacher: "Mi día" with attendance state

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.1, FR-HOM-001.6, FR-HOM-001.7 (attendance tile only); BR-HOM-001.3, .4, .5, .7, .15 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-14) |
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
  Then that slot shows "Tomar asistencia", which opens the attendance form with the course, group and date preselected

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
- [x] **Prisma migration** `add_school_timezone`: `School.timezone String @default("America/Panama")`, an IANA name. Validated in `schools.service` (`assertValidTimezone`, via `Intl.DateTimeFormat`): an unknown zone gets `400 Zona horaria inválida`. The form's select lists `Intl.supportedValuesOf('timeZone')`. Add a timezone select to the school edit form under SET; the field is small, so it is included here.
- [x] **Nest**: new module `apps/dashboard-backend/src/app/home/`, created with `bun nx g @nx/nest:module` (check `--help` first). It contains:
  - `home-time.ts`: a `Clock` injection token (so tests can fake "now") and `schoolNow(school)`, returning local date, time and weekday.
  - `home-period.ts`: `resolveCurrentPeriod(year, today)` per BR .3.
  - `home-scope.ts`: `teacherScope(userId, organizationId)` returns `{ teacher, courseIds, classGroupIds }`. It reuses the BR-COM-002.7 `where` helpers from `communication` (extract them to a shared helper if needed). It throws `403 No teacher profile in this organization`.
  - `home-attendance.ts`: `attendanceRate(where)` per BR .5. Do a single `groupBy` on `status`.
  - `teacher-home.controller.ts`, guarded by `@RequirePermissions(Perm.VIEW_COURSES)`:
    - `GET v1/home/teacher/today?schoolId=` → `{ greetingName, date, periodName, slots: [{ startTime, endTime, recess, remote, remoteLink, location, course: {id,name}, classGroup: {id,name}, state: 'DONE'|'NOW'|'LATER'|'MISSED', attendance: { sessionId, presentOrLate, total } | null }] }`
    - `GET v1/home/teacher/summary?schoolId=` → `{ weekStart, weekEnd, attendance: { rate, lowestGroup: {id,name,rate} | null } }`. Later slices add the remaining fields.
  - The school is validated against the caller's `organizationId` (BR .10 pattern). Slots come from one `classGroupWeeklySchedule.findMany` (weekday = today, `courseId in courseIds`) plus one `attendanceSession.findMany` with `_count` of present/late records. No N+1.
- [x] **OpenAPI**: response classes in `home/entities/teacher-home.entity.ts`. No orval run: `libs/api-client-dashboard/openapi.json` is still a one-path placeholder and `web-dashboard` doesn't import the generated client, so the home calls the API with `httpResource` and local types, like the other pages.
- [x] **Angular** `teacher-home.ts`:
  - New header: *"Buenos días, {firstName}"*, date and period, actions *"Nueva asignación"* and *"Tomar asistencia"*.
  - "Mi día" card, using `Card`, `Badge` and `Button` from `libs/ui`.
  - KPI row with the attendance `StatCard`. Remove the school-wide *"Cursos activos"* and *"Estudiantes"* tiles.
  - Each section uses `httpResource` with skeleton, error-with-retry and empty states (FR .3).
  - Keep the existing broadcasts, messages and newsletter cards until S02 and S03.
  - *"Tomar asistencia"* opens the existing `AttendanceForm` modal (the one on the course page) with `courseId`, the slot's group and today's date preselected (new optional `classGroupId` / `date` inputs). It does not link to `/teacher/attendance`, which is a static mock-up page. Closing the modal reloads "Mi día" and the KPI.
- [x] **Tests**
  - Nest unit (`home/teacher-home.service.spec.ts`): states DONE/NOW/LATER/MISSED using the fake clock, including the timezone edge where UTC date ≠ local date; recess; homeroom-only group excluded; attendance rate with EXCUSED/SICK_LEAVE excluded; no teacher record → 403; school in another org → 403.
  - Playwright `@FR-HOM-001.6` / `@FR-HOM-001.7` (`apps/web-dashboard-e2e/src/home/teacher-home.spec.ts`). Fixtures go in `fixtures.ts` and `prepare-db.ts`. Make them deterministic regardless of run time: on **every weekday**, slots for `teacher`'s course in `related` at 00:00–00:30 (ended, missed) and 23:30–23:59 (ahead), plus the other teacher's course in `homeroomOnly` at 00:00 (must not appear). There are 3 students in `related`. The spec takes attendance through the home and then checks the slot and the KPI. (One session per course, group and day means a second "done" slot would need another related group, which would break COM-002-S04's exact-list assertions.) It can flake only if run between 00:00–00:30 or 23:30–23:59 school time.

## Out of scope for this slice
- Pendientes, period banner, week assignments (S02); students needing attention, messages, average KPI (S03).
- Any change to `/v1/assignments/by-school` (FRD Q8).

## Done checklist
- [x] Acceptance criteria pass: unit (`home/*.spec.ts`, `schools/school-timezone.spec.ts`) and Playwright `@FR-HOM-001` (3 tests, `apps/web-dashboard-e2e/src/home/teacher-home.spec.ts`). The "current class" and "recess" scenarios are covered at unit level only. The remote slot's "Abrir enlace" button has no automated test
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see Layers touched)
- [x] FRD slice table + `capabilities.md` updated
