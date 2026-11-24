# ACA-001-S17 — "Preguntar en el curso"

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.25 (Q9 (a)); BR-ACA-001.18 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S17-ask-in-course` (built on S15) |
| **Estimate** | 0.5 day |

## User-visible outcome
"As a student, I can go straight from the course page to the course's conversation and ask my question there."

## Acceptance criteria
```gherkin
Scenario: the button opens the course conversation @FR-ACA-001.25
  Given "Matemáticas 7° E2E" has an open COURSE channel where students reply in public
  When Ana opens the course page
  Then the header shows "Preguntar en el curso"
  When she presses it
  Then she is on that channel's page, where she replies under the latest post (FR-COM-003.10)

Scenario: several conversations
  Given the course has two open course conversations and an archived one with a newer post
  Then "Preguntar en el curso" opens the open one with the latest post

Scenario: none
  Given the course has only announcement channels, or only archived conversations
  Then the header shows no "Preguntar en el curso"

Scenario: students only
  When Ana's parent, the course's teacher or a homeroom teacher opens the course page
  Then the header shows no "Preguntar en el curso"
```

## Layers touched
- [ ] Prisma, Nest, OpenAPI: **none**. It uses S15's channel list.
- [ ] Angular: `askChannel()` in `courses/course-channels.ts`: the first non-archived *Conversación del curso* channel of S15's sorted list. `course.ts` renders an `<a uiButton variant="primary">` next to *Ver calendario*, for `STUDENT` viewers only.
- [ ] Tests:
  - Web unit (`course-channels.spec.ts`): latest open conversation wins; archived and private-reply channels are skipped; null when none.
  - Playwright: a block in `courses/course-channels.after.spec.ts` (`@FR-ACA-001.25`). It covers the real channel, a stubbed list for "latest wins" and "none", and the parent.

## Out of scope for this slice
- Starting a new post as a student: COM-003 keeps posting for managers (Q9 decided (a)).
- Assignment Q&A channels (Q10, COM-003 first).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused. No new endpoint; COM-003 refuses replies where the audience can't reply (BR-COM-003.5).
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
