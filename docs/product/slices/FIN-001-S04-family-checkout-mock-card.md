# FIN-001-S04 — Parent family checkout with mock card

| | |
|---|---|
| **FRD** | [FIN-001](../frd/FIN-001-financing-module.md) |
| **Implements** | FR-FIN-001.13, .15 · BR-FIN-001.11, .12, .13, .15, .16 |
| **Status** | In review |
| **Branch** | `claude/fin-001-ledger-foundation-ykngdm` |
| **Estimate** | 3 days |

## User-visible outcome
"As a guardian I pick the charges I want to pay in Estado de cuenta (one of them partially if I want), pay with a card in the test form, and get my receipt; a declined card tells me why and charges nothing."

## Decisions taken in this slice
- **New permission `Perm.PAY_FINANCIALS`** ("Pay family account charges online"), seeded for `PARENT`; `ORG_ADMIN`/`SYSADMIN` get it through `ALL_PERMISSIONS` but only an account's guardians can pay it (`403`). Deploy runs `db:add-roles-permissions`, so existing parent roles get it.
- **The card never reaches the API** (BR .12): the form checks Luhn, brand and expiry in the browser and sends only `{ brand, last4, expMonth, expYear }`. The route validates its body with `forbidNonWhitelisted`, so a request carrying `number` or `cvv` is refused (`400`).
- **`MockCardProvider`** behind a `PaymentProvider` interface: last 4 `0002` → "Tarjeta rechazada", `9995` → "Fondos insuficientes", anything else approved with reference `mock_…`.
- **One transaction per attempt**: the payment row (with the idempotency key) is inserted first, then the school's receipt row and the charges are locked (same order as offline payments, so they can't deadlock), the charges are re-checked, the provider is called, and the payment ends `COMPLETED` (allocations, receipt number) or `FAILED` (no allocation, no number). The mock answers synchronously; a real provider would move the call out of the transaction with a `PENDING` step.
- **Idempotency** (BR .13): the same key returns the first outcome (receipt or decline) and never charges twice; a key used by another user → `409`. The page makes a new key after a decline, so trying another card is a new attempt.
- **Response**: `200 { status: 'COMPLETED', receipt }` or `200 { status: 'DECLINED', message }`; validation problems are `4xx` as usual.
- **Saldo a favor at checkout** is S06; card payments never create credit (BR .15): the amount is always the sum of the selected lines.

## Acceptance criteria
```gherkin
@FR-FIN-001.13
Given I am the guardian of "Familia E2E", whose "Mensualidad E2E" (285.00) is pending
When I select it in Estado de cuenta and press "Pagar (1)"
And pay 100.00 of it with the test card 4000 0000 0000 0002
Then I see "Tarjeta rechazada" and the charge still owes 285.00

@FR-FIN-001.13 @FR-FIN-001.15
When I pay 100.00 of it with 4242 4242 4242 4242
Then I land on receipt R-000003 for Tarjeta ···· 4242 with the line "Mensualidad E2E" 100.00
And Estado de cuenta shows it pending with 185.00 left

@FR-FIN-001.13
When the API receives the same checkout twice with one idempotency key
Then both answers are the same payment and the charge is paid once
And a new checkout of that (now paid) charge is refused with "Uno de los cargos ya fue pagado"

@FR-FIN-001.13
Given I am a guardian
When I try to pay a charge of another family's account
Then I get 403
And a teacher or an admin who is not a guardian of the account gets 403
```

Unit tests cover the rest: minimum 1.00, only one partial line, duplicate or cancelled charges, expired card, `number`/`cvv` in the body refused, idempotency (same user, other user), declines leave no allocation and use no receipt number, approvals allocate and number, Luhn/brand/expiry checks in the browser (`finance/card.spec.ts`).

## Layers touched
- [x] No migration: `payments` already has `cardBrand`, `cardLast4`, `provider`, `providerRef`, `idempotencyKey` (unique), `payerUserId` (S03). Seed: `PAY_FINANCIALS` for `PARENT`.
- [x] Nest `finance`: `payment-provider.ts` (`PaymentProvider`, `MockCardProvider`, token `PAYMENT_PROVIDER`), `checkout-plan.ts` (pure: BR .11 checks), `CheckoutService.checkout`; `POST /finance/me/checkout` (`PAY_FINANCIALS`, guardian of the account).
- [x] OpenAPI regenerated.
- [x] Angular: Estado de cuenta gets checkboxes on open charges and a sticky "Pagar (n) · $X" bar (with `PAY_FINANCIALS`); **Pagar** page `/parent/finances/pay?account=&charges=` with the lines (amount editable, one partial), mock card form labelled "Modo de prueba" with the test cards, decline message, and on success the receipt.
- [x] Tests: Nest unit (`checkout-plan`, `checkout.service`, `payment-provider`, access); Playwright `src/finance/finance-checkout.after.spec.ts` tagged `@FR-FIN-001.13/.15`, in an `after-checkout` project after `after-finance` (it continues S03's receipt numbers).

## Out of scope for this slice
- Applying saldo a favor at checkout (S06), store orders (S10), real card processing and refunds.

## Done checklist
- [x] Acceptance criteria pass
- [x] Cross-tenant / wrong-role access refused (test)
- [x] FRD slice table + `capabilities.md` updated
