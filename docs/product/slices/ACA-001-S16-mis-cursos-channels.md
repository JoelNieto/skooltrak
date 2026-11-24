# ACA-001-S16 — Unread channel posts on *Mis cursos*

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.23, FR-ACA-001.24; BR-ACA-001.17 |
| **Status** | In progress |
| **Branch** | `feat/ACA-001-S16-mis-cursos-channels` (built on S15) |
| **Estimate** | 1 day |

## User-visible outcome
"As a student or parent, *Mis cursos* tells me which courses have new channel posts and how many there are in total, before I open any course."

## Acceptance criteria
```gherkin
Background:
  # As in S15: the spec creates these through the COM-003 API.
  Given Ana has unread posts in the open COURSE channels of "Matemáticas 7° E2E"

Scenario: the card shows the course's unread posts @FR-ACA-001.23
  When Ana opens Cursos
  Then the "Matemáticas 7° E2E" card shows "{n} nuevos" on its cover, top-right
  And its accessible name ends with "{n} mensajes nuevos."
  And archived channels and class-group channels are not counted

Scenario: the stat sums them @FR-ACA-001.24
  When Ana opens Cursos
  Then the stats row shows "Nuevo en canales" with the unread posts across her courses
  And "en {k} curso(s)" under it

Scenario: nothing unread @FR-ACA-001.23 @FR-ACA-001.24
  Given Ana has no unread posts in her course channels
  Then no card shows a badge or "mensajes nuevos"
  And "Nuevo en canales" shows "0" and "Nada nuevo"

Scenario: the list fails to load
  Given GET /api/v1/communication/channels fails
  Then the cards still show, without badges
  And "Nuevo en canales" shows "—" and "No se pudieron cargar los canales"

Scenario: parents
  Given Ana's parent opens Cursos with Ana chosen
  Then the badges and the stat count only Ana's courses' channels meant for parents
```

## Layers touched
- [ ] Prisma migration, Nest, OpenAPI: **none**. The page reads COM-003's `GET /communication/channels` once, only with `COMMUNICATION_VIEW`.
- [ ] Angular data-access:
  - `courses/course-channels.ts` gains `unreadByCourse(list)`, which sums unread posts of open COURSE channels per course, and `newMessages(n)` for the accessible name.
  - A parent's list covers every linked child. The page only reads the counts of the courses it shows.
- [ ] Angular UI (`courses/my-courses.ts`):
  - a `<span uiBadge tone="new" size="sm">` on the cover, top-right (the area chip is top-left);
  - the card's `cardLabel()` closes with *"{n} mensajes nuevos."*;
  - a fourth `lib-stat-card`, *Nuevo en canales*; the row becomes 4 columns at `xl`.
- [ ] Tests:
  - Web unit (`course-channels.spec.ts`): `unreadByCourse` skips archived, other-scope and zero-unread channels; `newMessages` agreement.
  - Playwright: a *Mis cursos* block in `courses/course-channels.after.spec.ts` (`@FR-ACA-001.23 @FR-ACA-001.24`), in the same serial file as S15 so the two never race on the course's channels. *Nothing unread* and *fails* stub the list with `page.route`.
  - `my-courses.spec.ts`: the card-name assertion allows the closing unread note, since `channels.spec.ts` may leave unread posts on the course.

## Out of scope for this slice
- Live updates: counts refresh on page load, as in COM-003.
- Staff cards: COM-003 counts unread posts only for members (BR-ACA-001.19).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused. No new endpoint; COM-003's channel membership and tenancy apply (`channels.service.spec.ts`).
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
