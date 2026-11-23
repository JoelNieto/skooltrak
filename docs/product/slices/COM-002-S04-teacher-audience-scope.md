# COM-002-S04 — Teachers can only broadcast to groups/courses they teach

| | |
|---|---|
| **FRD** | [COM-002](../frd/COM-002-broadcasts.md) |
| **Implements** | FR-COM-002.1 (tightened), resolves Q1. Adds BR-COM-002.7 |
| **Status** | Superseded by COM-003 (BR-COM-003.2 keeps the same rule) |
| **Branch** | `feat/COM-002-S04-teacher-audience-scope` |
| **Estimate** | 1 day |

## User-visible outcome
"As a teacher, the audience picker only offers the class groups and courses related to the courses I teach. Even if I call the API directly, I can't message any other class."

## New rule
**BR-COM-002.7**: When the creator's role is `TEACHER`:
- a `COURSE` scope must be one of their courses (`Course.teacherId = teacher.id`);
- a `CLASS_GROUP` scope must be a group **related to a course they teach**, meaning the group's study plan contains at least one of their courses (`ClassGroup.studyPlan.courses` some `teacherId = teacher.id`).

Otherwise the API returns `403 You can only broadcast to your own groups or courses`. School admins (`ORG_ADMIN`, `ADMIN`, `SYSADMIN`) are not restricted.

> Decided 2026-11-13: "a group the teacher teaches" means any group related to the courses the teacher teaches. Being a group's homeroom teacher (`ClassGroup.teacherId`) does **not** by itself grant access.
>
> Why the study plan: `Course` has no class-group link. A course belongs to a `StudyPlan`, and every `ClassGroup` of that plan takes its courses.

## Acceptance criteria
```gherkin
Scenario: teacher broadcasts to a group related to their course
  Given teacher T teaches course C in study plan P
  And class group G belongs to study plan P
  When T creates a CLASS_GROUP broadcast for G
  Then it is APPROVED and G's students and parents receive it

Scenario: teacher targets an unrelated class group
  Given class group H belongs to study plan Q
  And T teaches no course in study plan Q
  When T creates a CLASS_GROUP broadcast for H
  Then the API responds 403 and no thread, participant or delivery is created

Scenario: homeroom alone is not enough
  Given T is the homeroom teacher of class group H
  And T teaches no course in H's study plan
  When T creates a CLASS_GROUP broadcast for H
  Then the API responds 403

Scenario: teacher targets someone else's course
  Given course D is taught by another teacher
  When T creates a COURSE broadcast for D
  Then the API responds 403

Scenario: audience picker
  Given T opens /communication → new broadcast
  Then the class-group list shows exactly the groups whose study plan contains one of T's courses
  # The composer has no "Curso" audience option today; the endpoint also returns T's courses
  # so one can be added without API changes.

Scenario: admin is unrestricted
  Given school admin A
  When A creates a CLASS_GROUP broadcast for any group in the organization
  Then it is APPROVED
```

## Layers touched
- [x] Prisma: none.
- [x] Nest `communication.service.ts` → `createBroadcast` calls `assertTeacherCanTarget` before `resolveRecipients` when `role === 'TEACHER'`. It resolves `teacher` with `findFirst({ where: { userId, organizationId } })`, then:
  - `COURSE`: `course.count({ where: { id: scopeId, organizationId, teacherId: teacher.id } })`
  - `CLASS_GROUP`: `classGroup.count({ where: { id: scopeId, organizationId, studyPlan: { courses: { some: { teacherId: teacher.id } } } } })`
  - A TEACHER user with no `Teacher` record in the organization is refused.
- [x] Nest: `GET /api/v1/communication/broadcasts/audiences?schoolId=` (`COMMUNICATION_BROADCAST`) returns `{ classGroups, courses }`. Teachers get only their own courses and related groups; admins get everything in the school; a teacher with no record gets empty lists; non-staff get 403. It uses the same `where` helpers as the create check, so the picker and the API can't disagree.
- [x] Angular `communication/broadcasts.ts`: the picker loads from that endpoint for every role, replacing `/api/v1/class-groups`. It shows an explanatory empty state, and a 403 on submit shows a specific toast.
- [x] Nest unit tests (`communication/communication-broadcast-audience.spec.ts`, 11 tests): related group allowed, unrelated 403 with nothing created, homeroom not used, other teacher's course 403, no teacher record 403, school-wide unaffected, admin unrestricted, audiences filtering (teacher / no record / admin / non-staff).
- [x] Playwright `@FR-COM-002.1` (`apps/web-dashboard-e2e/src/communication/broadcast-audience.spec.ts`, 4 tests): teacher picker contents, teacher send to related group, API audiences + 403 for homeroom-only group and other teacher's course, admin picker. Runs on the isolated e2e stack (see `docs/product/README.md` → Running e2e tests). **Written, not yet run.**

## Out of scope
- Restricting `STUDENT_GUARDIANS` / `DIRECT` threads (COM-001).
- School-wide audience scoping (COM-002-S05).

## Done checklist
- [x] Acceptance criteria pass at unit level (API scenarios). The picker has not been checked in a running app.
- [x] Cross-tenant / wrong-role access refused (test): every query is filtered by the caller's `organizationId`, and non-staff get 403.
- [x] COM-002 slice table + Q1 marked resolved
- [ ] e2e test tagged `@FR-COM-002.1`: written; mark Done after the first green `bun nx e2e web-dashboard-e2e`
