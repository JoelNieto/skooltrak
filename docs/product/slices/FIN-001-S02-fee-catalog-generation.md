# FIN-001-S02 — Fee catalog, assignments and charge generation

| | |
|---|---|
| **FRD** | [FIN-001](../frd/FIN-001-financing-module.md) |
| **Implements** | FR-FIN-001.4, .5, .6 · BR-FIN-001.3, .4, .5 |
| **Status** | In review |
| **Branch** | `claude/fin-001-ledger-foundation-ykngdm` (on top of `feat/FIN-001-S01-ledger-foundation`) |
| **Estimate** | 3 days |

## User-visible outcome
"As a school admin I define Matrícula and Mensualidad once, assign them to a degree (with a different amount for one study plan), preview what a year's generation will create and generate it; each student's charges show up on their family account, and running it again creates nothing twice."

## Decisions taken in this slice
- **Academic year → calendar dates.** For year *Y*, a month ≥ the school's `schoolYearStartMonth` falls in calendar year *Y*, an earlier month in *Y + 1* (Mar–Dec school: all in *Y*; Aug–Jun school: Aug–Dec in *Y*, Jan–Jun in *Y + 1*). A due day past the month's end is clamped to its last day (31 → 28/29 Feb).
- **`ONE_TIME` items store a due month and day**, not a full date (FRD §5 said `dueDate?`). This keeps one catalog item valid year after year; the date is resolved per year by the rule above.
- **A fee item's kind, schedule and months can't change** once charges were generated from it (`409 El concepto ya tiene cargos generados; crea uno nuevo`). Name, amount and `active` can change; changes never touch existing charges (BR .5).
- **Inactive items** are skipped by generation and can't receive new assignments.
- **Generated charge description**: the item name for `ONE_TIME`, `"<name> — <mes> <año>"` (e.g. "Mensualidad — marzo 2027") for `MONTHLY`.
- **Scope**: the students are those `ACTIVE` in the school whose class group belongs to the study plan / is the group / is the student. A student with no class group has no study plan → `400 El estudiante no tiene grupo asignado`.

## Acceptance criteria
```gherkin
@FR-FIN-001.4
Given I am a school admin
When I open Finanzas → Catálogo and create "Transporte E2E", kind Otro, 30.00, Mensual from marzo to mayo, due day 5
Then the item is listed with "Mensual · mar–may · día 5" and 30.00

@FR-FIN-001.5
Given the item exists
When I assign it to the degree "Premedia E2E" for next year
And I assign it to the study plan "7° E2E" for next year with amount 20.00
Then both assignments are listed for that year
And assigning it again to "7° E2E" for that year is refused with "Ya está asignado"

@FR-FIN-001.6
Given those assignments
When I open "Generar cargos", choose next year and the student Carla (7°A E2E)
Then the preview lists 3 new charges for Carla of 20.00 each (the plan override wins) and a total of 60.00
When I confirm
Then I see "3 cargos creados" and Carla's account shows "Transporte E2E — marzo <year>" pending 20.00
When I preview the same scope again
Then it shows 0 new charges and 3 already generated, and "Generar" is disabled

@FR-FIN-001.4
Given I am a guardian or a teacher
When I call the fee catalog API
Then I get 403
```

Unit tests cover the rest of the rules: degree + plan items add up and the plan override replaces only the same item (BR .4), `409` on duplicate assignment, cross-tenant school refused, non-ACTIVE students skipped, idempotent re-run (BR .5), due-day clamp and the year rollover of an Aug–Jun school.

## Layers touched
- [x] Prisma migration `20261127120000_fin001_fee_catalog`: `FeeKind`, `FeeSchedule`, `fee_items`, `fee_assignments` (unique per item, year, degree / study plan), `charges.feeItemId` + `charges.installment` with a unique index on (`studentId`, `feeItemId`, `year`, `installment`).
- [x] Nest `finance`: `fee-schedule.ts` (pure: installments and due dates per year), `fee-plan.ts` (pure: items that apply to a student's plan, BR .4), `FeesService` (catalog + assignments, audit log), `ChargesService.previewGeneration` / `generate` (`createMany … skipDuplicates`, audit log). `FinanceController`: `GET/POST/PATCH fee-items`, `GET/POST/DELETE fee-assignments`, `GET fee-targets` (degrees → study plans → class groups of the school, so finance staff don't need study-plan permissions), `GET students?schoolId&search` (active students by name or cédula for the pickers; the people directory search only matches students with a user account), `POST charges/generate/preview`, `POST charges/generate`. All `MANAGE_FINANCIALS`, school validated against the caller's org.
- [x] OpenAPI regenerated.
- [x] Angular: `StudentSearch` takes its endpoint as an input and reads the paginated `{ data }` list (it iterated the page object and crashed); the finance pickers ("Nuevo cargo", "Generar cargos") use `GET /finance/students`.
- [x] Angular: tab **Catálogo** (`/financial-module/catalog`): fee items table + "Nuevo concepto"/edit dialog; assignments per year with "Asignar" dialog (degree or study plan, optional amount). **Generar cargos** page (`/financial-module/charges/generate`): year, scope (study plan / group / student) → preview (per item and per student, totals, already generated) → confirm.
- [x] Tests: Nest unit (`fee-schedule`, `fee-plan`, `fees.service`, generation in `charges.service`, access); Playwright `src/finance/finance-fees.after.spec.ts` tagged `@FR-FIN-001.4/.5/.6`.

## Out of scope for this slice
- Discounts on generated charges (S08), late fees (S09), a school-wide charge list (later), moving a student between study plans mid-year (charges already generated stay).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
