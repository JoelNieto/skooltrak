# HOM-001-S08 — Admin: attention tiles, period-close banner, KPI row

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.1 (admin), FR-HOM-001.5 (admin), FR-HOM-001.24, FR-HOM-001.25; BR-HOM-001.1, .2, .3, .4, .5, .10, .14, .15, .16; Q1 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-15) |
| **Branch** | `feat/HOM-001-S08-admin-attention` (stacked on S07) |
| **Estimate** | 3 days |

## User-visible outcome
"As a school admin, my home opens with what needs me today: requests to join, broadcasts to approve, classes with no attendance yet, overdue charges, failed imports and study plans without a grade scale, each linking to where I resolve it. A banner tells me how close the period close is and how many courses still miss grades. Four tiles summarise the school: active students, attendance today, this month's collection and how many students pass every course."

## New permission
**`Perm.VIEW_SCHOOL_DASHBOARD`** (Q1, decided 2026-11-14): *"View the school dashboard on the home page"*.
- Added to `libs/auth/src/lib/permissions/permissions.constants.ts` and to `prisma/scripts/seed-roles-permissions.ts`.
- ORG_ADMIN gets it through `ALL_PERMISSIONS`; SYSADMIN and ADMIN pass any check.
- Existing databases need `bun run db:add-roles-permissions` (an idempotent upsert) after deploy.

## Rules applied
- **Scope** (BR .10): `schoolId` must belong to the caller's organization (`403`). Every query filters by `organizationId` and `schoolId`. Time comes from `School.timezone` (BR .4).
- **Attention tiles** (FR .24). Tiles with a zero count are hidden; when all are zero the card shows *"Todo al día"*.
  | Tile | Count | Link |
  |---|---|---|
  | Solicitudes de ingreso | `JoinRequest` `PENDING` for the school (split by requested role) | `/admin/join-requests` |
  | Comunicados por aprobar | broadcasts `PENDING_APPROVAL` in the organization | `/communication` |
  | Clases sin asistencia hoy | today's non-recess slots of the school whose start time has passed and that have no `AttendanceSession` for (course, group, today) (BR .15) | `/admin/attendance-reporting` |
  | Cargos vencidos | the school's charges with an outstanding amount and due date before today: count, amount, families (BR .14) | `/financial-module` |
  | Importaciones con errores | the school's `ImportJob`s with `FAILED` status, or `errorCount > 0`, in the last 30 days | `/admin/imports` |
  | Planes sin escala de notas | the school's study plans with no grade metric of their own or from their degree (BR .1) | `/admin/study-plans` |

  The overdue-charges tile needs `VIEW_FINANCIALS` (BR .16). **Families** = distinct sets of parents of those students; students with no linked parent count one each.
- **Period banner** (FR .5): shown while the current period ends within 14 days. It reads *"Cierre del {period} en N días · X de Y cursos tienen calificaciones incompletas"*, where incomplete means at least one enrolled active student has no score in a grade of the period.
- **KPIs** (FR .25):
  - **Estudiantes activos:** students `ACTIVE`, plus `CANDIDATE` as a hint.
  - **Asistencia hoy:** the BR .5 rate of today's records, against the rate of the previous week (Monday–Sunday).
  - **Cobranza del mes:** payments on charges due this month ÷ the amount of those charges (`VIEW_FINANCIALS`; the tile is omitted without it).
  - **Aprobando todas las materias:** among active students with at least one published average this period in a course whose plan has a scale, the share with no average below `minimumApproval`. Also gives how many are below in at least one course, and how many are at or above `minimumExcellence` in all their courses.

## Acceptance criteria
```gherkin
Scenario: attention tiles
  Given a pending join request, a broadcast pending approval, a class today that started without attendance,
        an overdue charge and a study plan without a grade metric in school S
  When admin A opens /home for S
  Then each shows as a tile with its count and links to its page
  And a tile with zero count is not shown

Scenario: period banner
  Given the current period ends in 10 days and a course has a grade with missing scores
  Then the banner shows "Cierre del <period> en 10 días" and "1 de N cursos"

Scenario: KPIs
  Then "Estudiantes activos", "Asistencia hoy", "Cobranza del mes" and "Aprobando todas las materias" show their values

Scenario: permission and scope
  When a teacher calls GET /api/v1/home/admin/attention
  Then the API responds 403
  When A calls it with a school of another organization
  Then the API responds 403
```

## Layers touched
- [x] **Permission** `VIEW_SCHOOL_DASHBOARD` in both `Perm` enums and their descriptions.
- [x] **Nest `home`:** `admin-home.controller.ts` (`@RequirePermissions(Perm.VIEW_SCHOOL_DASHBOARD)`):
  - `GET v1/home/admin/attention?schoolId=` returns `{ firstName, date, timezone, period, periodClose, tiles: { joinRequests, broadcastsToApprove, missedAttendance, overdueCharges | null, failedImports, plansWithoutScale } }`.
  - `GET v1/home/admin/kpis?schoolId=` returns `{ students, attendanceToday, collection | null, passing }`.

  It reuses `schoolLocalTime`, `resolvePeriodPair`, `periodClose`, `attendanceRate`, `weightedAverages` and `gradeBand`, with grouped queries only.
- [x] **Angular `home.ts`:**
  - Greeting header.
  - Period banner.
  - "Requiere tu atención" tiles.
  - KPI row replacing the four count tiles.
  - The broadcasts, messages, quick actions, newsletters and recent people cards stay until S09/S10.
- [x] **Tests:**
  - Nest unit tests: every tile count and its scope; zero tiles; finance omitted without the permission; families; banner; each KPI; 403s.
  - Playwright `@FR-HOM-001.24`, `@FR-HOM-001.25`. Fixtures add a pending join request, a pending school-wide broadcast, an overdue charge and a study plan without a metric. The 00:00 slot already gives "clases sin asistencia".

## Out of scope for this slice
- Lowest-attendance groups and follow-up students (S09); finance detail, broadcast reach, store (S10).
- Habits not published (FRD Q11).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (unit + e2e tests)
- [x] `libs/ui` components only, no raw palette colours
- [ ] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
