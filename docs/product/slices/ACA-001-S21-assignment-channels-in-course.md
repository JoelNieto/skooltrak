# ACA-001-S21 — Assignment Q&A channels in the course's Canales tab

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.29; BR-ACA-001.17, BR-ACA-001.18 |
| **Status** | In review (built on [COM-003-S02](COM-003-S02-assignment-channels.md)) |
| **Branch** | `feat/ACA-001-S21-assignment-channels-in-course` |
| **Estimate** | 1 day |
| **Design** | Canvas "Skooltrak — Courses redesign (desktop)", boards *Course channels — student / teacher* |

## User-visible outcome
"As a student or teacher, the course's Canales tab lists each assignment's questions channel on its own, and opening one shows the assignment it's about."

## Acceptance criteria
```gherkin
Background:
  Given the teacher creates the homework "Guía S21 E2E" for "7°A E2E", due in 2 days, so it gets its Q&A channel (COM-003-S02)

Scenario: its own group in the list @FR-ACA-001.29
  When Ana opens the course's "Canales" tab
  Then "Guía S21 E2E" is listed under "Preguntas por asignación", with "Cierra el dd/mm/aaaa"
  And not among "Canales del curso"

Scenario: the assignment card @FR-ACA-001.29
  When Ana opens "Guía S21 E2E" in the tab
  Then above its posts she sees "Guía S21 E2E", "Tarea · Entrega: dd/mm/aaaa" and "Ver asignación" (/assignments/<id>)
  And the pinned opening post shows "Fijado"

Scenario: closed
  Given its close time has passed
  Then its row says "Preguntas cerradas", after the open ones

Scenario: "Preguntar en el curso" stays on the course @FR-ACA-001.25
  When Ana presses "Preguntar en el curso"
  Then a course channel opens, never an assignment's

Scenario: the teacher @FR-ACA-001.29
  When the course's teacher opens it in the tab
  Then they see the same card, with one date per class group when there are several
```

## Layers touched
- [ ] Prisma, Nest, OpenAPI: **none**. It uses COM-003-S02's `ASSIGNMENT` channels (`assignmentId`, `closesAt`) and the existing `GET /api/v1/assignments/:id`, which filters dates to the viewer's group for students and parents.
- [ ] Angular (`courses/`):
  - `course-channels.ts`:
    - `courseChannels()` also keeps the course's `ASSIGNMENT` channels (BR .17);
    - their kind (BR .18) is *"Cierra el dd/mm/aaaa"*, *"Preguntas cerradas"* or *"Preguntas de la asignación"*;
    - new `groupChannels()` and `assignmentDueText()`;
    - `askChannel()` only picks `COURSE` channels.
  - `course-channels-list.ts`: in the tab, two lists, *Canales del curso* and *Preguntas por asignación*, sharing one row template. Assignment rows use a `clipboard-list` icon. The Resumen card keeps one list of the latest 3.
  - `course.ts`: with an `ASSIGNMENT` channel open, a card above `app-channel` shows the title, type, due date(s), the kind and *"Ver asignación"*, from `GET /api/v1/assignments/:id`.
- [ ] Tests:
  - Web unit (`course-channels.spec.ts`): kept and grouped, kind labels, `askChannel` ignoring them, due-date text.
  - Playwright: an S21 block at the end of `courses/course-channels.after.spec.ts` (`@FR-ACA-001.29`). It creates its assignment through the API.
  - `playwright.config.ts`: `communication/assignment-channels.after.spec.ts` moves to a new `after-assignments` project that runs after `after`, since its new Q&A channels would change the tab counts S15–S20 assert.

## Out of scope for this slice
- Counting Q&A channels in *Mis cursos*' badges and stat (S16 keeps COURSE channels).
- A question count on the assignment list and the assignment page.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused. No new endpoint; COM-003's membership rules (BR-COM-003.10) decide who sees each Q&A channel.
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
