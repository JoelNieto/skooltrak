# ACA-001-S18 — Read, confirm and reply inside the course's Canales tab

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.26; BR-ACA-001.17, BR-ACA-001.20 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S18-channel-in-course` |
| **Estimate** | 2 days |
| **Design** | Canvas "Skooltrak — Courses redesign (desktop)", board *Course channels — student* |

## User-visible outcome
"As a student or parent, I read my course's channels, confirm announcements and reply without leaving the course page."

## Acceptance criteria
```gherkin
Background:
  # As in S15: the spec creates these through the COM-003 API.
  Given "Matemáticas 7° E2E" has the COURSE channels "Anuncios S15 E2E" (students and parents, no replies, a post that requires confirmation)
  And "General S15 E2E" (students, public replies, 2 posts)
  And Ana, a student on the roster, has read none of them

Scenario: choosing a channel opens it beside the list @FR-ACA-001.26
  When Ana opens the course's "Canales" tab
  Then no channel is open, and the pane says "Elige un canal para leerlo"
  # Opening marks posts read, so nothing opens by itself (decided 2026-11-25).
  When she chooses "General S15 E2E"
  Then its posts show beside the list, newest first, with "Nuevo" on the unread ones
  And the URL has "?canal=<General's id>"
  And she is still on /courses/<id>
  And the list and the tab count drop by 2

Scenario: confirming an announcement @FR-ACA-001.26
  When Ana opens "Anuncios S15 E2E" in the tab
  And presses "Confirmar lectura" on its post
  Then the post shows that she confirmed it
  And the teacher's receipts list shows Ana as confirmed

Scenario: replying in a public channel @FR-ACA-001.26
  When Ana opens "General S15 E2E" in the tab
  And replies "¿Sirve un compás de plástico?" under the latest post
  Then her reply shows under that post
  And it is visible to Beto in the same channel

Scenario: no reply box where her audience can't reply @FR-ACA-001.26
  When Ana opens "Anuncios S15 E2E"
  Then there is no reply box

Scenario: deep links @FR-ACA-001.26
  When Ana opens /courses/<id>?canal=<General's id>
  Then the "Canales" tab is selected with "General S15 E2E" open
  When she opens /courses/<id>?canal=<a class-group channel's id>
  Then no channel opens, and the pane says "Elige un canal para leerlo" (BR-ACA-001.17)

Scenario: the Resumen card and "Preguntar en el curso" open it in place @FR-ACA-001.26
  When Ana chooses "General S15 E2E" on the Resumen card
  Then the "Canales" tab is selected with that channel open
  When she presses "Preguntar en el curso"
  Then the "Canales" tab is selected with the channel it picks (FR-ACA-001.25) open

Scenario: full screen @FR-ACA-001.26
  When Ana presses "Abrir en pantalla completa"
  Then she is on /communication/channels/<id>

Scenario: parents @FR-ACA-001.26
  Given Ana's parent opens the course with Ana chosen
  Then "Anuncios S15 E2E" opens in the tab and "General S15 E2E" is not listed

Scenario: phone width
  Given a 390 px wide window
  When Ana chooses a channel
  Then the channel replaces the list, with "Volver a canales"
```

## Layers touched
- [ ] Prisma, Nest, OpenAPI: **none**. It uses COM-003's `GET channels/:id`, `POST channels/:id/read`, `…/confirm` and `…/replies`, through the existing `CommunicationApi`.
- [ ] Angular, COM (`communication/channel.ts`):
  - an `embedded` input that drops `lib-page-header` and its breadcrumbs, and shows a compact header instead: name, kind and audience badges, and *"Abrir en pantalla completa"*;
  - everything else stays as on the channel page (posts, *Nuevo*, confirm, replies, polling, marking read);
  - a `read` output fires after marking read, so the host can refresh its counts.

  This is the only change outside ACA, and it doesn't change the channel page.
- [ ] Angular, ACA:
  - `courses/course-channels-list.ts`: rows become `button`s with `aria-pressed`, a `selectedId` input and a `choose` output. Every use of the list now opens the channel in place.
  - `course.ts`: the *Canales* panel becomes a two-column layout, the list on the left and `<app-channel [id]="openChannelId()" [embedded]="true" />` on the right. It stacks on a phone with *"Volver a canales"*.
  - `openChannelId()` (in `course-channels.ts`) takes the `canal` query param, bound as a component input, when it is one of `courseChannels()`; otherwise it returns none. Choosing a channel updates the query param (`router.navigate` relative to the route, with `queryParamsHandling: 'merge'` and `replaceUrl`). A `?canal=` link opens the page on the *Canales* tab.
  - After `read`, reload the course's channel list (S15's `channelsRes`) and call `CommunicationApi.refreshUnread()` for the sidebar.
  - The Resumen card's rows and *"Preguntar en el curso"* switch to the tab with `canal` set, instead of routing to `/communication/channels/:id`.
- [ ] Tests:
  - Web unit: a new `communication/channel.spec.ts` (the channel page has none yet) covers the embedded mode: no page header, and an *Abrir en pantalla completa* link. `course-channels.spec.ts` covers picking the open channel: the URL id if it is a course channel, else none.
  - Playwright: `courses/course-channels.after.spec.ts`, a new block tagged `@FR-ACA-001.26`, in the same serial file as S15–S17. Replace S15's "opening a channel" test, which expects to land on `/communication/channels/:id`.

## Out of scope for this slice
- Teachers' and admins' tab, with the composer and receipts inside the course (S19).
- *"{n} por responder"* (S20, Q11).
- Assignment Q&A channels and their assignment card (S21, after COM-003-S02).
- Real-time updates: COM-003's polling stays.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused. No new endpoint; COM-003's membership checks apply, and a channel id outside the course's list is never opened (e2e).
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
