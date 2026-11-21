# ACA-001-S11 — Course roster: `CourseEnrollment`, backfill, plan sync, readers switched

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.20, BR-ACA-001.15 (sync rules; the admin add/remove/exclude actions are S12) |
| **Status** | In progress |
| **Branch** | `feat/ACA-001-S11-course-roster` (stacked on #38) |
| **Estimate** | 3 days |

## User-visible outcome
"As a school admin, when I import students by CSV into a class group, they are on every course of that group's study plan right away. Their teachers see them in attendance, grades and submissions, and the students see their courses, just like students I create by hand."

Today imported students are on no course roster (`imports.service.ts` never links them), so teachers can't take their attendance or see their submissions.

## Acceptance criteria
```gherkin
Scenario: an imported student is on the plan's courses
  Given class group G belongs to study plan P, and teacher T teaches course C of P
  When school admin A imports a CSV with student S in group G
  Then S is listed when T takes attendance for C and G
  And S is listed on C's submissions for an assignment of C

Scenario: a created student is on the plan's courses
  When A creates student S2 in group G
  Then S2 is enrolled in every course of P, with source PLAN

Scenario: a new course enrolls the plan's students
  Given students S and S2 are in group G of plan P
  When A creates course C2 in plan P
  Then S and S2 are enrolled in C2, with source PLAN

Scenario: changing a student's group moves their plan enrollments
  Given S is in group G (plan P) and has a MANUAL enrollment in course E of plan Q
  When A moves S to group H of plan R
  Then S's PLAN enrollments in P's courses are removed, including excluded ones
  And S is enrolled in every course of R
  And S's MANUAL enrollment in E is kept
  And S's grades and submissions in P's courses are kept

Scenario: changing group within the same plan keeps exclusions
  Given S is in group G of plan P and is excluded from course C of P
  When A moves S to group G2, also of plan P
  Then S stays excluded from C

Scenario: changing a course's study plan re-syncs its roster
  Given course C is in plan P with PLAN enrollments and one MANUAL enrollment of student M
  When A changes C's study plan to R
  Then C's PLAN enrollments are those of R's students
  And M's MANUAL enrollment is kept

Scenario: excluded students are off every list
  Given S is excluded from course C
  Then S is not listed for C in attendance, submissions, grades, the grade report or the student's courses

Scenario: backfill keeps today's rosters
  Given before the migration, S is linked to course C (stored link) and S2 is in C's plan but unlinked (CSV import)
  When the migration runs
  Then S and S2 are both enrolled in C
  And a stored link to a course outside the student's current plan is kept, with source MANUAL
```

## Layers touched
- [ ] **Prisma migration:**
  - `enum EnrollmentSource { PLAN MANUAL }`;
  - `model CourseEnrollment { id, courseId, studentId, source, excluded @default(false), addedById? (User, SetNull), createdAt, updatedAt }` with `@@unique([courseId, studentId])`, `@@index([studentId])`, mapped to `course_enrollments`; cascades with the course and the student;
  - backfill, in order: (1) PLAN rows for every student whose class group's study plan holds the course, same organization; (2) MANUAL rows for stored `_CourseToStudent` links not covered by (1). The migration prints how many MANUAL rows it kept;
  - drop the implicit `Course.students` / `Student.courses` relation (`_CourseToStudent`).
- [ ] **Nest** (`apps/dashboard-backend/src/app/courses/course-roster.ts`): one module owns the roster rules:
  - `enrolledIn(courseIds)` / `enrolledCourses(studentFilter)`: the `where` fragments every reader uses; both skip excluded rows;
  - `syncStudentPlan(db, studentId, classGroupId)`: student created, imported or moved between groups;
  - `enrollPlanStudents(db, courseId)` / `resyncCoursePlan(db, courseId)`: course created, or its study plan changed.
- [ ] **Writers switched:** `courses.service` (create, update with a plan change), `students.service` (create, update), `imports.service` (student rows: the CSV gap), `prisma/scripts/seed-students.ts`, the e2e `prepare-db.ts`.
- [ ] **Readers switched** from the stored link, or from the study-plan rule, to the roster:
  - attendance students; students by course; a student's courses (`findOne`, grades by course, grade report);
  - assignment submissions (enrollment checks and the teacher's list); grade creation (one `StudentGrade` per enrolled student);
  - grade access (`grade-access.service.ts` `enrolledIn`, which today accepts either rule); files access; the student's course list in `courses.service`;
  - HOM-001's student and teacher home queries that read the stored link. HOM-001 and COM-002 queries that use the study-plan rule stay as they are; aligning them is the follow-up in FRD §9.
- [ ] **API shape:** unchanged. `GET /students/:id` still returns `courses`, now read from the roster.
- [ ] **OpenAPI:** `bun run openapi:orval`; expect no client changes.
- [ ] **Tests:**
  - Nest unit tests for `course-roster.ts`: every sync rule above, including same-plan exclusions and MANUAL rows surviving;
  - service specs for the writers: create course, create student, move student, change course plan, CSV import;
  - the migration's backfill, checked against a scratch database;
  - Playwright `@FR-ACA-001.20`: admin imports a student by CSV and the teacher sees them in attendance for the course.

## Out of scope for this slice
- Admin roster screen and the add / remove / exclude actions (S12). Until then `excluded` and MANUAL rows come only from the backfill.
- Switching the HOM-001 and COM-002 study-plan-rule queries to the roster (FRD §9).
- Parent-facing views (S05) and the participants tab (S08).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test): plan sync never enrolls a student in another organization's course
- [ ] FRD slice table + `capabilities.md` updated
