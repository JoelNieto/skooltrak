# ACA-001-S04 — Subject areas and filter chips

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.2 (area), .7; BR-ACA-001.14 |
| **Status** | Done: #68 (2026-11-22) |
| **Branch** | `feat/ACA-001-S04-area-chips` |
| **Estimate** | 1 day |

## User-visible outcome
"As an admin, I give each subject an area, such as *Ciencias* or *Humanidades*. As a student, my course cards show it, and I filter *Mis cursos* by area."

## Acceptance criteria
```gherkin
Scenario: an admin sets an area
  When an admin types "  Ciencias " in the subject form's "Área"
  Then the subject's area is "Ciencias" (trimmed); an empty value clears it

Scenario: chips
  Given Ana's courses have the areas Ciencias (2), Humanidades (1) and none (1)
  Then the chips read "Todas 4", "Ciencias 2", "Humanidades 1", "Otras 1", alphabetically with "Otras" last
  And areas match regardless of case
  And choosing a chip filters the cards, together with the search box

Scenario: on the card
  Then each card's cover shows its subject's area
```

## Decisions
- **The chips appear only when there is something to filter:** at least two groups, areas and *Otras* counted together. With a single group they would all select the same cards.
- **Areas are compared trimmed and case-insensitively**; a chip shows the area as first written.
- The area is at most 60 characters.

## Layers touched
- [x] **Prisma migration:** `Subject.area String?`.
- [x] **Nest:**
  - `POST` / `PATCH /subjects` accept `area`, trimmed; empty means none (`cleanArea`);
  - `/courses/mine` cards carry `subject.area`;
  - the admin backend's `Subject` entity gains `area`.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:**
  - the subject form's *Área*, and the admin subjects table's *Ícono* and *Área* columns;
  - `courses/course-areas.ts` (chips and filter);
  - the chips row and the area badge on *Mis cursos*.
- [x] **Tests:**
  - Nest `cleanArea`;
  - Angular chips: order, counts, *Otras*, case, filtering;
  - Playwright `@FR-ACA-001.7 @BR-ACA-001.14`: an admin sets the area through the API, and Ana's card shows it (no chips with a single area).

## Out of scope for this slice
- Parents (S05). Staff cards (FR .9).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test): `PATCH /subjects` keeps its organization check (existing specs)
- [x] FRD slice table + `capabilities.md` updated
