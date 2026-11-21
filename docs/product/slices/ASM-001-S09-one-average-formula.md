# ASM-001-S09 — One average formula everywhere

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | BR-ASM-001.4 (decided 2026-11-19, Q2) |
| **Status** | In review: #48 |
| **Branch** | `feat/ASM-001-S09-one-average-formula` |
| **Estimate** | 1–2 days |

## User-visible outcome
"As a teacher, student or parent, I see the same average for a course in the course grid, on the home pages and in the grade report. It weights each category the way the course's weights say, so a category with many small tasks no longer outweighs a test."

Today three formulas disagree:
- the API, the home pages and the grade report weight each **score** by its bucket's weight;
- the course grid (`course-grades.ts`) and the parent's progress page (`parent-child-progress.ts`) take an **unweighted** mean.

## Acceptance criteria
```gherkin
Scenario: categories weigh by their mean, not by their number of cells
  Given a course with buckets "Trabajo diario" (weight 40) and "Pruebas" (weight 60)
  And a student scored 4, 4, 4 and 4 in "Trabajo diario" and 2 in "Pruebas"
  Then the student's average is 2.8 everywhere it is shown
  # today: 3.5 (per-score weighting) on the API, home pages and grade report; 3.6 in the course grid

Scenario: empty cells and empty buckets are skipped
  Given a bucket in which the student has no scored cell
  Then that bucket is left out of both the sum and the weights

Scenario: no scored cell, no average
  Given a student with no scored cell in a course and period
  Then they have no average ("Sin notas" / "—"), not 0

Scenario: the course grid uses the formula
  Given teacher T opens the grades of their course
  When a student has scores in two buckets of different weights
  Then "Promedio actual" shows the bucket-weighted average
```

## Layers touched
- [ ] **Shared** (`libs/shared`): `courseAverage(cells)`, BR .4 as one pure function, used by the API and the UI.
- [ ] **Nest** (`apps/dashboard-backend`):
  - `home/home-grades.ts` `weightedAverages` groups cells by bucket. Its callers select `grade.bucketId`. This covers the student, teacher and parent home pages.
  - `home/admin-home.service.ts`: the grouped SQL averages per bucket first, then weights. It is still one query (HOM-001 §8).
  - `grades.service.ts` and `student-grades.service.ts` `getAverageScoreForStudent` return `null` with no scored cell, instead of `0`. The grade report uses this to tell "no average" from a real 0.
- [ ] **Angular:** `grades/course-grades.ts` (course grid) and `parent/parent-child-progress.ts` use `courseAverage`. Both endpoints already return each grade's bucket.
- [ ] **OpenAPI:** no shape change expected (`bun run openapi`).
- [ ] **Tests:**
  - `libs/shared` unit tests for BR .4, including the 2.8 example;
  - updated home-service specs;
  - Playwright `@BR-ASM-001.4`: the teacher's course grid shows the bucket-weighted average. The spec creates its own unpublished bucket and grades and removes them afterwards. It runs in the `after` project, so other specs' figures don't change.

## Out of scope for this slice
- Excused cells (S05): they will reach `courseAverage` as cells without a score.
- Drafts in the teacher's averages and the *"Incluye borradores"* label (BR .6, S02).
- How the grade report combines periods into a cumulative average, and how home pages combine courses into one KPI. Those aggregate course averages, which this slice fixes.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test): no access rules change; the existing grade-access specs keep passing
- [ ] FRD slice table + `capabilities.md` updated
