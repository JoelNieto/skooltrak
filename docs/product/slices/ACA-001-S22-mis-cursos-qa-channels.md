# ACA-001-S22 — *Mis cursos* counts assignment Q&A channels

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.23, FR-ACA-001.24; BR-ACA-001.17 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S22-mis-cursos-qa-channels` |
| **Estimate** | 0.25 day |
| **Decided** | 2026-11-25: assignment Q&A channels count in *Mis cursos*, as in the course's *Canales* tab |

## User-visible outcome
"As a student or parent, a new question or answer in an assignment's Q&A channel shows on that course's card in *Mis cursos*, like any other new channel post."

## Acceptance criteria
```gherkin
Scenario: the card and the stat include Q&A channels @FR-ACA-001.23 @FR-ACA-001.24
  Given the teacher creates an assignment for Ana's group, so its Q&A channel opens with an unread pinned post
  When Ana opens Cursos
  Then her course's card shows the unread posts of its course channels and its open Q&A channels, as the Canales tab counts them
  And "Nuevo en canales" includes them

Scenario: closed Q&A channels don't count
  Given an assignment's Q&A channel has closed (BR-COM-003.11)
  Then its unread posts no longer count on the card or the stat
```

## Layers touched
- [ ] Prisma, Nest, OpenAPI: **none**.
- [ ] Angular: `unreadByCourse()` in `courses/course-channels.ts` also counts `ASSIGNMENT` channels of the course, skipping archived or closed ones. The card badge, its accessible name and the stat all read it.
- [ ] Tests:
  - Web unit (`course-channels.spec.ts`): Q&A channels counted per course, closed ones not.
  - Playwright: in `courses/course-channels.after.spec.ts`, the S21 block's first student test (`@FR-ACA-001.23`) checks the card right after the Q&A channel is created, before Ana opens it. The spec's `expectedUnread()` now counts Q&A channels for *Mis cursos* too.

## Out of scope for this slice
- A question count on assignment rows and on the assignment page.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused: no new endpoint; COM-003's membership rules (BR-COM-003.10) decide which Q&A channels a viewer has
- [ ] FRD slice table + `capabilities.md` updated
