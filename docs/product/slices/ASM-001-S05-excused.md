# ASM-001-S05 — Excused (EX)

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.10, BR-ASM-001.3 |
| **Status** | In review |
| **Branch** | `feat/ASM-001-S05-excused` (stacked on S04, #56) |
| **Estimate** | 1 day |

## User-visible outcome
"As a teacher, I type EX in a cell to excuse a student from that grade. It doesn't count in their average. Students and families see *Exenta*."

## Acceptance criteria
```gherkin
Scenario: excusing a student
  Given teacher T opens the gradebook
  When T types "EX" (any case) in Carla's "Prueba corta" cell and saves
  Then the cell shows "EX" and has no score
  And Carla's average leaves that cell out of both the sum and the weights
  And the legend reads "… · escribe EX para exentar · …"

Scenario: never both
  When a save sends a cell that is excused and scored
  Then the API answers 400 "Una nota exenta no lleva calificación"

Scenario: excusing a published cell
  Given "Taller" is published
  When T excuses Ana's "Taller" cell
  Then the save needs a reason, and the revision records the exemption (BR .8)

Scenario: what families see
  Given Ana is excused in a published grade
  Then her course's "Calificaciones" table reads "Exenta" for it
  And the period average leaves it out
```

## Decisions
- **No migration of averages is needed.** An excused cell never has a score, so every average (`courseAverage`, the admin home's SQL, the grade report) already skips it like an empty cell.
- **Home pages' "recent grades"** list scored grades only, so an excused grade doesn't appear there, like an empty one.
- **The grade page's score dialog** ends an exemption when a score is saved. On a published grade that is a change, and it needs a reason.
- **The student's course *Calificaciones* card** now uses `courseAverage`. It was a plain mean that counted empty scores as 0, so an excused cell would have lowered it. With no scored cell it reads *"Sin notas"*.

## Layers touched
- [x] **Prisma migration:** `StudentGrade.excused Boolean @default(false)`.
- [x] **Shared:** `parseCell` reads `EX`; `EXCUSED_TEXT`.
- [x] **Nest:**
  - `PUT /gradebook/:courseId/cells` cells carry `excused`; excused + score → 400.
  - A changed exemption on a published cell needs a reason and is recorded (`cellChanged`).
  - Reads return `excused`.
  - `PATCH` / `POST /student-grades`: a score clears `excused`.
- [x] **Angular:**
  - The grid accepts `EX`, shows it for saved exemptions, and adds it to the legend; the side panel and history show *Exenta*.
  - Teacher's grade page: *EX*.
  - Student's course table and staff student page: *Exenta*.
- [x] **Tests:**
  - shared `EX` parsing;
  - Nest: excused draft cell, excused + score refused, published exemption needs a reason and is recorded;
  - Angular: `EX` in the draft logic;
  - Playwright `@FR-ASM-001.10 @BR-ASM-001.3`: type `EX`, average unchanged, saved as `EX`, 400 for excused + score.

## Out of scope for this slice
- *"Exenta"* on assignment pills (ACA-001 FR .17): needs assignment-linked grades (S06).
- `EX` in the CSV export (S07).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test): no access rules change; the gradebook save's scope tests keep passing
- [x] FRD slice table + `capabilities.md` updated
