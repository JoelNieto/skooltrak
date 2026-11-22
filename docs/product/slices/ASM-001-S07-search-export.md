# ASM-001-S07 — Find student and CSV export

| | |
|---|---|
| **FRD** | [ASM-001](../frd/ASM-001-teacher-gradebook.md) |
| **Implements** | FR-ASM-001.12, .13 |
| **Status** | Done: #60 (2026-11-21) |
| **Branch** | `feat/ASM-001-S07-search-export` |
| **Estimate** | 1 day |

## User-visible outcome
"As a teacher, I find a student in the gradebook by name or cédula, and I download the group's grades for the period as a CSV."

## Acceptance criteria
```gherkin
Scenario: finding a student
  When teacher T types "carl" in "Buscar estudiante"
  Then only Carla's row is shown
  And "Promedio del grupo" still covers the whole group
  And a search that matches no one reads "Ningún estudiante coincide con «…»"

Scenario: exporting
  When T presses "Exportar CSV"
  Then a file "calificaciones-{curso}-{periodo}-{grupo}.csv" downloads
  And it has one row per student: name, cédula, one column per grade, the average and the status
  And excused cells read "EX", empty ones are blank
  And another teacher's export is refused with 403
```

## Decisions
- **"Code" is the cédula** (`Student.documentId`): students have no other code. The parent-linking enrollment code is secret and is never exported.
- **Search ignores case and accents**, and dashes in the cédula (`8123456` finds `8-123-456`). It filters the rows only: averages and the footer stay group-wide.
- **The export is what is saved.** Unsaved cells are not in it, and the grid says so when there are any.
- **CSV format:**
  - UTF-8 with a BOM, so spreadsheets read the accents;
  - comma separator, decimal point, one decimal;
  - values a spreadsheet would run as formulas (`=`, `+`, `-`, `@`) are prefixed with `'`;
  - generated on demand, never stored, `Cache-Control: no-store` (FRD §8).

## Layers touched
- [x] **Nest:**
  - `GET /api/v1/gradebook/:courseId/export?periodId=&classGroupId=` (`MANAGE_GRADES` + BR .1), built from the same view as the grid (`gradebook-csv.ts`).
  - Rows carry the student's `documentId`.
- [x] **OpenAPI:** `bun run openapi`.
- [x] **Angular:** *Buscar estudiante* (name or cédula) and *Exportar CSV* in the gradebook toolbar.
- [x] **Tests:**
  - Nest: CSV rows, quoting, formula guard, `EX`, file name, export through the service, 403;
  - Angular: name / cédula matching;
  - Playwright `@FR-ASM-001.12 @FR-ASM-001.13`: search filters rows and keeps the footer, empty result, the downloaded CSV's header and a row, 403.

## Out of scope for this slice
- Homeroom alert (S08).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
