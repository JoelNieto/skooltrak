# HOM-001-S06 — Parent: child switcher with alert counts, alerts and KPIs for the selected child

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.1 (parent), FR-HOM-001.18, FR-HOM-001.19, FR-HOM-001.20; BR-HOM-001.1, .5, .6, .9, .12, .14, .16 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-14) |
| **Branch** | `feat/HOM-001-S06-parent-children` (stacked on S05) |
| **Estimate** | 3 days |

## User-visible outcome
"As a parent, my home has one button per child showing how many things need my attention. For the selected child I see what needs me (an absence, overdue work, a low grade, a payment due) with a link to act on it, plus their average, attendance, pending work and balance."

## Rules applied
- **Scope** (BR .9):
  - The children are the students linked to any `Parent` record of the caller (`Parent.userId`), across organizations.
  - `GET /home/parent/child/:studentId` checks the link. Otherwise it returns `403 No puedes ver la información de este estudiante` and no data.
  - Each child's figures come from that child's own school (timezone, period, scale) and organization.
  - Requires `VIEW_GRADES` and at least one Parent record; otherwise `403 No parent profile`.
- **Default child:** the one with the most alerts; ties go to the first alphabetically. The client keeps the choice in `ParentContext` while the app is open.
- **Alerts** (FR .19), computed from the student read models of S04/S05:
  | Kind | When | Tone | Action |
  |---|---|---|---|
  | `ABSENCE` | `ABSENT` records in the last 7 days (BR .6) | danger | *Escribir al docente* → `/parent/communication` |
  | `OVERDUE_WORK` | work with status *Vencida* (BR .12) | warning | *Ver progreso* → `/parent/progress` |
  | `BELOW_PASS` | a course average below the plan's `minimumApproval` (BR .1) | danger | *Escribir al docente* |
  | `CHARGE_OVERDUE` | a charge with outstanding amount and due date before today (BR .14) | danger | *Ver estado de cuenta* → `/parent/finances` |
  | `CHARGE_DUE_SOON` | a charge with outstanding amount due within 7 days | warning | *Ver estado de cuenta* |
  | `LATE` | ≥ 3 `LATE` this week | warning | *Ver progreso* |

  Charge alerts and the balance tile need `VIEW_FINANCIALS`; without it they're omitted (BR .16). Outstanding = charge amount − payments linked to it, as in `payments.service.ts:getStudentBalanceSummary`. Balance = all charges − all payments.
- **KPIs** (FR .20):
  - average (with the plan's maximum and change since last period);
  - attendance rate with absence and late counts;
  - work pending (*Pendiente* + *Vencida*);
  - balance in the school's `currencyCode`.

## Acceptance criteria
```gherkin
Scenario: switcher with alert counts and default child
  Given parent P is linked to Ana (overdue work, payment due in 3 days) and Beto (overdue work, average below the pass mark)
  When P opens /home
  Then there is one button per child with "2 alertas", and Ana (tie, alphabetical) is selected

Scenario: alerts for the selected child
  Then "Requiere tu atención · Ana" shows "Tarea vencida" and "Pago próximo a vencer" with their actions
  When P selects Beto
  Then it shows "Nota baja en <course>" with the pass mark, and "Tarea vencida"

Scenario: KPIs
  Then the selected child's average, attendance, work pending and balance are shown

Scenario: child not linked
  When P calls GET /api/v1/home/parent/child/<another student>
  Then the API responds 403

Scenario: not a parent
  When a teacher calls GET /api/v1/home/parent/children
  Then the API responds 403
```

## Layers touched
- [x] **Nest `home`:**
  - `parent-home.controller.ts` with `@RequirePermissions(Perm.VIEW_GRADES)`:
    - `GET v1/home/parent/children` returns `{ firstName, defaultStudentId, children: [{ studentId, name, classGroup, school, alertCount }] }`.
    - `GET v1/home/parent/child/:studentId` returns `{ student, currencyCode, alerts: [{ kind, tone, title, detail, action }], kpis: { average, attendance, pending, balance | null } }`.
  - `StudentHomeService` gains `contextForStudent(id)` plus `workFor` / `progressFor`, reusing the student read models without a user. It skips the message counts when there is no student user.
- [x] **Angular `parent-home.ts`:**
  - Header greeting.
  - Switcher (`<button aria-pressed>`, one per child, alert badge).
  - "Requiere tu atención" card (*"Todo al día"* when empty).
  - KPI row.
  - Removes the old "Hijos vinculados" card and tiles. The messages, newsletters and broadcasts cards stay until S07.
- [x] **Tests:**
  - Nest unit tests: link check (403); no parent; alert rules; default child; finance alerts omitted without `VIEW_FINANCIALS`; KPI values.
  - Playwright `@FR-HOM-001.18`, `@FR-HOM-001.19`, `@FR-HOM-001.20`. Fixtures link `parent` to the second related student too, and add a charge for the first due in 3 days.

## Out of scope for this slice
- Upcoming work list, recent grades, teacher messages and the account summary card (S07).
- Justifying absences (FRD Q7).

## Done checklist
- [x] Acceptance criteria pass: unit (`home/parent-home.service.spec.ts`) and Playwright `@FR-HOM-001.18/.19/.20` (3 tests, `apps/web-dashboard-e2e/src/home/parent-home.spec.ts`; full suite 25/25). The absence, overdue-charge and lateness alerts are covered at unit level only (seeding them would change the attendance figures other specs assert). Found FRD Q13 and Q14 along the way
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
