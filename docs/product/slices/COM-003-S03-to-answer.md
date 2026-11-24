# COM-003-S03 — *Por responder* for managers

| | |
|---|---|
| **FRD** | [COM-003](../frd/COM-003-channels-and-direct.md) |
| **Implements** | FR-COM-003.19; BR-COM-003.12 |
| **Status** | Ready |
| **Branch** | `feat/COM-003-S03-to-answer` |
| **Estimate** | 1.5 days |
| **Decided** | 2026-11-25 (ACA-001 Q11) |

## User-visible outcome
"As a teacher, my channels list tells me how many questions are waiting for my answer in each channel."

## Acceptance criteria
```gherkin
Background:
  Given the teacher manages a PRIVATE channel "Preguntas S03 E2E" and a PUBLIC channel "General S03 E2E", each with one post

Scenario: private conversations waiting for a manager @FR-COM-003.19 @BR-COM-003.12
  When Ana and Beto each reply in "Preguntas S03 E2E"
  Then the teacher's channels list shows "2 por responder" on it
  When the teacher answers Ana's conversation
  Then it shows "1 por responder"
  When Ana replies again
  Then it shows "2 por responder"

Scenario: public replies newer than the latest manager reply @BR-COM-003.12
  When Ana and Beto reply under the post in "General S03 E2E"
  Then it shows "2 por responder"
  When an admin of the organization replies in that thread
  Then it shows no count (any manager's reply answers it)
  When Carla replies afterwards
  Then it shows "1 por responder"

Scenario: members and closed channels @BR-COM-003.12
  Then GET /channels returns toAnswer 0 for students and parents
  And an archived or closed channel shows no count
```

## Layers touched
- [ ] Prisma migration: **none**. Optional index on `ChannelReply (postId, createdAt)` if the query plan needs it.
- [ ] Nest (`communication/channels.service.ts`):
  - `list()` computes `toAnswer` for the channels the caller manages, in one grouped query per kind (private threads, public threads), not one per channel (COM-003 §8);
  - a manager reply is one by any user who is a manager of that channel when it is counted (`managerIdsAmong`);
  - members and closed channels get `0`.
- [ ] Shared: `ChannelSummary.toAnswer: number`.
- [ ] OpenAPI → `bun run openapi:orval`.
- [ ] Angular (`communication/channels.ts`): managers' rows show `<span uiBadge tone="new" size="sm">{n} por responder</span>`. (The course page's *Canales* tab shows it in ACA-001-S20.)
- [ ] Tests:
  - Nest unit: both kinds; any manager answers; a member's newer reply reopens; members `0`; closed `0`; cross-tenant.
  - Playwright `communication/to-answer.after.spec.ts` (`@FR-COM-003.19`).

## Out of scope for this slice
- The sidebar's unread badge stays member-only (FR-COM-003.15).
- Notifications for questions waiting.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] OpenAPI client regenerated
- [ ] FRD slice table + `capabilities.md` updated
