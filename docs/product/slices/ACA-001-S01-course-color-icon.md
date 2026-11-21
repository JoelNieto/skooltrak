# ACA-001-S01 — Course color and subject icon on cards and header

| | |
|---|---|
| **FRD** | [ACA-001](../frd/ACA-001-course-experience.md) |
| **Implements** | FR-ACA-001.1, FR-ACA-001.2 (color, icon), FR-ACA-001.9 (cover only), BR-ACA-001.11 |
| **Status** | Ready |
| **Branch** | `feat/ACA-001-S01-course-color-icon` |
| **Estimate** | 2 days |

## User-visible outcome
"As a school admin I pick a color for each course and an icon for each subject. Everyone then sees each course with its own colored cover and icon on *Cursos* and on the course page, instead of the same stock photo."

## Acceptance criteria
```gherkin
Scenario: admin sets a course color
  Given school admin A edits course "Matemáticas"
  When A picks the color "Índigo" and saves
  Then the course card on /courses has an indigo cover
  And the course page header shows an indigo color dot

Scenario: admin sets a subject icon
  Given school admin A edits subject "Matemáticas"
  When A picks the icon "sigma" and saves
  Then every course of that subject shows the sigma icon on its cover

Scenario: defaults without setup
  Given a course with no color and a subject with no icon
  When any user opens /courses
  Then the course shows a color derived from its id, the same on every load
  And the cover shows the "book-open" icon

Scenario: invalid values are refused
  When an admin sends PATCH /api/v1/courses with color "PURPLE"
  Then the API responds 400
  When an admin sends PATCH /api/v1/subjects with icon "not-an-icon"
  Then the API responds 400

Scenario: cross-tenant update refused
  Given course D belongs to another organization
  When admin A sends PATCH /api/v1/courses for D with color "TEAL"
  Then the API responds 403 and D is unchanged

Scenario: readable in both themes
  Given each of the 8 course colors
  Then its icon color meets 3:1 contrast against it in light and dark themes
```

## Layers touched
- [ ] **Prisma migration:**
  - `enum CourseColor { INDIGO TEAL ROSE VIOLET AMBER SLATE FUCHSIA GREEN }`;
  - `Course.color CourseColor?`;
  - `Subject.icon String?`.
- [ ] **Nest** (`apps/dashboard-backend/src/app/courses`, `subjects`):
  - `UpdateCourseInput.color` and `UpdateSubjectInput.icon` are validated (`@IsEnum`, `@IsIn(SUBJECT_ICONS)`) and return `400` otherwise.
  - **Tenancy fix:** `update` in both services filters by the caller's `organizationId` and returns `403` for another organization. Today `courses.service.ts:336` and `subjects.service.ts:120` update by id only.
  - `findAll` and `findOne` responses include the resolved `color`, never null; the fallback is derived from the course id. They also include `colorIsDefault` and `subject.icon`.
- [ ] **Shared** (`libs/shared`): `COURSE_COLORS`, `SUBJECT_ICONS` (a curated list) and `resolveCourseColor(id, color)`, used by both the API and the UI.
- [ ] **libs/ui:**
  - `--color-course-<key>` / `--color-course-<key>-content` tokens in `theme.css`, light and dark;
  - the missing subject icons (`sigma`, `flask-conical`, `languages`, `globe`, `palette`, `music`, `dumbbell`, `calculator`, `atom`) added to `icons.ts`;
  - a `ui-course-cover` component (color + icon now; photo in S09) with stories and a spec.
- [ ] **OpenAPI:** `bun run openapi:orval`.
- [ ] **Angular:**
  - `admin/forms/courses-form.ts`: a color radio group of 8 labelled swatches: *"Índigo, Verde azulado, Rosa, Violeta, Ámbar, Pizarra, Fucsia, Verde"*;
  - `admin/forms/subjects-form.ts`: an icon picker;
  - `courses/courses.ts`: cards use `ui-course-cover`, replacing `course-default.jpg`;
  - `courses/course.ts`: the header uses it too, plus the color dot.
- [ ] **Tests:**
  - Nest unit tests: DTO validation, color fallback, cross-tenant `403` on both updates;
  - `libs/ui` spec: contrast per token;
  - Playwright `@FR-ACA-001.1 @FR-ACA-001.2`: admin sets a color and an icon, and a student sees them on `/courses`.

## Out of scope for this slice
- Teachers setting colors, and cover photos (S09).
- Subject areas and filter chips (S04).
- Progress data on cards (S02–S03).
- Showing the color in the calendar, channels or nav, which waits for those features.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] FRD slice table + `capabilities.md` updated
