# ACA-001-S06 — Course page header, Resumen and Asignaciones; course access tightened

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.10, .11, .12 (work and teacher), .13; BR-ACA-001.3, .6 |
| **Status** | Done: #70 (2026-11-22) |
| **Branch** | `feat/ACA-001-S06-course-page` |
| **Estimate** | 3 days |

## User-visible outcome
"As a student or parent, a course page tells me when and where the class meets, what's coming up and how every assignment stands. As the school, nobody outside the course can open it any more."

## Acceptance criteria
```gherkin
Scenario: the header
  When Ana opens her course
  Then the header shows the cover, color dot, name, area chip, her group, the teacher
  And "Todos los días · Aula 7" (with the times when every class shares them)
  And "Ver calendario" opens the assignments calendar

Scenario: tabs for families
  Then students and parents see Resumen · Asignaciones · Calificaciones · Participantes · Recursos, opening on Resumen
  And Asignaciones reads "{n} pendientes"
  And staff keep their tabs

Scenario: Resumen and Asignaciones
  Then Resumen lists the next 3 items, overdue first, and the teacher
  And Asignaciones lists Próximas (soonest first) and Pasadas (most recent first)
  And each row shows its type, "{tipo} · {fecha}" and a status pill (BR .6)

Scenario: access (BR .3)
  Then the course is open to: admins of its organization; its teacher; homeroom teachers of
    enrolled students (read-only); enrolled students; parents of an enrolled, linked child
  And everyone else gets 403 "No tienes acceso a este curso", with a link back to Mis cursos
```

## Decisions
- **A parent's child** comes from the switcher shared with the parent home and *Mis cursos*; without one, the first linked child enrolled in the course. A child in another organization still counts (BR-HOM-001.9). Before this slice, `GET /courses/:id` filtered by the caller's organization and refused such parents.
- **Where BR .3 applies:** `GET /courses/:id` and the new `GET /courses/:id/work`. The grade endpoints already apply their own scope (ASM-001-S01). Attendance, files and assignment lists keep their current checks, to be reviewed with S08 / S13.
- **Resumen's grade summary** arrives with the *Calificaciones* slice (S07). Its *Docente* block shows the course teacher; the homeroom teacher appears in *Participantes* (S08).
- **Resumen's "next 3"** puts overdue items first, then the soonest upcoming, matching *Próxima entrega* (BR .8).

## Layers touched
- [x] **Nest:**
  - `course-access.service.ts` (BR .3 viewer: STAFF, HOMEROOM, STUDENT, PARENT);
  - `course-page.service.ts`:
    - `GET /courses/:id` returns the viewer, the student's group and the schedule (BR .9);
    - `GET /courses/:id/work` returns the student's work with statuses (`workStatus`).
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:**
  - the course page header (area, group, schedule, *Ver calendario*);
  - the family tabs; `course-overview.ts` and `course-assignments-list.ts`;
  - the 403 state;
  - `course-student-grades` takes the parent's child.
- [x] **Tests:**
  - Nest: every viewer kind and each refusal, work split and pending count;
  - Playwright `@FR-ACA-001.10–.13 @BR-ACA-001.3`:
    - Ana's page (group, schedule, Resumen, Asignaciones with *Vencida*);
    - a parent opening Beto's course from *Mis cursos*;
    - 403 for another teacher and for a child who isn't linked.

## Out of scope for this slice
- *Calificaciones* with bucket bars (S07), *Participantes* (S08), homeroom read-only view (S13).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
