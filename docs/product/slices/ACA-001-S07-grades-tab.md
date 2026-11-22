# ACA-001-S07 — Calificaciones tab

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.14, .12 (grade summary); BR-ACA-001.5 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S07-grades-tab` (builds on S06, #70) |
| **Estimate** | 1–2 days |

## User-visible outcome
"As a student or parent, a course's *Calificaciones* shows my period average and whether I'm on track, how I'm doing in each category, and every published grade with the teacher's comment. *Resumen* shows the same summary at a glance."

## Acceptance criteria
```gherkin
Scenario: Calificaciones
  When Ana opens Calificaciones in her course
  Then a period switcher defaults to the current period
  And "Promedio del periodo" reads "4.0 / 5" with "Al día" and "Nota mínima 3.0"
  And one bar per category shows its name, weight and Ana's average ("Sin notas" without one)
  And a table lists the period's published grades, most recent first: title, category, date, comment and score
  And excused grades read "Exenta"; drafts never appear

Scenario: Resumen
  Then Resumen shows the average and the bars, without the table

Scenario: no average
  Then without a scored grade the card shows "—" and "Sin notas"
  And without a grade scale, "—" and "Escala de notas no configurada"
```

## Decisions
- **Category averages** are the plain mean of the student's scored cells in that category; the period average weights them (BR-ASM-001.4). Excused and empty cells count in neither.
- **Every category of the course** gets a bar, even with no grade this period ("Sin notas"), so the weights always read the same.
- Bars turn the danger tone below the pass mark.
- This replaces the old student grades table (`course-student-grades.ts`): it used `/student-grades/by-course`, and parents couldn't use it.

## Layers touched
- [x] **Nest:** `GET /courses/:id/grades-summary?periodId=&studentId=` (BR .3 access, students and parents), in `course-page.service.ts`.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** `courses/course-grades-summary.ts`, in *Calificaciones* (full) and in *Resumen* (compact).
- [x] **Tests:**
  - Nest: average and band, bars, excused and empty cells, order, period switch and validation, staff refused;
  - Playwright `@FR-ACA-001.14`: Ana's *Resumen* summary, and *Calificaciones* with 4.0, *Al día*, the *Pruebas* bar, *Taller E2E* in the table and no draft.

## Out of scope for this slice
- *Participantes* (S08).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test): the S06 access check, tested there
- [x] FRD slice table + `capabilities.md` updated
