# ACA-001-S12 — Admin manages a course roster

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.19; BR-ACA-001.15 (manual enrollments, exclusions) |
| **Status** | In review |
| **Branch** | `feat/ACA-001-S12-course-roster-admin` |
| **Estimate** | 1.5 days |

## User-visible outcome
"As a school admin, I open a course's Participantes tab, choose *Gestionar estudiantes*, and see every student with how they got there. I add a student from another group for an elective, and remove a student who is exempt."

## Acceptance criteria
```gherkin
Scenario: the roster with origins
  When an admin opens Participantes on a course and chooses "Gestionar estudiantes"
  Then each student shows "Plan de estudio" or "Agregado" (with who added them)
  And students removed from a plan course show "Excluido" with "Restaurar"

Scenario: an elective
  When the admin searches "Beto" and chooses "Agregar"
  Then Beto is on the roster as "Agregado" and the course appears in his Mis cursos
  And only active students of the course's school are offered; another school's student gets 400

Scenario: an exemption
  When the admin removes a plan student
  Then they show "Excluido", disappear from Participantes, Mis cursos, attendance and the gradebook
  And their grades and submissions are kept; "Restaurar" brings them back
  And removing a manual student deletes the enrollment

Scenario: refusals
  Then a teacher (no MANAGE_COURSES) gets 403 on every roster route, and so does an admin of another organization
```

## Decisions
- **Routes** (`MANAGE_COURSES`; course in the caller's organization, `403` otherwise):
  - `GET /courses/:id/roster`: every enrollment, excluded ones included (last), then by name;
  - `GET /courses/:id/roster/candidates?search=`: up to 20 active students of the course's school who aren't actively enrolled, by name or document id;
  - `POST /courses/:id/roster { studentId }`: a new MANUAL row, or restores an excluded PLAN row; already enrolled: no change;
  - `DELETE /courses/:id/roster/:studentId`: deletes a MANUAL row, excludes a PLAN row; not on the roster: `404 El estudiante no está en este curso`.
- **Eligibility:** a student of another organization or school gets `400 El estudiante no pertenece a la escuela de este curso`. Students of any group of the school can be added.
- **No confirmation step** on removal: it's undone with *Restaurar* (plan) or *Agregar* (manual), and grades are never deleted.
- **Where:** a *Gestionar estudiantes* button on the Participantes tab, for admins only; the dialog reloads Participantes when it closes after a change.

## Layers touched
- [x] **Nest:** `course-roster-admin.service.ts`, four routes in `courses.controller.ts`, `dto/roster-add.input.ts`. Readers already go through `enrolledIn` / `ACTIVE_ENROLLMENT` (S11), so exclusions apply everywhere.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** `courses/course-roster-dialog.ts`; the button on the course page's Participantes tab.
- [x] **Tests:**
  - Nest: list with origins, add (MANUAL, idempotent), another school (400), remove (exclude PLAN, delete MANUAL, 404), restore, another organization (403), route permissions;
  - Playwright `@FR-ACA-001.19 @BR-ACA-001.15` (`after` project), on Ciencias 8°: Beto added as an elective; a student created in 8°A excluded (gone from Participantes) and restored; a manual row deleted; a teacher gets 403.

## Out of scope for this slice
- Bulk add (a whole group) and a roster view in the admin course list.

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
