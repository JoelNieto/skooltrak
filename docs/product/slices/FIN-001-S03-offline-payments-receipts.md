# FIN-001-S03 — Register offline payment (Transferencia/ACH, Yappy) + receipt

| | |
|---|---|
| **FRD** | [FIN-001](../frd/FIN-001-financing-module.md) |
| **Implements** | FR-FIN-001.14, .15 · BR-FIN-001.3, .14, .15, .16 |
| **Status** | Done |
| **Branch** | `claude/fin-001-ledger-foundation-ykngdm` |
| **Estimate** | 3 days |

## User-visible outcome
"As front-desk staff I register a transfer or Yappy a family sent, pick which charges it pays (oldest first is suggested), and get a numbered receipt; any extra becomes saldo a favor. As a guardian I see my payments and open their receipts."

## Decisions taken in this slice
- **Offline payments are `COMPLETED` when registered**: staff register money already received. `PENDING`/`FAILED` are for card checkout (S04).
- **Date received** is required, `YYYY-MM-DD`, and can't be later than the school's today (`400 La fecha de recepción no puede ser futura`).
- **Payer on the receipt** is the account's guardians; offline payments have no paying user.
- **Uniqueness of the reference** (BR .14) and the **receipt number** (BR .16) are both decided while holding the school's `finance_settings` row lock (`UPDATE … SET "receiptSeq" = "receiptSeq" + 1 … RETURNING`). Payments of a school are serialized, a refused payment rolls the number back, and numbers have no gaps. `FinanceSettings` starts with `receiptSeq` only; S09/S11 add their settings.
- **Charges are row-locked** (`SELECT … FOR UPDATE`) and re-read inside the transaction before allocating, so two payments can't overpay one charge (`400 El monto excede el saldo del cargo`).
- **Download** of a receipt is the browser's print / save-as-PDF on a print-friendly page.
- **Account sync** (S01) now treats an account with payments or credit like one with charges: it is never folded or deleted.

## Acceptance criteria
```gherkin
@FR-FIN-001.14
Given I am a school admin on Carla's account, whose "Matrícula E2E" (150.00) is overdue
When I register a Transferencia / ACH of 150.00 received today with reference "TRX-E2E-001"
Then "Matrícula E2E" is pre-selected for 150.00 (oldest due first)
And after confirming I see receipt R-000001 with that line, method and reference
And the account shows "Matrícula E2E" as Pagado and nothing overdue

@FR-FIN-001.14
When I register another Transferencia / ACH with reference "TRX-E2E-001"
Then I see "Referencia ya registrada" and no receipt number is used

@FR-FIN-001.14
Given the "Familia E2E" account
When I register a Yappy of 30.00 allocated only to "Excursión E2E" (25.00)
Then receipt R-000002 shows the line of 25.00 and "Saldo a favor" 5.00
And the account's saldo a favor is 5.00

@FR-FIN-001.15
Given I am the guardian of that account
When I open Estado de cuenta
Then I see saldo a favor 5.00 and payment R-000002, and can open its receipt
And requesting the receipt of Carla's payment gives 403

@FR-FIN-001.14
Given I am a teacher
When I call POST /finance/payments
Then I get 403
```

Unit tests cover the rest: allocations over a charge's outstanding or over the payment, charges of another account or cancelled, duplicate charges in one payment, future date, empty reference, cross-tenant account, credit entry and `creditBalance`, receipt access for staff of another organization and for non-guardians.

## Layers touched
- [x] Prisma migration `20261128120000_fin001_payments`: `PaymentMethod`, `PaymentStatus`, `payments` (receipt number unique per school, idempotency key unique), `payment_allocations`, `credit_entries`, `finance_settings`, `family_accounts.creditBalance`.
- [x] Nest `finance`: `payment-allocation.ts` (pure: validates allocations, works out credit), `PaymentsService` (`register` in one transaction with charge row locks and the receipt sequence, `receipt`, `list`), account detail gains `payments` and a real `creditAmount`; account sync counts payments and credit entries so it never folds or deletes such an account; parent home `lastPayment` reads the latest completed payment. `FinanceController`: `POST payments` (`MANAGE_FINANCIALS`), `GET payments` (`VIEW_FINANCIALS`, staff), `GET payments/:id/receipt` (`VIEW_FINANCIALS`, staff of the org or guardian of the account).
- [x] OpenAPI regenerated.
- [x] Angular: "Registrar pago" dialog on the account (method, amount, date, reference, note, charges with oldest-due-first suggestion, saldo a favor preview); Pagos section on the account; **Pagos** tab (`/financial-module/payments`, filters method and dates); receipt page for staff (`/financial-module/payments/:id`) and guardians (`/parent/finances/receipts/:id`) with "Imprimir"; Estado de cuenta lists the account's payments.
- [x] Tests: Nest unit (`payment-allocation`, `payments.service`, access); Playwright `src/finance/finance-payments.after.spec.ts` tagged `@FR-FIN-001.14/.15`, in its own project after `after` so the balances S01/S02 assert don't move.

## Out of scope for this slice
- Card checkout (S04), void (S05), applying saldo a favor (S06), payments list export.

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
