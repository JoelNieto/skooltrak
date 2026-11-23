# ACA-001-S13 — Homeroom teacher's read-only view of colleagues' courses

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.18; BR-ACA-001.16 |
| **Status** | Done (#75) |
| **Branch** | `feat/ACA-001-S13-homeroom-view` |
| **Estimate** | 2 days |

## User-visible outcome
"As the homeroom teacher (*docente consejero*) of 8°A, I see *Cursos de 8°A* on Cursos with my colleagues' courses. I open one and follow each of my students: their assignments, published grades, classmates and the course resources, without changing anything."

## Acceptance criteria
```gherkin
Scenario: Cursos de {grupo}
  Given Tomás is homeroom teacher of 8°A, and Ciencias 8° is taught by Olga
  When he opens Cursos
  Then a "Cursos de 8°A" section lists Ciencias 8° with its teacher and his group's student count
  And his own courses stay on his usual list, not in that section

Scenario: the read-only course page
  When he opens Ciencias 8° from that section
  Then he sees "Vista de docente consejero: solo lectura" and a student picker with 8°A's students
  And the tabs are Resumen, Asignaciones, Calificaciones, Participantes and Recursos, for the chosen student
  And Calificaciones shows published grades only
  And there is no gradebook, attendance, weights, "Nueva asignación", "Personalizar", chat or upload
  And work items don't open the assignment page

Scenario: refusals (BR .16)
  Then Participantes lists the teachers and his group's students only
  And asking for a student outside his group gets 403, never another student
  And the gradebook API gets 403
```

## Decisions
- **Viewer:** the HOMEROOM viewer (S06) now carries a student of the group: the requested `studentId`, else the first by name. So `work` and `grades-summary` answer exactly as for that student's parent: published grades only.
- **`GET /courses/homeroom`:** per homeroom group (`ClassGroup.teacherId`), the colleagues' courses its active students are enrolled in, with color, icon, cover, teacher and the group's student count. Groups with none are left out; other roles get `[]`. Teaching a group grants nothing here.
- **Page:** the homeroom view reuses the family tabs. The picker only changes the student-scoped requests (work, grades), not the course itself, so switching students keeps the open tab. Write actions now require the STAFF viewer, not only a permission (`MANAGE_ASSIGNMENTS` and `MANAGE_MESSAGES` are teacher permissions).
- **Resources:** files shared with a homeroom course are listed on its page and open as VIEW, whatever the share's permission (`viewCourseIds` in the files access context); they never grant EDIT.
- **Assignment links** are off in this view: the assignment page is the teacher's working page, not a read-only one.

## Layers touched
- [x] **Nest:** `course-access.service.ts` (HOMEROOM student), `course-homeroom.service.ts` + `GET /courses/homeroom`, `files.service.ts` (view-only homeroom courses).
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** `courses.ts` (*Cursos de {grupo}*); `course.ts` (homeroom banner and picker, STAFF-only actions and panels); `linkable` on the work lists and calendar, `readOnly` on Recursos.
- [x] **Tests:**
  - Nest: homeroom viewer picks the requested or first student and refuses another group's; `homeroom` list per group, empty for others; a homeroom course file is VIEW even when shared with EDIT;
  - Playwright `@FR-ACA-001.18 @BR-ACA-001.16` (`after` project): the section, the read-only page (tabs, picker, no write actions or gradebook, no uploads), the API scope and the 403s.

## Out of scope for this slice
- A read-only assignment page; homeroom groups across organizations.

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
