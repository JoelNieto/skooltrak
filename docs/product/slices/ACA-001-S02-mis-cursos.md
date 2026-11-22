# ACA-001-S02 — Student *Mis cursos*: cards with schedule, teacher, average and period switcher

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.4 (cover, name, schedule, teacher, average), .5; BR-ACA-001.1, .4, .5, .9 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S02-mis-cursos` |
| **Estimate** | 2–3 days |

## User-visible outcome
"As a student, *Cursos* shows a card per course I'm enrolled in: its color and icon, when and where it meets, my teacher, and my average for the period with whether I'm on track. I can switch the period."

*Próxima entrega*, the progress bar and the stats row are ACA-001-S03; the parent view is S05; area chips are S04.

## Acceptance criteria
```gherkin
Scenario: a student's cards
  Given student Ana is enrolled in "Matemáticas 7° E2E", which meets her group every weekday in "Aula 7"
  When Ana opens "Cursos"
  Then she sees one card per enrolled course, ordered by subject name
  And the card shows the course's cover, name, "Todos los días · Aula 7" and the teacher
  And "Promedio" shows her period average on the plan's scale with "Al día" or "En riesgo"

Scenario: period switcher
  Then a period switcher lists the current year's periods, defaulting to the current one
  And choosing another period reloads the averages

Scenario: no average
  Given Ana has no published score in a course this period
  Then its card reads "Sin notas"
  And a course whose plan has no grade scale reads "Escala de notas no configurada"

Scenario: no group, no courses
  Given a student with no class group and no enrollment
  Then "Cursos" reads "Aún no tienes grupo asignado"

Scenario: list tenancy (BR .4)
  When anyone calls GET /api/v1/courses with a schoolId of another organization
  Then the API answers 403
```

## Decisions
- **Card schedule** is the days and the place, e.g. *"Lun, Mié, Vie · Aula 7"* (BR .9). The time range is for the course page header (FR .10).
- **Band**: *"En riesgo"* below the pass mark, *"Al día"* otherwise (BR .5). The thresholds and the formula are those of the home pages (BR-HOM-001.1, BR-ASM-001.4, published grades only).
- **Teacher**: name and initials avatar. Photos stay on the staff list until avatars are presigned here too.
- **Staff keep today's list.** Their redesigned cards are FR .9, in a later slice.

## Layers touched
- [x] **Nest** (`courses`):
  - `GET /api/v1/courses/mine?periodId=` (`VIEW_COURSES` + `VIEW_GRADES`, students), in `courses-mine.service.ts`:
    - the student is resolved as in BR-HOM-001.8;
    - courses come from the roster (BR .15);
    - the schedule follows BR .9 (`course-schedule.ts`);
    - averages use `weightedAverages`.
  - `GET /api/v1/courses` and `/count`: a `schoolId` outside the caller's organization → 403 (BR .4).
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** `courses/my-courses.ts` for students on *Cursos*: period switcher, cards, empty states. Staff keep `courses.ts`.
- [x] **Tests:**
  - Nest: schedule text (days, every weekday, location, *Virtual*, recess skipped), cards from the roster ordered by subject, averages and band, no metric, no group, period validation, non-student refused, BR .4 403;
  - Playwright `@FR-ACA-001.4 @FR-ACA-001.5`: Ana's card for *Matemáticas 7° E2E* with schedule, teacher and average.

## Out of scope for this slice
- *Próxima entrega*, progress and stats row (S03); area chips (S04); parents (S05); staff card redesign (FR .9).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
