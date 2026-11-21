# ASM-001-S08 — Homeroom alert for scores below the pass mark

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.14, BR-ASM-001.12 |
| **Status** | In review |
| **Branch** | `feat/ASM-001-S08-homeroom-alert` (stacked on S07, #60) |
| **Estimate** | 2–3 days |

## User-visible outcome
"As a homeroom teacher, I'm told when a student of my group gets a published score below the pass mark in a colleague's course. I see it in my notifications and on my home page."

The app has stored notifications for a while (unpublished-grade reminders, join requests), but nothing could show them. This slice adds the inbox (decided 2026-11-21: inbox **and** a teacher home card).

## Acceptance criteria
```gherkin
Scenario: alert on publish
  Given Beto is in 7°A, whose homeroom teacher is H
  And teacher T publishes "Prueba" where Beto has 2 (pass mark 3)
  Then H gets the notification "Nota bajo la nota mínima": "Beto E2E (7°A E2E) obtuvo 2.0 en «Prueba» de Matemáticas 7° E2E. Nota mínima: 3.0."
  And students at or above the pass mark, excused or without a score raise none

Scenario: alert on a corrected published score
  When T changes Carla's published score from 4.5 to 2.5
  Then H gets the alert for Carla

Scenario: once per student and grade
  When T changes Beto's published score again, still below the pass mark
  Then H gets no second alert

Scenario: not to the grading teacher
  Given T is also the homeroom teacher of the student's group
  Then T gets no alert for their own course

Scenario: inbox
  When any user opens "Notificaciones" in the sidebar
  Then they see their notifications, newest first, with an unread count on the sidebar link
  And they can mark one, or all, as read
  And they never see another user's notifications

Scenario: teacher home
  Given H has unread alerts
  Then the teacher home shows "Notas bajo la nota mínima en tu grupo" with them, linking to the inbox
```

## Decisions
- **Who is "the grading teacher"?** The course's teacher, and whoever saved or published the score. Neither gets the alert.
- **Once per (student, grade)** is recorded with the notification itself (`type = LOW_GRADE_HOMEROOM`, `relatedId = gradeId:studentId`), so no new table is needed.
- **Alerts go out after the response**, like the published-grade emails. A failure is logged with ids only and never fails the save.
- **The message includes the score.** Homeroom teachers may read their group's published grades (ACA-001 BR .16).
- **The inbox is for every role.** It replaces the student and parent *Notificaciones* sample pages, and it's reached from one sidebar link with an unread badge, next to *Mensajes*.
- The inbox shows the latest 50 notifications.

## Layers touched
- [x] **Nest:**
  - `grades/homeroom-alerts.ts`: `alertHomeroomTeachers(prisma, gradeId, { studentIds?, actorUserId })`. It's called after:
    - publishing from the gradebook or `PATCH /grades`;
    - creating a column already published;
    - saving changed published cells from the gradebook;
    - `PATCH` / `POST /student-grades` on a published grade.
  - `notifications` module, any signed-in user, own notifications only:
    - `GET /api/v1/notifications?unread=&type=&take=` → `{ notifications, unread }`;
    - `PATCH /api/v1/notifications/:id/read`;
    - `PATCH /api/v1/notifications/read`.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:**
  - `notifications/notifications-page.ts` at `/notifications`. The student and parent routes load it too; the sample pages are deleted.
  - Sidebar *Notificaciones* with an unread badge.
  - Teacher home card *"Notas bajo la nota mínima en tu grupo"*.
- [x] **Tests:**
  - Nest: who is alerted (below the pass mark only, not excused, not the grading teacher, no homeroom), once per student and grade, only published grades; the inbox lists only the caller's notifications and marks them read.
  - Playwright `@FR-ASM-001.14 @BR-ASM-001.12`: with `otherTeacher` set as 7°A's homeroom teacher, `teacher` publishes a low score and `otherTeacher` sees the alert in the inbox and on the home page, once. The homeroom teacher is cleared again afterwards.

## Out of scope for this slice
- Email or push for these alerts.
- Notifications for students and parents beyond what already exists.

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
