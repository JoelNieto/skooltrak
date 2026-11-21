# ASM-001-S06 — Columns linked to assignments

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.11, BR-ASM-001.11 |
| **Status** | In review |
| **Branch** | `feat/ASM-001-S06-assignment-columns` |
| **Estimate** | 1–2 days |

## User-visible outcome
"As a teacher, when I add a grade column I can link it to one of the course's assignments. The column takes the assignment's title and date, and I can open the assignment from the column header."

The *"Calificada · {score}"* status on the assignment itself is ACA-001-S10, which builds on this link.

## Acceptance criteria
```gherkin
Scenario: linking a new column to an assignment
  Given teacher T's course has the assignment "Proyecto E2E", not linked yet
  When T presses "Nueva calificación" and picks "Proyecto E2E" under "Asignación"
  Then the title and date are taken from the assignment
  And after saving, the column "Proyecto E2E" shows a link to the assignment

Scenario: one grade per assignment
  Given "Proyecto E2E" is linked to a column
  Then it is not offered again in "Asignación"
  And linking it to another column is refused: 409 "Esta asignación ya tiene una calificación"

Scenario: same course only
  When a column is linked to an assignment of another course
  Then the API answers 400 "La asignación no pertenece a este curso"

Scenario: deleting the assignment
  When the linked assignment is deleted
  Then the column stays, without a link
```

## Decisions
- **The title and date follow the assignment at link time.** The server copies them when the link is set, on create or on `PATCH /grades`. Later edits to the assignment don't rename the column.
- **The grade form lists the course's assignments not linked yet**, newest first, from a new `GET /gradebook/:courseId/assignments`. The existing `/assignments/by-course` needs a date range and isn't scoped to grading.
- **Creating a column already published** (*Publicada* in the form) now stamps `publishedAt` / `publishedById` and sends the published-grade notifications, as publishing from the gradebook does (BR .9). Until now, only `PATCH` did.

## Layers touched
- [x] **Prisma migration:** `Grade.assignmentId String? @unique` → `Assignment` (`onDelete: SetNull`).
- [x] **Nest:**
  - `POST` / `PATCH /grades` accept `assignmentId`. `GradeAccessService.assertAssignmentLinkable` checks the same course (400) and that no other column has it (409). The unique index also turns a race into 409.
  - `GET /gradebook/:courseId/assignments` (`MANAGE_GRADES` + BR .1) returns the course's assignments with the column they're linked to.
  - `GET /gradebook/:courseId` returns each column's `assignment`.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:**
  - The grade form gets *"Asignación (opcional)"*; picking one fills the title and date.
  - Gradebook column headers link to their assignment.
- [x] **Tests:**
  - Nest: link rules (400 / 409, the same column may keep its link), title and date copied, a race turned into 409, published-on-create stamps and notifies.
  - Playwright `@FR-ASM-001.11 @BR-ASM-001.11`: link "Proyecto E2E" from the form and see the header link; 409 and 400 through the API.

## Out of scope for this slice
- The assignment's *"Calificada · {score}"* / *"Exenta"* pill (ACA-001-S10).
- Search and CSV export (S07).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
