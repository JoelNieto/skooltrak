# HOM-001-S07 — Parent: upcoming work, recent grades, teacher messages, account summary

| | |
|---|---|
| **FRD** | [HOM-001](../frd/HOM-001-persona-home-dashboards.md) |
| **Implements** | FR-HOM-001.4 (parent), FR-HOM-001.21, FR-HOM-001.22, FR-HOM-001.23; BR-HOM-001.2, .9, .12, .14, .16 |
| **Status** | In review (code, unit and e2e tests passing 2026-11-15) |
| **Branch** | `feat/HOM-001-S07-parent-detail` (stacked on S06) |
| **Estimate** | 2 days |

## User-visible outcome
"As a parent, for the child I selected I see what's coming up and how it's going: upcoming work, their latest grades, messages from their teachers and where their account stands. The parent home now matches the approved design."

## Rules applied
- **Scope** (BR .9): every section belongs to the selected linked child and checks the link (`403` otherwise).
- **Upcoming work** (FR .21): S04's work list for the child (BR .12), read-only.
- **Recent grades** (FR .21): the child's 4 most recent scored grades among published grades (BR .2), banded on the child's study plan scale (BR .1).
- **Teacher messages** (FR .23):
  - non-broadcast `STUDENT_GUARDIANS` threads about this child (`scopeId = studentId`) that the parent participates in, newest first, up to 4;
  - each shows the sender of the last message, when, a 140-character preview, and *unread* if it's newer than the parent's `lastReadAt` and not sent by the parent.
- **Account** (FR .22): `GET /home/parent/child/:studentId/account` needs `VIEW_FINANCIALS` (method-level, BR .16) and the link check. It returns:
  - status: *Vencido* when any charge is overdue with an outstanding amount; *Pendiente* when the balance is positive; *Al día* otherwise;
  - balance and overdue amount;
  - the next charge with an outstanding amount (description, outstanding, due date);
  - the last payment (amount, date).

  Same arithmetic as `payments.service.ts` (BR .14). Without the permission the card is hidden.
- **Placeholders** (FR .4): an attendance calendar for the month and the trend of the child's average against their group.
- The legacy messages (`/communication/threads`, all children mixed) and newsletters cards are removed. `RecentBroadcasts` stays as "Comunicados".

## Acceptance criteria
```gherkin
Scenario: upcoming work and recent grades of the selected child
  Given parent P selects Ana
  Then "Próximas tareas y evaluaciones" lists Ana's work with its status
  And "Calificaciones recientes" shows Ana's published grades with their score, not the unpublished one

Scenario: teacher messages about the child
  Given a STUDENT_GUARDIANS thread about Ana with P as participant
  Then "Mensajes de docentes" lists it with the sender and preview
  When P selects Beto
  Then that thread is not listed

Scenario: account summary
  Given Ana has a charge of 285 due in 3 days and no payments
  Then "Estado de cuenta" shows "Pendiente", the next charge with its due date and no last payment
  And it links to /parent/finances

Scenario: account permission and link
  When a user without VIEW_FINANCIALS calls the account endpoint
  Then the API responds 403
  When P calls it for a student not linked to P
  Then the API responds 403

Scenario: placeholders
  Then the attendance calendar and trend show "Gráfico por desarrollar"
```

## Layers touched
- [x] **Nest `home`:**
  - `child` gains:
    - `work` (S04 items);
    - `recentGrades` (4);
    - `messages: [{ id, title, senderName, lastMessageAt, preview, unread }]`.
  - New `GET v1/home/parent/child/:studentId/account` (`@RequirePermissions(Perm.VIEW_FINANCIALS)`) returns `{ currencyCode, status, balance, overdue, nextCharge, lastPayment }`.
  - `progressFor` takes the number of recent grades to return.
- [x] **Angular `parent-home.ts`:**
  - Work and recent-grades row.
  - Attendance placeholder and account card row.
  - Teacher messages and "Comunicados" row.
  - Trend placeholder.
  - Removes the legacy messages and newsletters resources.
- [x] **Tests:**
  - Nest unit tests: account status rules (al día / pendiente / vencido), next charge, last payment; link check on account; messages scoped to the child and unread rule; 4 recent grades.
  - Playwright `@FR-HOM-001.21`, `@FR-HOM-001.22`, `@FR-HOM-001.23`.

## Out of scope for this slice
- The real attendance calendar and trend chart (placeholders only).
- Replying from the home (links to `/parent/communication`).

## Done checklist
- [x] Acceptance criteria pass: unit (`home/parent-home.service.spec.ts`) and Playwright `@FR-HOM-001.21/.22/.23` (2 tests in `apps/web-dashboard-e2e/src/home/parent-home.spec.ts`; full suite 27/27). The *Vencido* status and the unread rule are covered at unit level only
- [x] Cross-tenant / wrong-role access refused (test)
- [x] `libs/ui` components only, no raw palette colours
- [x] OpenAPI client regenerated: n/a (placeholder spec, see S01)
- [x] FRD slice table + `capabilities.md` updated
