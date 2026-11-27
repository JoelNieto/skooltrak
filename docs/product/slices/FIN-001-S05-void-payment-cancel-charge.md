# FIN-001-S05 — Void payment + cancel charge

| | |
|---|---|
| **FRD** | [FIN-001](../frd/FIN-001-financing-module.md) |
| **Implements** | FR-FIN-001.8, .16 · BR-FIN-001.6, .17 |
| **Status** | In review |
| **Branch** | `claude/fin-001-ledger-foundation-ykngdm` |
| **Estimate** | 2 days |

## User-visible outcome
"As a school admin I undo a payment registered by mistake (anular), with a reason, and the charges it paid owe again; and I cancel a charge that shouldn't exist, once nothing is paid on it. Nothing is ever deleted: the receipt shows ANULADO and the charge stays, struck through, with its reason."

## Decisions taken in this slice
- **Void** (`POST /finance/payments/:id/void`, `MANAGE_FINANCIALS`, reason required): only `COMPLETED` payments (`409 El pago ya está anulado` / `400` for others). In one transaction, after locking the school's receipt row (the same lock as payments), the payment's charges and its account:
  - its allocations get `reversedAt` and their charges' `paidAmount` goes back down, so the charges are pending / partial / overdue again;
  - the saldo a favor it created is taken back with a negative credit entry. If the account no longer has that much credit (it was applied to other charges, S06) → `409 El saldo a favor de este pago ya fue usado` (BR .17);
  - card payments record a mocked refund: the provider's `refund()` and its reference on the payment (`refundRef`);
  - status `VOIDED` with `voidedAt`, `voidedById`, `voidReason`; the receipt number is kept.
- **Receipt of a voided payment** keeps its lines (the reversed allocations) and shows "ANULADO", the date, who voided it and why; card ones also show the refund.
- **Cancel** (`POST /finance/charges/:id/cancel`, `MANAGE_FINANCIALS`, reason required): refused while the charge has any non-reversed allocation (`409 El cargo tiene pagos aplicados; anule el pago primero`, BR .6), or when already cancelled (`409`). The charge row is locked, so a payment can't land on it meanwhile. Cancelled charges stay listed, struck through, with the reason; they owe nothing.
- Both write a `FinanceAuditLog` entry.

## Acceptance criteria
```gherkin
@FR-FIN-001.8
Given Carla's "Matrícula E2E" is paid by receipt R-000001
When I try to cancel it
Then I see "El cargo tiene pagos aplicados; anule el pago primero"

@FR-FIN-001.16
When I void R-000001 with the reason "Transferencia duplicada"
Then its receipt shows "ANULADO" with that reason and still lists "Matrícula E2E"
And Carla's account shows "Matrícula E2E" overdue again

@FR-FIN-001.8
When I cancel "Matrícula E2E" with the reason "Beca acordada"
Then it shows as Cancelado with the reason, and nothing is overdue

@FR-FIN-001.16
Given R-000002 (Yappy) paid "Excursión E2E" and left 5.00 of saldo a favor
When I void it
Then "Excursión E2E" owes 25.00 again and the saldo a favor is 0.00

@FR-FIN-001.16
Given R-000004 was a card payment
When I void it
Then its receipt shows "ANULADO" and the test refund

@FR-FIN-001.16
Given I am the guardian
Then Estado de cuenta shows the voided payments as Anulado
And a guardian or a teacher calling void or cancel gets 403
```

Unit tests cover the rest: reason required, voiding twice, voiding a failed payment, BR .17 when the account's credit is below what the payment generated, cancelling twice, cancel with a reversed allocation only (allowed), cross-tenant refusals.

## Layers touched
- [x] Prisma migration `20261129120000_fin001_void_refund`: `payments.refundRef`.
- [x] Nest `finance`: `PaymentProvider.refund()` (mock), `PaymentsService.void`, `ChargesService.cancel`, receipt keeps the lines of a voided payment and names who voided it; `FinanceController`: `POST payments/:id/void`, `POST charges/:id/cancel`.
- [x] OpenAPI regenerated.
- [x] Angular: shared reason dialog; the receipt's back link falls back to Pagos on the staff route (route input binding left it empty); "Cancelar cargo" on each charge of the account (managers); "Anular pago" on the receipt (managers), voided receipt shows who/when/why and the refund.
- [x] Tests: Nest unit (`payments.service` void, `charges.service` cancel, access); Playwright `src/finance/finance-void.after.spec.ts` tagged `@FR-FIN-001.8/.16`, in an `after-void` project after `after-checkout`.

## Out of scope for this slice
- Cancelling late fees (S09 adds them), reversing applied saldo a favor (S06), voiding by guardians.

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
