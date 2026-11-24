# ACA-001-S19 — Teachers manage the course's channels inside its Canales tab

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.27; BR-ACA-001.19, BR-ACA-001.20 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S19-manage-channels-in-course` (built on S18) |
| **Estimate** | 1.5 days |
| **Design** | Canvas "Skooltrak — Courses redesign (desktop)", board *Course channels — teacher* |

## User-visible outcome
"As the course's teacher (or an admin), I post to the course's channels, see who read and confirmed, and answer questions without leaving the course page."

## Acceptance criteria
```gherkin
Background:
  # As in S15–S18: the spec creates these through the COM-003 API.
  Given "Matemáticas 7° E2E" has the COURSE channels "Anuncios S15 E2E" and "General S15 E2E"

Scenario: the tab replaces the Canal button @FR-ACA-001.27 @BR-ACA-001.19
  When the course's teacher opens the course page
  Then the tabs include "Canales", after "Asistencia"
  And the header has no "Canal" button
  When they open "Canales"
  Then the pane says "Elige un canal para publicar o responder"

Scenario: publishing with a read confirmation @FR-ACA-001.27
  When the teacher opens "Anuncios S15 E2E" in the tab
  And publishes "Recuerden traer la guía resuelta." with "Requiere confirmación de lectura"
  Then the post shows "Leído por 0 de {n}" and "Confirmado por 0 de {n}"
  And "Ver detalle" lists the members with when they read and confirmed
  And the teacher is still on the course page

Scenario: answering a private question @FR-ACA-001.27
  Given "Preguntas S19 E2E" (students reply privately) and Ana asked "¿El ejercicio 4 es fracción mixta?"
  When the teacher opens it in the tab
  Then its row says "Preguntas al docente"
  And the post's replies show Ana's conversation, where the teacher can answer

Scenario: creating and configuring @FR-ACA-001.27
  When the teacher presses "Nuevo canal para este curso"
  Then the channel form opens set to COURSE and this course
  When they press "Configurar" on an open channel
  Then the channel's settings open

Scenario: no tab without channel access @BR-ACA-001.19
  Given a member of staff without COMMUNICATION_VIEW, who may manage the course's channels
  Then they keep the header's "Canal" button and get no "Canales" tab

Scenario: homeroom @BR-ACA-001.19
  When a homeroom teacher opens a colleague's course read-only
  Then there is no "Canales" tab and no "Canal" button
```

## Layers touched
- [ ] Prisma, Nest, OpenAPI: **none**. Managers already get their managed channels from `GET /communication/channels`, and the composer, receipts and private conversations from the COM-003 channel view.
- [ ] Angular, COM (`communication/channel.ts`): the embedded header gains *"Configurar"* for managers, next to *"Abrir en pantalla completa"*.
- [ ] Angular, ACA:
  - `course-channels.ts`: `ChannelViewer` gains `MANAGER`. For a manager, the kind (BR .18) reads whether anyone may reply.
  - `course-channels-list.ts`: an `emptyDescription` input, so managers read *"Crea el primero con «Nuevo canal para este curso»."*
  - `course.ts`:
    - `channelsViewer()` is `STUDENT`, `PARENT`, or `MANAGER` for the course's teacher or an admin (`canOpenChannel()`), all with `COMMUNICATION_VIEW`.
    - The *Canales* tab and panel now serve all three: the panel moved out of the family-only block.
    - Managers get *"Nuevo canal para este curso"* above the list, and *"Elige un canal para publicar o responder"* in the pane.
    - The header's *Canal* button shows only when the tab doesn't.
    - A `?canal=` link opens on *Canales* for managers too.
- [ ] Tests:
  - Web unit: `channel.spec.ts`, where an embedded manager gets *Configurar* and the composer and marks nothing read. `course-channels.spec.ts` covers the manager kind labels.
  - Playwright: `courses/course-channels.after.spec.ts`, a teacher block tagged `@FR-ACA-001.27 @BR-ACA-001.19`. It replaces S15's "the teacher keeps Canal" test. The homeroom view stays in `course-homeroom.after.spec.ts`.

## Out of scope for this slice
- *"{n} por responder"* (S20, Q11): managers see no counts yet.
- Assignment Q&A channels (S21, after COM-003-S02).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused. No new endpoint; COM-003's manager checks (BR-COM-003.2–.3) apply to every write. The homeroom view and other teachers get no tab (e2e).
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
