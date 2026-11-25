# ACA-001-S20 — *Por responder* in the course's Canales tab

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.28; BR-ACA-001.17 |
| **Status** | Done (#89) |
| **Branch** | `feat/ACA-001-S20-to-answer` |
| **Estimate** | 0.5 day |
| **Design** | Canvas "Skooltrak — Courses redesign (desktop)", board *Course channels — teacher* |

## User-visible outcome
"As the course's teacher, the course's Canales tab tells me where students are waiting for my answer."

## Acceptance criteria
```gherkin
Scenario: per channel and on the tab @FR-ACA-001.28
  Given Ana asked in the course's private channel and Beto replied in its public one, and no manager has answered
  When the course's teacher opens the course page
  Then the "Canales" tab shows "2 por responder"
  And each of those rows shows "1 por responder"
  When the teacher answers Ana inside the tab
  Then the row's count clears and the tab shows "1 por responder"

Scenario: only managers @FR-ACA-001.28
  When Ana opens the course page
  Then she sees unread counts (FR-ACA-001.21), never "por responder"
```

## Layers touched
- [ ] Prisma, Nest, OpenAPI: **none** (COM-003-S03 provides `toAnswer`).
- [ ] Angular (`courses/`):
  - `course-channels.ts`: a `toAnswerTotal(channels)` helper, open channels only.
  - `course-channels-list.ts`: managers' rows show `{n} por responder` (`tone="new"`) where members see unread counts.
  - `course.ts`: the staff *Canales* tab label shows the total.
  - Reload the list when the embedded channel's replies change: `app-channel` re-emits `ChannelReplies.changed` as a new `changed` output, and the course page reloads its channel list on it.
  - A row shows *"{n} por responder"* in place of the unread count, so it never shows both (members always get `toAnswer: 0`).
- [ ] Tests: web unit for `toAnswerTotal`; Playwright in `courses/course-channels.after.spec.ts`, teacher block (`@FR-ACA-001.28`). It follows S19's unanswered private question, checks the tab and row counts against the API's, answers inside the tab, and sees the row clear.

## Out of scope for this slice
- Counts on the staff *Cursos* cards.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused: members get `toAnswer: 0` (COM-003-S03 test)
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
