# ACA-001-S05 — Family view of *Mis cursos*

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.8, BR-ACA-001.2 |
| **Status** | Done: #69 (2026-11-22) |
| **Branch** | `feat/ACA-001-S05-parent-courses` |
| **Estimate** | 1 day |

## User-visible outcome
"As a parent, *Cursos* shows my child's courses: the same cards, averages, progress and stats the child sees. I switch between my children with the switcher I use on my home page."

## Acceptance criteria
```gherkin
Scenario: a parent's view
  Given parent P is linked to Ana and Beto
  When P opens "Cursos" and picks Beto
  Then the page reads "Cursos de Beto" with Beto's cards, averages, progress and stats
  And the selection is the one the parent home uses (ParentContext)

Scenario: only linked children
  When P requests a child they are not linked to
  Then the API answers 403 "No puedes ver la información de este estudiante"

Scenario: students
  Then a student's studentId is ignored: they always get their own courses
```

## Decisions
- **The switcher shows only with two or more children.** With none, the page reads *"Sin hijos vinculados"*. It starts on the child chosen on the parent home, otherwise the parent home's default (BR-HOM-001.9).
- **A linked child counts in any organization** (BR-HOM-001.9): the link decides, not the parent's current organization.
- Switching children goes back to the current period and to *Todas*.

## Layers touched
- [x] **Nest:** `GET /courses/mine` takes `studentId`. The caller's own student record comes first; otherwise the child must be linked to the caller (403).
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** *Cursos* shows *Mis cursos* to parents, with the child switcher sharing `ParentContext`.
- [x] **Tests:**
  - Nest: a linked child (any organization), not linked → 403, no `studentId` → 403, a student's `studentId` ignored;
  - Playwright `@FR-ACA-001.8 @BR-ACA-001.2`: switching to Beto shows his 2.0 *En riesgo*, Ana shows 4.0, and Carla (not linked) gets 403.

## Out of scope for this slice
- The course page for parents (S06), *Participantes* (S08).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
