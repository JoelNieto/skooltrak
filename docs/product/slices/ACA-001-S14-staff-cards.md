# ACA-001-S14 — Staff course cards

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.9; BR-ACA-001.14 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S14-staff-cards` |
| **Estimate** | 0.5 day |

## User-visible outcome
"As a teacher or admin, my *Cursos* cards look like the students' ones without the personal progress: the cover, the subject's area, the course name, the study plan and the teacher."

## Acceptance criteria
```gherkin
Scenario: the staff card
  Given the subject "Matemáticas" has the area "Ciencias exactas"
  When the teacher of "Matemáticas 7°" opens Cursos
  Then its card shows the cover, "Ciencias exactas", "Matemáticas 7°", its study plan and its teacher
  And it shows no average, progress or next delivery

Scenario: no area
  Given a subject with no area
  Then its courses' cards show no area chip

Scenario: Cursos de {grupo}
  Given a homeroom teacher's "Cursos de {grupo}" section (S13)
  Then its cards show the area chip too, next to "Solo lectura"
```

## Decisions
- **Title:** staff cards are titled with the course's name, like the students' cards, instead of the subject's name. Several courses of one subject (one per grade) were indistinguishable.
- **Placement:** the area chip sits top-left on the cover; the study plan badge (or *Solo lectura*) stays top-right.
- **API:** `GET /courses` and `GET /courses/homeroom` return `subject.area`.
- **Filter chips** (FR .7) stay on the students' and parents' *Mis cursos*; FR .9 asks only for the card.

## Tests
- `course-homeroom.spec.ts`: the homeroom section carries the subject's area.
- `course-area.after.spec.ts` `@FR-ACA-001.9`: the teacher's *Cursos* card shows the area set by the admin.
- `course-appearance.spec.ts`: staff cards are found by the course's name.
