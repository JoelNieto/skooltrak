# ASM-001-S01 — Lock down grade, student-grade and bucket endpoints

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.15, BR-ASM-001.1, BR-ASM-001.9 (unpublish), BR-ASM-001.13. Resolves Q10, Q6 |
| **Status** | Ready |
| **Branch** | `feat/ASM-001-S01-lock-down-grade-endpoints` |
| **Estimate** | 2 days |

## User-visible outcome
"As a school, I know that only a course's teacher or an admin can change its grades. Students and parents can read only their own or their children's published grades, even through the API."

## The gap (from code, not reproduced against a running app)
- `grades.controller.ts`, `student-grades.controller.ts` and `grade-buckets.controller.ts` have no `@RequirePermissions`. The global `PermissionsGuard` allows routes without metadata (`libs/auth/src/lib/auth.guard.ts:200`).
- Their services read and write by id, with no `organizationId` and no ownership filter.
- So any signed-in user can:
  - `PATCH /api/v1/student-grades` with any id and score;
  - `PATCH /api/v1/grades` to publish or unpublish any column;
  - read any student's grades via `GET /student-grades/by-course/:courseId?studentId=` and `GET /student-grades/average`.

## Rules
| Endpoint group | Permission | Who passes |
|---|---|---|
| `GET` grades / buckets of a course | `VIEW_GRADES` | The course's teacher; an admin in the org. Students and parents of the course see **published** grades only |
| `GET /student-grades/*` with `studentId` | `VIEW_GRADES` | That student; a parent linked to them; the course's teacher; the student's **homeroom** teacher (published only, ACA-001 BR .16); an admin in the org |
| `POST` / `PATCH` / `DELETE` grades, student-grades, buckets | `MANAGE_GRADES` | The course's teacher (BR-HOM-001.7); an admin in the org |
| `PATCH /grades` with `published: false` on a published grade | `MANAGE_GRADES` | **Admins only**; teachers get `403 Solo un administrador puede despublicar calificaciones` (Q6) |
| `GET /grades` (all, unscoped) | — | **Removed.** Neither `web-dashboard` nor `web-admin` calls it; their only `/api/v1/grades` calls are `POST` and `PATCH` |

The course is always the one that owns the record: `grade.courseId`, `studentGrade.grade.courseId` or `bucket.courseId`, never a value from the request body. Refusals:
- wrong role or not the owner: `403 Solo puedes calificar tus propios cursos` (writes) or `403 No puedes ver estas calificaciones` (reads);
- another organization: `403`.

## Acceptance criteria
```gherkin
Scenario: student cannot change a score
  Given student S has a StudentGrade row G in course C
  When S sends PATCH /api/v1/student-grades { id: G, score: 5 }
  Then the API responds 403 and G is unchanged

Scenario: student cannot read a classmate's grades
  When S requests GET /api/v1/student-grades/by-course/C?studentId=<classmate>
  Then the API responds 403

Scenario: student reads own published grades
  When S requests GET /api/v1/student-grades/by-course/C?studentId=<S>
  Then the API responds 200 with published grades only

Scenario: parent reads a linked child only
  Given parent P is linked to S only
  Then P gets 200 for S and 403 for any other student

Scenario: teacher of another course
  Given teacher T2 does not teach C
  When T2 sends PATCH /api/v1/grades to publish a grade of C
  Then the API responds 403

Scenario: homeroom teacher reads a homeroom student's published grades
  Given teacher H is homeroom teacher of S's class group and does not teach C
  When H requests GET /api/v1/student-grades/by-course/C?studentId=<S>
  Then the API responds 200 with published grades only
  And a request for a student outside H's homeroom group gets 403

Scenario: only admins unpublish
  Given grade column G of course C is published
  When C's teacher sends PATCH /api/v1/grades { id: G, published: false }
  Then the API responds 403 and G stays published
  When an admin sends the same request
  Then G is unpublished

Scenario: cross-tenant admin
  Given admin A of organization O1 and course C in organization O2
  When A calls any grade, student-grade or bucket write for C
  Then the API responds 403

Scenario: existing pages keep working
  Given the course's teacher
  Then course-grades, grade detail, grade form, student grade form and weights load and save as before
  And a student's course grades tab still shows their published grades
```

## Layers touched
- [ ] **Prisma:** none.
- [ ] **Nest:**
  - a shared `GradeAccessService` in `grades/` with `assertCanReadCourse`, `assertCanWriteCourse` and `assertCanReadStudent`, reusing the teacher, student and parent resolution from `home/` (BR-HOM-001.7–.9);
  - `@RequirePermissions` on every handler of the three controllers;
  - service queries filter by `organizationId`;
  - remove `GET /grades`.
- [ ] **OpenAPI:** `bun run openapi:orval`, since the removed route and the 403 responses are documented.
- [ ] **Angular:** handle `403` in the affected pages with the standard error state. In `grades/grade.ts` and `grades/grades-form.ts`, the *Publicada* switch can no longer be turned off once a column is published unless the user is an admin.
- [ ] **Tests:**
  - Nest unit tests per rule above, including cross-tenant refusal;
  - extend `auth-guards.spec.ts` so it fails if a controller in `grades`, `student-grades` or `grade-buckets` has an unguarded handler;
  - Playwright `@FR-ASM-001.15`: student `PATCH` refused; teacher edits a score in the existing UI.

## Out of scope for this slice
- The new gradebook (S02 onwards).
- The same audit for other modules. Record any finding as a new open question in its own context's FRD.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] FRD slice table + `capabilities.md` updated
