# ACA-001-S09 — Teacher sets color and cover photo

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.3; BR-ACA-001.12 |
| **Status** | Done |
| **Branch** | `feat/ACA-001-S09-customize-course` |
| **Estimate** | 1.5 days |

## User-visible outcome
"As a teacher, I open my course, choose *Personalizar*, and pick its color, and either an icon or a cover photo. My students see it on their *Mis cursos* card and on the course page."

## Acceptance criteria
```gherkin
Scenario: the course teacher picks a color
  Given Tomás teaches "Matemáticas 7° E2E"
  When he opens the course and chooses "Personalizar", then "Verde"
  Then the course cover turns green everywhere it appears

Scenario: an icon instead of a photo
  When the teacher opens "Portada", then "Ícono", and picks "Átomo"
  Then the course shows that icon instead of its subject's, on every card and the course page
  And picking an icon removes the photo; "Usar el ícono de la materia" goes back to the subject's icon
  And an icon outside the curated list gets 400 "Ícono de curso inválido"

Scenario: a cover photo
  When the teacher uploads a JPEG, PNG or WebP of at most 2 MB
  Then the photo replaces the color cover on the cards and the course page
  And "Quitar foto" goes back to the color cover

Scenario: refusals (BR .12)
  Then another teacher, a student or a parent gets 403 on the color and cover routes
  And an admin of another organization gets 403
  And a file that is not a JPEG, PNG or WebP, or is larger than 2 MB, gets 400
    "La portada debe ser una imagen JPEG, PNG o WebP de hasta 2 MB"
```

## Decisions
- **Permission:** new `CUSTOMIZE_COURSES`, granted to every `TEACHER` role by the migration and in `DEFAULT_ROLE_PERMISSIONS`. Admins pass every permission check already. The route also checks that the teacher teaches *this* course.
- **Routes:**
  - `PATCH /courses/:id/appearance { color?, icon? }`: only these two; a field left out stays, `null` goes back to the derived color (BR .11) or the subject's icon;
  - `POST /courses/:id/cover` (multipart `file`) and `DELETE /courses/:id/cover`.
- **Upload path:** the API receives the file and puts it in the private bucket, so it checks type and size itself. Files and logos use presigned uploads instead, but those can't enforce the 2 MB rule.
- **Storage:** the same Cloudflare R2 bucket as files, under `course-covers/{courseId}/{uuid}.{ext}`. Replacing or removing a cover deletes the old object (best effort). Without storage settings (local, CI), uploads answer `503` and covers have no URL, so courses keep their color cover.
- **Icon:** `Course.icon`, from the same curated `SUBJECT_ICONS` list as subjects; it overrides the subject's icon for that course only. Icon and photo are alternatives: picking an icon deletes the photo, and a photo hides the icon.
- **Serving:** the course page, *Mis cursos* and the staff *Cursos* list return `coverUrl`, a presigned URL valid for 1 hour. The course page also returns `canCustomize` (the STAFF viewer).
- **Audit:** cover uploads and removals are logged with ids only.

## Layers touched
- [x] **Prisma:** `Course.coverKey String?`, `Course.icon String?`; migrations `20261122100000_course_cover_customize` (column, permission, teacher grants) and `20261122110000_course_icon`; `CUSTOMIZE_COURSES` in the role seed.
- [x] **Nest:** `course-appearance.service.ts`, `course-cover-storage.ts`, three routes in `courses.controller.ts`; `coverUrl` on `course-page.service.ts` and `courses-mine.service.ts`.
- [x] **Angular:** `ui-course-cover [image]`; `courses/course-customize-dialog.ts` (color, then *Portada*: Ícono or Foto); a *Personalizar* button on the course page header; covers and icons on *Mis cursos* and the staff *Cursos* list.
- [x] **Tests:**
  - Nest: color by teacher and admin, refusals (other teacher, other org), cover type and size, replace and remove, route permissions;
  - Playwright `@FR-ACA-001.3 @BR-ACA-001.12` (`after` project): the teacher picks a color, then an icon (and an unknown icon gets 400); other teacher and student get 403; a text file gets 400.

## Out of scope for this slice
- Cropping or resizing the photo; covers on the admin course list.

## Done checklist
- [x] Acceptance criteria pass (a successful upload is covered by unit tests; e2e has no object store)
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
