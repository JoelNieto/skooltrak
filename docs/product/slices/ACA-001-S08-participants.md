# ACA-001-S08 — Participantes tab

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.15, .11 (head count); BR-ACA-001.13 |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S08-participants` |
| **Estimate** | 1 day |

## User-visible outcome
"As a student, I see who teaches the course, who my homeroom teacher is, and my classmates. As a parent, I see my child's teachers. As a teacher, I see the course's students."

## Acceptance criteria
```gherkin
Scenario: a student
  When Ana opens Participantes
  Then she sees the course teacher ("Docente") and her homeroom teacher ("Docente consejero")
  And her classmates' full names and initials only, never email, codes or contact details
  And a search filters by name
  And the tab reads "Participantes · {n}"

Scenario: a parent
  Then a parent sees the teachers only; the API returns no student rows (BR .13)

Scenario: staff
  Then the course's teacher and admins see its roster
  And a homeroom teacher with read-only access sees only their group's students (BR .16)
```

## Decisions
- **One person, two roles:** when the course teacher is also the student's homeroom teacher, they appear once with both labels.
- **Staff** see the course teacher, not every student's homeroom teacher.
- The roster is the course's active enrollments (BR .15), ordered by first name. Search ignores case and accents.
- **The head count** is everyone listed for the viewer, so parents see the number of teachers.

## Layers touched
- [x] **Nest:**
  - `GET /courses/:id/participants?studentId=` (BR .3 access), in `course-page.service.ts`;
  - the HOMEROOM viewer carries the teacher's user id to scope the roster.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** `courses/course-participants.ts`; the tab count, for families and staff, replaces the placeholder.
- [x] **Tests:**
  - Nest: a student (both roles, names only), a parent (no students), staff, homeroom scope;
  - Playwright `@FR-ACA-001.15 @BR-ACA-001.13`: Ana sees the teacher and classmates, search narrows to Beto, a parent's API response has no students.

## Out of scope for this slice
- The homeroom teacher's *"Cursos de {grupo}"* (S13); teacher customization (S09).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
