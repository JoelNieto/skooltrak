# COM-002-S07 — Course audiences follow the course roster

| | |
|---|---|
| **FRD** | [COM-002](../frd/COM-002-broadcasts.md) |
| **Implements** | FR-COM-002.1; BR-COM-002.7 (revised), BR-COM-002.8 (new) |
| **Status** | In review |
| **Branch** | `feat/COM-002-S07-roster-audience` |
| **Estimate** | 0.5 day |

## User-visible outcome
"As a teacher, a course broadcast reaches exactly the students on my course, electives included, and their parents. The groups I can message are the ones my students are in."

## Background
[ACA-001](../frd/ACA-001-course-experience.md) made the course roster (`CourseEnrollment`, BR .15) the source of truth for a course's students, and left a follow-up slice in COM-002 to use it. While doing this, course broadcasts turned out never to have worked: recipients were looked up with `Student.courseId`, a field that has never existed, so every `COURSE` broadcast failed with `500` (Prisma: *Unknown argument `courseId`*). No test created one.

## Acceptance criteria
```gherkin
Scenario: a course broadcast reaches the roster
  Given Ana is on the roster of Matemáticas 7°, taught by Tomás
  When Tomás sends a COURSE broadcast to Matemáticas 7°
  Then it is created (201) and Ana and her parents receive it

Scenario: electives and exclusions
  Given an admin added Bruno (9°B) to Matemáticas 7° and excluded Carla (7°A) from it
  When Tomás sends a COURSE broadcast to Matemáticas 7°
  Then Bruno receives it and Carla does not
  And 9°B is now one of Tomás's groups for CLASS_GROUP broadcasts

Scenario: homeroom still doesn't count
  Given Tomás is homeroom teacher of 8°A and none of its students are on his courses
  Then 8°A is not in his picker, and a CLASS_GROUP broadcast to it gets 403
```

## Decisions
- **Related groups** (BR .7): a class group with at least one student actively on one of the teacher's course rosters (`teacherRosterClassGroupWhere`). Before, it was any group whose study plan contained one of the teacher's courses. The two differ only for electives (their students' groups become related) and exclusions (a group leaves when none of its students is left on the roster). A `CLASS_GROUP` broadcast still reaches the whole group.
- **Course recipients** (BR .8): `enrolledIn(course)`, the roster's active rows, and those students' parents.
- **HOM-001 keeps the study-plan rule** (`teacherClassGroupWhere`) for the teacher home until its own follow-up slice.
- Withdrawn students are not filtered out of group or course broadcasts. That behavior is unchanged here.

## Tests
- `communication-broadcast-audience.spec.ts`: the related-group filter is the roster one; a course broadcast queries the roster.
- `broadcast-audience.spec.ts` `@BR-COM-002.7`: a teacher's course broadcast returns 201 and reaches the enrolled student (it returned 500 before this slice).
