# ACA-001-S03 — Próxima entrega, progress and stats row

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.4 (Próxima entrega, progress), .6; BR-ACA-001.7, .8, .10 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S03-progress` (on S02 #64, with S10 #63) |
| **Estimate** | 2 days |

## User-visible outcome
"As a student, each course card tells me what I owe next and how much of the period's work I've done. A row above the cards gives my period average, this week's work and how much I've completed overall."

## Acceptance criteria
```gherkin
Scenario: Próxima entrega
  Given Ana has an overdue assignment in a course
  Then the card shows the oldest overdue one with "Vencida desde {día}" in the danger tone
  And otherwise the nearest work still to do, with "Vence {día}, {hora}"
  And otherwise "Nada pendiente"
  And another period's cards show no Próxima entrega

Scenario: progress
  Then each card shows "{done} de {total} completadas" for the period's work of Ana's group
  And done counts Entregada, Calificada, Exenta, and Presencial once its date has passed

Scenario: stats row
  Then "Promedio del periodo" shows the mean of her course averages and the change from the previous period
  And "Esta semana" counts the work due Monday to Sunday (school time), with "{n} vencida(s)"
  And "Completadas" reads "{done} de {total}" across all courses
```

## Decisions
- **What counts as work** is the student's group's assignment dates in the selected period (BR .7). *Próxima entrega* looks at the whole school year, so an item due after the period still shows as next.
- **"To do" for *Próxima entrega*** is *Pendiente* or *Presencial* due now or later. Handed-in, graded and excused work is never "next".
- **The average** is the mean of the course averages, as on the student home (FR-HOM-001.13), shown with one decimal; the change compares with the period before the selected one.
- **Due times** are shown in the school's timezone, which the API returns.

## Layers touched
- [x] **Nest** (`courses-mine.service.ts`):
  - cards gain `next` and `progress`; the response gains `stats`, `isCurrentPeriod` and `timezone`;
  - statuses come from the shared `workStatus`, including *Calificada* / *Exenta* (ACA-001-S10).
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular** (`courses/my-courses.ts`): the stats row (`lib-stat-card`), and *Próxima entrega* plus a progress bar (`ui-meter`) on each card.
- [x] **Tests:**
  - Nest: done / total, the oldest overdue item or the nearest one still to do, none in another period, this week, the average and its change from the previous period;
  - Playwright `@FR-ACA-001.6`: Ana's card leads with the overdue essay, shows "… de 4 completadas", and the stats row is there.

## Out of scope for this slice
- Area chips (S04), parents (S05).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test): same endpoint and scope as S02
- [x] FRD slice table + `capabilities.md` updated
