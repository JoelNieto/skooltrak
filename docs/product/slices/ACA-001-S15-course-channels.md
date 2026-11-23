# ACA-001-S15 — Canales tab and Resumen card on the course page

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.21, FR-ACA-001.22; BR-ACA-001.17, BR-ACA-001.18, BR-ACA-001.19 |
| **Status** | In progress |
| **Branch** | `feat/ACA-001-S15-course-channels` |
| **Estimate** | 1.5 days |

## User-visible outcome
"As a student or parent, my course page shows the course's channels: which ones have new posts, what was said last, and whether I can reply. One click takes me to the channel."

## Acceptance criteria
```gherkin
Background:
  # The spec creates these through the COM-003 API; the course may hold other channels too.
  Given the course "Matemáticas 7° E2E" has the COURSE channels
    | name     | audience          | students can reply | visibility | posts |
    | Anuncios | students, parents | no                 | PRIVATE    | 1     |
    | General  | students          | yes                | PUBLIC     | 2     |
  And the 7° class group has a CLASS_GROUP channel "Grupo 7°"
  And Ana, a student on the course's roster, has read none of those posts

Scenario: the Canales tab lists the course's channels @FR-ACA-001.21
  When Ana opens the course page
  Then the tabs read "Resumen · Asignaciones · Calificaciones · Canales · Participantes · Recursos"
  And the "Canales" tab shows the course's unread count, at least "3 nuevos"
  When she opens "Canales"
  Then she sees "Anuncios" with "Solo anuncios" and "1 nuevo"
  And she sees "General" with "Conversación del curso" and "2 nuevos"
  And each row shows its latest post's preview and time
  And she does not see "Grupo 7°"

Scenario: opening a channel clears its count @FR-ACA-001.21
  When Ana opens "General" from the Canales tab
  Then she is on /communication/channels/<General's id>
  When she goes back to the course page
  Then the "Canales" tab count has dropped by 2
  And "General" shows no unread count

Scenario: archived channels come last @FR-ACA-001.21
  Given the "Anuncios" channel is archived
  When Ana opens "Canales"
  Then "Anuncios" is the last row and shows "Archivado"

Scenario: no channels @FR-ACA-001.21
  Given a course with no COURSE channels
  When a student on its roster opens "Canales"
  Then she sees "Este curso aún no tiene canales"
  And Resumen shows no Canales card

Scenario: the Resumen card @FR-ACA-001.22
  When Ana opens the course page
  Then Resumen shows a "Canales" card with "General" and "Anuncios", latest post first
  When she presses "Ver todos"
  Then the "Canales" tab is selected

Scenario: parents see the channels meant for parents @FR-ACA-001.21
  Given Ana's parent opens the course page with Ana chosen
  When they open "Canales"
  Then they see "Anuncios"
  And they do not see "General", whose audience is students only

Scenario: staff and homeroom @FR-ACA-001.21
  When the course's teacher opens the course page
  Then there is no "Canales" tab and the "Canal" button is still there
  When a homeroom teacher of the 7° group opens the course read-only
  Then there is no "Canales" tab, no Canales card and no "Canal" button

Scenario: the list fails to load
  Given GET /api/v1/communication/channels fails
  When Ana opens "Canales"
  Then she sees an inline error with "Reintentar"
  And the rest of the course page still works
```

## Layers touched
- [ ] Prisma migration: **none**.
- [ ] Nest: **none**. The page reads `GET /api/v1/communication/channels` (COM-003, `COMMUNICATION_VIEW`), which already returns `scope`, `courseId`, the reply settings, `archived`, `unread`, `lastPostAt` and `lastPostPreview` for the caller's channels.
- [ ] OpenAPI: no change.
- [ ] Angular data-access:
  - `courses/course-channels.ts`, a pure helper `courseChannels(list, courseId, viewer)`. It keeps `scope === 'COURSE' && courseId === id`, sorts non-archived first and then by `lastPostAt` descending, and adds the BR .18 kind label for the viewer (`STUDENT` uses `studentsCanReply`, `PARENT` uses `parentsCanReply`).
  - The course page requests the list once, with `httpResource`, only for `family()` viewers who have `COMMUNICATION_VIEW`.
- [ ] Angular UI:
  - `course.ts`: a `Canales` tab (`uiTab value="channels"`) between *Calificaciones* and *Participantes*, with `<span uiBadge tone="new" size="sm">{n} nuevos</span>` when unread > 0.
  - A new `courses/course-channels-list.ts` for the tab panel. Rows are links (`routerLink`) with `libs/ui` `Icon`, `Badge` (`tone="new"` for unread, neutral for *Archivado*), `EmptyState`, and a time via the `time-ago` pipe.
  - `course-overview.ts`: a *Canales* card (≤ 3 rows, the same row component, compact) with *"Ver todos"* emitting `seeAll` to switch to `channels`.
  - Hidden for staff and the homeroom view (BR .19).
- [ ] Tests:
  - Web unit (`course-channels.spec.ts`): the filter excludes other scopes and other courses; ordering; the three kind labels per viewer.
  - Playwright `apps/web-dashboard-e2e/src/courses/course-channels.after.spec.ts` tagged `@FR-ACA-001.21 @FR-ACA-001.22`, covering the scenarios above. The homeroom view is asserted in `course-homeroom.after.spec.ts`.
  - Data: the spec creates its channels and posts through the COM-003 API, as `channels.spec.ts` does, instead of seeding them. It is an `after` spec because `channels.spec.ts` adds a channel to the same course while it runs, so the counts it asserts come from the API. *No channels* and *the list fails* stub `GET /communication/channels` with `page.route`.

## Out of scope for this slice
- Card badges and the *Nuevo en canales* stat on *Mis cursos* (S16).
- *"Preguntar en #general"* (S17, blocked on Q9).
- Assignment Q&A channels (Q10, a COM-003 decision).
- Posting, replying or confirming from the course page: the row opens the COM-003 channel page, which does all of that.
- Polling or live updates: counts refresh when the page loads, as in COM-003.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Wrong-role access refused. No new endpoint, so channel membership and tenancy stay as COM-003 tests them (`channels.service.spec.ts`). The e2e proves that a class-group channel, a students-only channel for a parent, and the staff and homeroom views don't leak into the tab.
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
