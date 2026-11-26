# FIN-001-S01 — Ledger foundation: family accounts, manual charge, parent Estado de cuenta

| | |
|---|---|
| **FRD** | [FIN-001](../frd/FIN-001-financing-module.md) |
| **Implements** | FR-FIN-001.1, .2, .3 (read-only), .7, .12 · BR-FIN-001.1, .3, .10 |
| **Status** | In review |
| **Branch** | `feat/FIN-001-S01-ledger-foundation` |
| **Estimate** | 3 days |

## User-visible outcome
"As a school admin I can find a family's account and add a charge to one of its children; as a guardian I see that charge in my Estado de cuenta, grouped by child."

## Acceptance criteria
```gherkin
@FR-FIN-001.1
Given a student with no family account in School A
When a guardian is linked to that student
Then the student belongs to exactly one family account in School A
And a second child linked to the same guardian in School A joins the same account

@FR-FIN-001.2
Given I am a school admin of School A
When I open Finanzas → Cuentas and search a student's cédula
Then I see the family account with its guardians, students and balance due

@FR-FIN-001.7
Given I am on a family account detail
When I add a manual charge "Excursión" of 25.00 due 2026-12-15 to one student
Then the charge appears as PENDING with outstanding 25.00
And the account balance due increases by 25.00

@FR-FIN-001.12
Given I am a guardian of that student
When I open Estado de cuenta
Then I see School A's account with the "Excursión" charge under my child's name and balance due 25.00

@FR-FIN-001.12
Given I am a guardian with no linked child in School B
When I request School B's account id
Then I get 403

Scenario: cross-tenant refused @FR-FIN-001.2
Given I am an admin of Organization X
When I list accounts with a schoolId of Organization Y
Then I get 403
```

## Layers touched
- [x] Prisma migration `20261126150000_fin001_family_accounts`: drops legacy `charges`, `payments`, `ChargeType`, `ChargeStatus`, `degree_enrollment_costs`, `study_plan_enrollment_costs` and the tuition columns of degrees and study plans (no data migration, Q1); adds `family_accounts`, `family_account_students`, new `charges` (`ChargeSource`), `finance_audit_logs`. `FinanceSettings` moves to S03, where receipts first need it.
- [x] Nest `finance` module replaces `financial`: `account-sync.ts` (pure planner) + `AccountsService.sync` instead of link hooks (no backfill script needed: accounts appear on the first finance read); `charge-status.ts` (derived status, cents); `ChargesService.createManual` with audit log; `FinanceController` (`GET accounts`, `GET accounts/:id`, `GET me/accounts`, `POST charges`) with `@RequirePermissions`, org/school filter and guardian ownership. Degrees and study plans keep only the grade metric; students no longer auto-generate charges (S02 brings generation back from the catalog).
- [x] HOM: admin overdue tile and month collection, parent balance read the new charges (last payment returns with S03).
- [x] OpenAPI regenerated.
- [x] Angular: `/financial-module` shell (tabs; Cuentas first) → `accounts` list and `accounts/:id` detail with "Nuevo cargo" (student or whole group); `/parent/finances` rebuilt; sidebar shows Finanzas to finance staff only; home "Cargos vencidos" opens Cuentas filtered to overdue.
- [x] Tests: Nest unit (`account-sync`, `charge-status`, `charges.service`, `finance-access` incl. cross-tenant, non-guardian and non-manager refusals); Playwright `src/finance/finance-accounts.after.spec.ts` tagged `@FR-FIN-001.1/.2/.3/.7/.12`; e2e seed creates the two family accounts.

## Out of scope for this slice
- Fee catalog/generation (S02), any payment (S03/S04), cancel (S05), move student (S07).

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
