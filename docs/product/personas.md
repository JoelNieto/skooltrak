# Personas

Personas map 1:1 to the roles seeded in `prisma/scripts/seed-roles-permissions.ts`. When a requirement needs a new persona, add it here first, and add a role and permissions to the seed in the same slice.

| Persona | Role | App | Scope | Primary jobs |
|---|---|---|---|---|
| **Platform admin** | `SYSADMIN` | `web-admin` → `admin-backend` | All organizations | Create and configure organizations, global roles/permissions, grade/habit metrics, periods. |
| **School admin** | `ORG_ADMIN` (`ADMIN` is treated the same by guards) | `web-dashboard` | One organization (all its schools) | Set up schools, study plans, courses and groups; enrol people; finance; run channels; run the store. |
| **Teacher** | `TEACHER` | `web-dashboard` | Assigned courses and class groups | Assignments, quizzes, grades, attendance, files, channels for their courses and groups, direct messages to families. |
| **Student** | `STUDENT` | `web-dashboard` | Self | See schedule, assignments, grades and attendance; submit work; read channels; see own balance. |
| **Parent / guardian** | `PARENT` | `web-dashboard` (`/parent/*`) | Linked children (possibly across schools) | Follow each child's progress, attendance and finances; read channels, reply to staff's direct messages. |

Every persona above also includes the **prospective user**: someone who signed up but hasn't finished onboarding (no organization or no role). They only see `/onboarding/*` (choose path, join school, create school, connect child, waiting approval).

## Permission matrix (seeded defaults)

`●` manage/write · `○` view only · `—` none. `SYSADMIN` and `ORG_ADMIN` hold every permission, and the API also lets them pass any permission check.

| Area (`Perm.*`) | Teacher | Student | Parent |
|---|---|---|---|
| Schools, subjects, study plans, periods | ○ | ○ | — |
| Teachers / students / parents directory | ○ | ○ (teachers, students) | — |
| Courses, class groups, schedules | ○ | ○ | ○ (courses, schedules) |
| Assignments | ● | ○ + `SUBMIT_ASSIGNMENTS` | ○ |
| Attendance | ● | ○ | ○ |
| Grades | ● | ○ | ○ |
| Quizzes | ● | ○ | — |
| Files | ● | ○ | — |
| Communication | `VIEW` + `CHANNELS` + `DIRECT` | `VIEW` (channels only) | `VIEW` + `DIRECT` (no starting) |
| Financials | — | ○ (own) | ○ (children) |
| Roles / permissions | — | — | — |

> "Own" and "children" scoping is enforced in the services, not by the permission key. Every FRD must state its tenancy and ownership scope explicitly.
