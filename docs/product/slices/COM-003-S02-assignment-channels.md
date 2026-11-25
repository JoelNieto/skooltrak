# COM-003-S02 — Assignment Q&A channels

| | |
|---|---|
| **FRD** | [COM-003](../frd/COM-003-channels-and-direct.md) |
| **Implements** | FR-COM-003.17, FR-COM-003.18; BR-COM-003.10, BR-COM-003.11, BR-COM-003.13 |
| **Status** | Done (#89) |
| **Branch** | `feat/COM-003-S02-assignment-channels` |
| **Estimate** | 2.5 days |
| **Decided** | 2026-11-25 (ACA-001 Q10): every assignment gets one; students reply under a pinned post; it closes 3 days after the latest due date |

## User-visible outcome
"As a student, every assignment has its own questions channel, where I ask under the teacher's opening post and everyone sees the answers, until 3 days after it's due."

## Acceptance criteria
```gherkin
Background:
  Given the teacher's course "Matemáticas 7° E2E" and its class group "7°A E2E", with Ana and Beto on the roster

Scenario: creating an assignment creates its Q&A channel @FR-COM-003.17
  When the teacher creates the homework "Fracciones S02 E2E" for "7°A E2E", due in 2 days
  Then an ASSIGNMENT channel "Fracciones S02 E2E" exists for it: students only, students may reply, public replies
  And it opens with a pinned post by the teacher: "Preguntas sobre «Fracciones S02 E2E». Pregunten aquí; todos ven las respuestas."
  And Ana and Beto see it in their channels list; their parents don't

Scenario: students ask under the pinned post @FR-COM-003.17
  When Ana replies "¿Se simplifica cada resultado?" under the pinned post
  Then Beto sees her reply
  And Ana gets 403 if she tries to publish a post of her own (BR-COM-003.1)

Scenario: audience follows the assignment's groups @BR-COM-003.10
  Given an assignment dated only for "8°A E2E"
  Then students of "7°A E2E" don't see its channel

Scenario: it closes 3 days after the latest due date @FR-COM-003.18 @BR-COM-003.11
  Given an assignment due in 7°A yesterday and in 7°B in 2 days
  Then its channel's closesAt is 5 days from now
  When its latest date is moved to 4 days ago
  Then the channel is listed as archived and is still readable
  And a reply gets 403 with the archived message

Scenario: managers keep control @FR-COM-003.18
  When the teacher archives the channel early, or turns replies private
  Then that applies as for any channel (FR-COM-003.5)

Scenario: existing assignments get one @BR-COM-003.13
  Given an assignment created before S02 shipped, due tomorrow, and another due a week ago
  When the backfill runs
  Then the first has its Q&A channel and pinned post, and the second has none
  And running it again creates nothing new

Scenario: only through its assignment @BR-COM-003.10
  When anyone POSTs /channels with scope ASSIGNMENT
  Then they get 400
  When the assignment is deleted
  Then its channel is deleted with it

Scenario: another organization
  Given a teacher of another organization
  Then they never see or manage the channel (404 / 403 as for any channel)
```

## Layers touched
- [ ] Prisma migration:
  - `ChannelScope` gains `ASSIGNMENT`;
  - `Channel` gains `assignmentId String? @unique` (relation to `Assignment`, `onDelete: Cascade`) and `closesAt DateTime?`;
  - `ChannelPost` gains `pinned Boolean @default(false)`.
  - **Backfill (BR-COM-003.13, decided 2026-11-25):** a second migration, `20261125120100_assignment_channels_backfill`, inserts a Q&A channel and pinned post (same text as `ensureFor`) for each assignment whose latest date + 3 days is still ahead, skipping assignments that have one. It is separate because Postgres can't use a new enum value in the transaction that added it.
- [ ] Nest, COM (`apps/dashboard-backend/src/app/communication`):
  - `channel-audience.ts`: the `ASSIGNMENT` case in `channelStudentWhere`, `memberChannelWhere` and the manager checks (as `COURSE`, for the assignment's course).
  - A single `isClosed(channel)` = `archivedAt || closesAt <= now`, replacing each `archivedAt` check (post, reply, `canReply`, `memberCanReply`). `summary()` lists a closed channel as `archived`.
  - `ChannelsService.create` refuses `ASSIGNMENT` (`400`). A new `AssignmentChannelsService.ensureFor(assignmentId)` creates the channel and its pinned post in one transaction, authored by the assignment's teacher, and is idempotent (`assignmentId` is unique; a concurrent duplicate returns the existing channel). `syncCloseTime(assignmentId)` recomputes `closesAt`.
  - `channels/targets` never offers `ASSIGNMENT`.
  - Posts come back pinned first, then newest first.
- [ ] Nest, ASM (`assignments.service.ts`): after `create`, call `ensureFor`; after `update` (which may add dates), call `syncCloseTime`. Deleting cascades. This is the only change outside COM.
- [ ] Shared (`libs/shared/src/lib/communication.ts`): `ChannelScopeKey` and `CHANNEL_SCOPE_LABELS` gain `ASSIGNMENT: 'Asignación'`; `ChannelSummary` gains `assignmentId` and `closesAt`; `ChannelPost` gains `pinned`.
- [ ] OpenAPI: no change. The communication contracts are the shared types in `libs/shared`, not OpenAPI schemas; regenerating only reorders paths.
- [ ] Angular (`communication/`): the channel page shows *"Fijado"* on the pinned post, *"Cierra el dd/mm/aaaa"* while open, and *"Este canal de preguntas cerró el dd/mm/aaaa"* once closed; the create form never offers `ASSIGNMENT`. Nothing in ACA yet (that's ACA-001-S21).
- [ ] Tests:
  - Nest unit: audience by assignment groups; `400` on direct create; idempotent `ensureFor`; `closesAt` from the latest date + 3 days and recomputed on update; closed refuses posts and replies; cross-tenant refusal.
  - Playwright `communication/assignment-channels.after.spec.ts` (`@FR-COM-003.17 @FR-COM-003.18`). It creates its assignments through the API. Use an `after` spec, because new channels change channel counts other specs assert.

## Out of scope for this slice
- Showing them on the course page: the *Preguntas por asignación* group and the assignment card (ACA-001-S21).
- A question count on assignment rows and on the assignment page.
- *Por responder* (COM-003-S03).
- Reopening a closed channel: managers can only archive, or move the assignment's dates.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] OpenAPI client regenerated
- [ ] FRD slice table + `capabilities.md` updated
