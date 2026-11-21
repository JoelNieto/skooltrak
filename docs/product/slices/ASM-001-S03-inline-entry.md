# ASM-001-S03 — Inline entry, validation and bulk save draft

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.4, .5, .6, BR-ASM-001.2, .7, .10; §8 draft backup |
| **Status** | Done: #54 (2026-11-21) |
| **Branch** | `feat/ASM-001-S03-inline-entry` |
| **Estimate** | 3 days |

## User-visible outcome
"As a teacher, I type a whole column of scores from the keyboard. Averages and statuses update as I type. I save everything as a draft in one go, or discard it. Nothing is lost if another teacher changed a score meanwhile, or if I reload by accident."

## Acceptance criteria
```gherkin
Scenario: grading a draft column from the keyboard
  Given teacher T opens the gradebook of their course, with an unpublished column "Prueba 2"
  When T types 4 in Ana's "Prueba 2" cell and presses Enter
  Then the focus moves to the next student's "Prueba 2" cell
  And Ana's cell is highlighted as changed
  And Ana's "Promedio" and "Estado" and the footer update without a request
  And the bar reads "1 cambio sin guardar"

Scenario: saving a draft
  When T presses "Guardar borrador"
  Then every changed cell is saved in one request
  And the bar reads "Guardado"
  And a cell with no stored row gets one (BR .10)

Scenario: invalid values block saving
  When T types 7 on a 1–5 scale, or 4.25, or "abc"
  Then the cell is outlined in the danger tone with the reason ("Entre 1 y 5", "Máximo un decimal", "Escribe un número")
  And the bar reads "1 valor inválido" and "Guardar borrador" is disabled
  And the API refuses such a save with 400 and the cells concerned

Scenario: conflicting edits
  Given T loaded Beto's cell, and another teacher saved Beto's cell since
  When T saves
  Then nothing is saved, the API answers 409 with the cells concerned
  And T's values are kept, with "Otra persona cambió estas notas; revisa antes de guardar"

Scenario: published columns stay read-only until S04
  Given "Taller E2E" is published
  Then its cells show their score but cannot be edited
  And the API refuses a save that touches it with 400

Scenario: discard, leave, reload
  When T presses "Descartar", the cells go back to their saved values
  When T leaves the page with unsaved changes, they are asked to confirm
  When T reloads with unsaved changes, they are restored with "Recuperamos cambios sin guardar"
```

## Decisions
- **Published cells are read-only** in this slice (decided 2026-11-21). Changing a published score needs a reason and a revision (BR .8), which S04 adds. Until then, the column header still opens the grade page.
- **Draft backup in S03** (decided 2026-11-21): unsaved cells are kept in local storage per course, period and group, with the `updatedAt` they were loaded with, so a restored draft still detects conflicts.
- A comma is accepted as the decimal separator (`4,5`).
- Switching period or group keeps the unsaved cells of the view left behind in the backup; they are restored when the teacher comes back.

## Layers touched
- [x] **Prisma migration:** `@@unique([gradeId, studentId])` on `StudentGrade`. Duplicates are merged first: the most recently updated row is kept, and revisions of the others move to it (BR .10).
- [x] **Nest** (`gradebook`):
  - `PUT /api/v1/gradebook/:courseId/cells` `{ periodId, cells: [{ gradeId, studentId, score, updatedAt }] }`, `MANAGE_GRADES` + BR .1.
  - Refuses with 400 `{ message, cells: [{ gradeId, studentId, reason }] }`: a column of another course or period, a published column, a student not on the roster, a value outside BR .2, no grade metric.
  - Refuses with 409 `{ message, cells }` when a row changed since it was loaded (`updatedAt` differs, or a row now exists that didn't).
  - One transaction; missing rows are created. Returns the saved cells.
  - `POST /api/v1/student-grades` upserts on (grade, student), so the grade page keeps working with the unique pair.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular** (`gradebook/`):
  - Draft-column cells become inputs named *"{estudiante}, {columna}"*; Enter / Tab move down the column, Shift+Enter / Shift+Tab move up.
  - Changed and invalid states (`aria-invalid` + reason text); the legend *"Escala {min}–{max} · nota mínima {pass} · Tab pasa al siguiente estudiante"*.
  - Averages, statuses, the footer and *Incluye borradores* recalculate client-side (`courseAverage`, `gradeStatus`, `meanOf`).
  - Save bar: *"{n} cambios sin guardar"*, *"{n} valores inválidos"*, *"Guardado"*; *Guardar borrador*, *Descartar*. Conflict and error banners keep the teacher's values.
  - Leave confirmation (route guard + `beforeunload`) and the local-storage backup.
  - No grade metric: cells stay read-only with *"Escala de notas no configurada"*.
- [x] **Tests:**
  - Nest: valid save, row creation, 400 cases, 409, published refused, another teacher's course refused.
  - Angular: value parsing and validation.
  - Playwright `@FR-ASM-001.4 @FR-ASM-001.6 @BR-ASM-001.7`: keyboard entry, live average, save, invalid value, discard, reload restore, conflict. It runs in the `after` project and restores the scores it changes.

## Out of scope for this slice
- Changing published scores, reasons, revisions, publishing from the gradebook, comments (S04).
- Excused cells, `EX` (S05).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
