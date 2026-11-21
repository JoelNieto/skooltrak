# ASM-001-S04 — Publish, revisions with a required reason, side panel

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.7, .8, .9, BR-ASM-001.8, .9, .14 |
| **Status** | In review |
| **Branch** | `feat/ASM-001-S04-publish-revisions` (stacked on S03, #54) |
| **Estimate** | 3 days |

## User-visible outcome
"As a teacher, I publish the columns I've finished from the gradebook, and families are notified. I can still correct a published score, but I must say why, and every correction is kept in the cell's history. I add a comment to any cell."

## Acceptance criteria
```gherkin
Scenario: publishing from the gradebook
  Given teacher T has draft columns "Prueba 2" and "Proyecto", and changed "Prueba 2" in this session
  When T presses "Publicar calificaciones"
  Then pending changes are saved first
  And a dialog lists the draft columns with "Prueba 2" ticked
  When T confirms
  Then the ticked columns are published, stamped with the time and T
  And students and parents get the existing published-grade notifications

Scenario: correcting a published score needs a reason
  Given "Taller" is published and Beto has 2
  When T changes Beto's "Taller" cell to 3 and saves
  Then T is asked once for a reason covering every changed published cell
  And the save writes a revision: 2 → 3, T, now, the reason
  And students and parents see 3 at once
  And a save without a reason (or shorter than 3 / longer than 300 characters) is refused: 400 "Indica el motivo del cambio"

Scenario: side panel
  When T selects a cell
  Then a side panel shows the student, column, bucket, value and band
  And an editable comment (max 500 characters) saved with the draft
  And the cell's history: who changed it, when, from what to what, and why
  And, for a published cell, a reason for this cell only

Scenario: draft columns keep no history
  When T changes a draft cell and saves
  Then no revision is written

Scenario: unpublishing
  Given an admin unpublishes "Taller"
  Then its publish time is cleared, no revision is written and no one is notified
  And a teacher trying it gets 403 (S01)
```

## Decisions
These fill gaps in the FRD; each is easy to change.
- **Only score changes need a reason.** A comment-only change on a published cell is saved without a reason or a revision; revisions record scores (the FRD's `previousScore` / `score`).
- **The grade page follows the same rule.** Changing or adding a score of a published grade in its dialog (`PATCH` / `POST /student-grades`) asks for a reason and writes a revision. Otherwise the history would have gaps.
- **Existing published grades** get `publishedAt` = their last update in the migration; their publisher stays unknown.
- The publish dialog lists the **draft columns of the current period**. Publishing an already published column is a no-op.
- The panel's band uses the plan's thresholds (BR-HOM-001.1): *Excelencia*, *Aprobado*, *Bajo la nota mínima*.

## Layers touched
- [ ] **Prisma migration:**
  - `Grade.publishedAt DateTime?`, `Grade.publishedById String?` (→ `User`, `SetNull`); backfill as above;
  - `StudentGradeRevision`: `previousScore Decimal?`, `score` nullable, `excused Boolean @default(false)` (for S05), `changedById String?` (→ `User`, `SetNull`).
- [ ] **Nest:**
  - `grades/grade-revisions.ts`: `reasonError`, `REASON_REQUIRED`, and `recordRevisions(tx, …)`, used by the gradebook save and `PATCH` / `POST /student-grades`.
  - `PUT /gradebook/:courseId/cells` accepts published columns, a top-level `reason` and per-cell `reason` / `comment`. A changed published score without a valid reason → 400 with the cells. Comment > 500 → 400.
  - `POST /gradebook/:courseId/publish { gradeIds }`: the course's draft columns become published, with `publishedAt`, `publishedById` and the existing notifications.
  - `GET /gradebook/cells/:studentGradeId/history`: revisions, newest first, with the author's name.
  - `GET /gradebook/:courseId`: cells gain `comment`; columns gain `publishedAt`.
  - `PATCH /grades`: publishing stamps `publishedAt` / `publishedById`; unpublishing (admins) clears them.
- [ ] **OpenAPI:** `bun run openapi`.
- [ ] **Angular:**
  - Published cells become inputs. Saving with changed published cells asks once for *"Motivo del cambio"*.
  - *Publicar calificaciones* saves pending changes, then a dialog with the draft columns (changed ones ticked).
  - Side panel on cell focus: student, column, bucket, value and band, comment, per-cell reason when published, history.
  - The grade page's score dialog asks for a reason when the grade is published.
- [ ] **Tests:**
  - Nest: revision on a published change (previous / new / author / reason), none on drafts, 400 without a reason or with a bad one, comment limit, publish stamps and notifies, history scope, `PATCH /student-grades` rule.
  - Angular: changed comment / reason in the draft logic.
  - Playwright `@FR-ASM-001.7 @FR-ASM-001.8 @FR-ASM-001.9 @BR-ASM-001.8`: correct a published score with a reason and see it in the history; publish a draft column. Runs in the `after` project and restores what it changes.

## Out of scope for this slice
- Excused cells (S05); the revision's `excused` column is only added here.
- Homeroom alert on publish (S08).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] FRD slice table + `capabilities.md` updated
