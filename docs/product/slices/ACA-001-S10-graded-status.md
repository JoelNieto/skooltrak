# ACA-001-S10 — "Calificada · n" status from linked grades

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.17, BR-ACA-001.6 (first rule) |
| **Status** | Done: #63 (2026-11-22) |
| **Branch** | `feat/ACA-001-S10-graded-status` |
| **Estimate** | 1 day |

## User-visible outcome
"As a student or parent, when a teacher grades an assignment and publishes the grade, the assignment reads *Calificada · 4.5*, or *Exenta* if I was excused, instead of *Entregado* or *Vencida*."

## Acceptance criteria
```gherkin
Scenario: graded work
  Given "Examen E2E" is linked to a grade column (ASM-001-S06) where Ana has 4
  When the column is published
  Then Ana's home lists "Examen E2E" as "Calificada · 4.0"
  And her parent's home shows the same for Ana

Scenario: excused
  Given Ana is excused in the column linked to "Tarea pendiente E2E"
  When it is published
  Then the work reads "Exenta"

Scenario: not yet
  Given the linked column is a draft, or Ana's cell is empty
  Then the usual statuses apply (Entregado, Vencida, Presencial, Pendiente)
```

## Decisions
- **Where it shows today:** the student home's *Próximas entregas* and the parent home's work list for the selected child, which share one status rule (`workStatus`). The course page's *Asignaciones* tab (ACA-001-S06) will reuse it when built.
- **Precedence** follows BR-ACA-001.6: *Calificada* / *Exenta* first, then *Entregado*, *Vencida*, *Presencial*, *Pendiente*. A submitted and graded item keeps its *Ver entrega* link.
- **The score has one decimal**, as everywhere else ("Calificada · 4.0").
- The work list's window is unchanged (overdue in the last 7 days, due in the next 14). Graded work from before today drops out, as handed-in work does.

## Layers touched
- [x] **Nest** (`home/student-home.service.ts`):
  - the work query reads the assignment's linked grade and the student's cell in it;
  - `workStatus` gains `CALIFICADA` and `EXENTA`, plus `score` on the item.
- [x] **Angular:** the student and parent homes label the new statuses (*"Calificada · {score}"*, *"Exenta"*).
- [x] **Tests:**
  - Nest: precedence of the new statuses, and the fall-through for an empty cell;
  - Playwright `@FR-ACA-001.17 @BR-ACA-001.6`: two assignments linked and published, seen on the student's and the parent's home.

## Out of scope for this slice
- The course page's *Asignaciones* tab and its *Done / total* counts (ACA-001-S06, S03).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test): no access change; work stays limited to the student's own group (HOM-001 specs keep passing)
- [x] FRD slice table + `capabilities.md` updated
