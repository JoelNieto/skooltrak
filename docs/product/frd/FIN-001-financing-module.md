# FIN-001 — Financing module (cuentas familiares, cobros y pagos)

| | |
|---|---|
| **Status** | In build |
| **Context** | FIN — Finance (see [capabilities](../capabilities.md#fin-finance)) |
| **Owner** | Joel |
| **Last updated** | 2026-11-26 |
| **Related** | Replaces the legacy `financial` module (`apps/dashboard-backend/src/app/financial/`, `Charge`/`Payment` models, `/financial-module`, `/parent/finances`) and the plans `.kilo/plans/*student-balance*`, `*financial-filters-pagination*`, `*payment-registration-form*`. Touches STO (store orders) and HOM (admin/parent home finance facts). |

## 1. Problem & outcome
Schools charge families for enrolment (*matrícula*), monthly tuition (*mensualidad*) and extras, and today track it in spreadsheets or the thin legacy module: charges are per student, payments are typed in by hand with no method, no receipt and no way to undo a mistake, and the store runs its own unrelated payment. Families with several children can't see or pay one consolidated bill.

When this ships, a school admin defines a **fee catalog** once, assigns it to degrees/study plans and generates each student's charges for the year, with discounts, scholarships and late fees applied by rule. Every family has **one account per school** (*cuenta familiar*) that holds its children's charges and its store orders. A guardian opens *Estado de cuenta*, picks the charges to pay (partial allowed), pays by card (**mocked** in this FRD) and gets a numbered receipt. Front-desk staff register transfers/ACH and Yappy received outside the app. Overpayments become *saldo a favor*; wrong payments are voided, never deleted. Admins see who owes what and for how long (*morosidad*), and families get reminders before and after due dates.

**Success metric:** ≥ 60 % of tuition amount collected through family checkout (card) or registered within 3 days of due date, in pilot schools, by the second month after launch. *(proposal — confirm)*

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| School admin | Manage fee catalog, plan assignments, discounts, late-fee settings; generate/cancel charges; register and void payments; apply credit; view all accounts, receipts and reports | `Perm.MANAGE_FINANCIALS` (writes), `Perm.VIEW_FINANCIALS` (reads) | Organization → school selected in the page (`schoolId` must belong to caller's org) |
| Finance staff *(non-admin role given the perms)* | Same as above, as far as the perms granted | `Perm.MANAGE_FINANCIALS` / `Perm.VIEW_FINANCIALS` | Organization |
| Parent / guardian | See the family account statement for each school where they have a linked child; pay charges by card (mock); download receipts | `Perm.VIEW_FINANCIALS` (read), **new** `Perm.PAY_FINANCIALS` (checkout) | Accounts whose students are linked to the caller's `Parent` profile(s) |
| Student | — (not in v1; legacy "own balance" is removed, see §9) | — | — |
| Teacher | — | — | — |

New permission: **`Perm.PAY_FINANCIALS`** — "Pay family account charges online". Seeded for `PARENT`; `ORG_ADMIN`/`SYSADMIN` get it via `ALL_PERMISSIONS`. Added in FIN-001-S04.

## 3. Functional requirements

### Accounts
- **FR-FIN-001.1** — The system keeps one **family account** per (school, family). An account groups one or more students of that school and the guardians linked to them. When a student gets their first linked guardian, they join that guardian's account in the school if it exists, otherwise a new account is created (BR .1).
- **FR-FIN-001.2** — A school admin can list family accounts of a school with: account number, responsible guardian(s), students, balance due, overdue amount, *saldo a favor*; search by student/guardian name or cédula; filter "con saldo vencido".
- **FR-FIN-001.3** — A school admin can open an account detail: students, charges (pending/paid/cancelled), payments with receipts, credit movements and a chronological ledger. They can move a student to another account of the same school (BR .2).

### Fee catalog & charge generation
- **FR-FIN-001.4** — A school admin can manage the school's **fee catalog**: fee items with name (e.g. "Matrícula", "Mensualidad", "Laboratorio"), kind (`ENROLLMENT` · `TUITION` · `OTHER`), amount and **schedule**: `ONE_TIME` (one due date) or `MONTHLY` (start month, end month, due day of month).
- **FR-FIN-001.5** — A school admin can assign fee items to a **degree** (applies to all its study plans) or a **study plan** (adds to or overrides the degree's item with a different amount, BR .4), per academic year.
- **FR-FIN-001.6** — A school admin can **generate charges** for a year for one study plan, one class group or one student. A preview shows students × items × installments and totals before confirming. Generation is idempotent (BR .5).
- **FR-FIN-001.7** — A school admin can create a **manual charge** for one student or a whole class group (description, amount, due date).
- **FR-FIN-001.8** — A school admin can **cancel** a charge with a reason when it has no active payment allocation (BR .6). Cancelled charges stay visible, struck through, with the reason.

### Discounts & scholarships
- **FR-FIN-001.9** — A school admin can manage **discount types** for the school: name, `PERCENT` or `FIXED`, and which fee kinds it applies to (e.g. "Beca 50 %" → `TUITION`; "Descuento hermanos 10 %").
- **FR-FIN-001.10** — A school admin can assign a discount to a student for a year (optional end date and note). Generated charges for that student show original amount, discount line(s) and net amount (BR .7, .8).
- **FR-FIN-001.11** — Assigning or removing a discount offers to recalculate the student's **unpaid, not-yet-due** charges of that year; paid, partially paid or overdue charges are never recalculated (BR .9).

### Payments
- **FR-FIN-001.12** — A parent can open **Estado de cuenta** for each school where they have an account: balance due, overdue, *saldo a favor*, charges grouped by child (and "Tienda" for store orders) with status, due date, net amount and outstanding amount.
- **FR-FIN-001.13** — A parent can **pay online**: select one or more pending charges (any child of the account), optionally lower the amount of one charge to pay partially (BR .11), see the total, enter card details in the **mock card form**, and confirm. On success the payment is `COMPLETED`, allocated to the selected charges and a receipt is shown; on decline nothing is allocated and a clear error is shown (BR .12, .13).
- **FR-FIN-001.14** — A school admin can **register an offline payment** on an account: method `BANK_TRANSFER` (Transferencia / ACH) or `YAPPY`, amount, date received, reference (required, BR .14), optional note, and the charges to allocate to (pre-selected oldest-due first, editable). Any amount not allocated becomes *saldo a favor* (BR .15).
- **FR-FIN-001.15** — Every completed payment gets a **receipt** with a per-school sequential number (BR .16): school name/logo, account number, payer, date, method, reference/last 4 digits, lines per allocated charge (student, concept, amount), credit generated, total. Admins and the account's guardians can view and print/download it.
- **FR-FIN-001.16** — A school admin can **void** a completed payment with a mandatory reason. Its allocations are reversed (charges go back to pending/partial/overdue), any credit it created is removed (BR .17), the receipt shows "ANULADO" with date, user and reason. Nothing is deleted. For card payments the void also records a mocked refund.
- **FR-FIN-001.17** — **Saldo a favor** is applied to charges: by the admin from the account detail ("Aplicar saldo a favor" to chosen charges), and offered to the parent at checkout as a first source before the card (BR .18).

### Late fees
- **FR-FIN-001.18** — A school admin can configure **late fees** for the school: on/off, grace days, `FIXED` or `PERCENT` of the charge's outstanding amount, and which fee kinds they apply to.
- **FR-FIN-001.19** — A daily job marks charges past due as `OVERDUE` and, once the grace period ends, creates one `LATE_FEE` charge linked to the original (BR .19). An admin can cancel a late fee like any charge (FR .8).

### Store
- **FR-FIN-001.20** — When a guardian places a store order in a school where they have a family account, the order becomes a `STORE_ORDER` charge on that account (due immediately) and is paid through family checkout or at the front desk like any charge. The store order's `paymentStatus` follows the charge (BR .20).

### Reminders & reports
- **FR-FIN-001.21** — Guardians receive an in-app notification and an email **N days before** a charge is due (default 3, configurable per school) and **on the day it becomes overdue**, at most one of each per charge (BR .21).
- **FR-FIN-001.22** — A school admin sees a **Resumen**: collected this month (by method), outstanding, overdue, number of accounts with overdue balance.
- **FR-FIN-001.23** — A school admin sees a **morosidad (aging) report**: per account, overdue amount split 1–30 · 31–60 · 61–90 · > 90 days, filterable by degree/study plan/class group, exportable as CSV.

## 4. Business rules
- **BR-FIN-001.1** — A student belongs to **exactly one** family account per school. Accounts never span schools (receipts, currency and numbering are per school). Siblings whose guardians differ are joined only by an admin move (FR .3).
- **BR-FIN-001.2** — Moving a student between accounts moves only their **pending** charges with no allocations; charges with payments stay on the original account. Target must be in the same school, else `400 La cuenta destino pertenece a otra escuela`.
- **BR-FIN-001.3** — All amounts use the school's `currencyCode` and are stored as `Decimal(12,2)`; amounts ≤ 0 are rejected `400`. A payment or allocation never exceeds what is due on the charge (`400 El monto excede el saldo del cargo`).
- **BR-FIN-001.4** — Study-plan assignment of a fee item **overrides** the degree's assignment of the same item for that plan; otherwise items add up. One assignment per (item, target, year) → `409` on duplicate.
- **BR-FIN-001.5** — Generation never duplicates: a charge is unique per (student, fee item, year, installment index). Re-running only creates what is missing; it never changes existing charges. Students with `enrollmentStatus ≠ ACTIVE` are skipped.
- **BR-FIN-001.6** — A charge with any active allocation cannot be cancelled → `409 El cargo tiene pagos aplicados; anule el pago primero`. Cancellation needs a reason (`400`).
- **BR-FIN-001.7** — Discounts apply to charges of the kinds they target. Several discounts on one charge: percentages are summed (capped at 100 %) and applied first, fixed amounts after; the net amount never goes below 0. A charge with net 0 is created as `PAID` with no payment.
- **BR-FIN-001.8** — Late fees, store orders and manual charges never receive discounts.
- **BR-FIN-001.9** — Recalculation (FR .11) touches only charges with status `PENDING`, no allocations and due date ≥ today.
- **BR-FIN-001.10** — Charge status is derived: `PENDING` (outstanding > 0, not due), `PARTIAL` (some paid, not due), `OVERDUE` (outstanding > 0, past due), `PAID` (outstanding = 0), `CANCELLED`.
- **BR-FIN-001.11** — In checkout, only one selected charge may be paid partially; all others are paid in full. Minimum online payment is 1.00 (`400`). Charges must all belong to the same account, which must be the caller's (`403` otherwise).
- **BR-FIN-001.12** — Card payment runs through a `PaymentProvider` interface. v1 ships `MockCardProvider` only: card number ending `0002` → declined ("Tarjeta rechazada"), ending `9995` → declined ("Fondos insuficientes"), any other valid Luhn number → approved. **Full card number and CVV never reach the API or the database**; the client sends only brand, last 4 and expiry (mock token). Credit cards and Yappy online are future providers.
- **BR-FIN-001.13** — Checkout is idempotent: the client sends an idempotency key; a retry with the same key returns the first result and never charges twice. Outstanding amounts are re-checked inside the transaction; if a selected charge was paid meanwhile → `409 Uno de los cargos ya fue pagado`.
- **BR-FIN-001.14** — Offline payments require a reference (transfer number / Yappy transaction id); same method + reference already used on a non-voided payment in the school → `409 Referencia ya registrada`.
- **BR-FIN-001.15** — Card payments can't create *saldo a favor* (they're always fully allocated). Offline payments may.
- **BR-FIN-001.16** — Receipt numbers are sequential per school with no gaps (`R-000123`), assigned inside the payment transaction. Voided payments keep their number.
- **BR-FIN-001.17** — A payment whose generated credit has already been applied to other charges can't be voided until those credit applications are reversed → `409 El saldo a favor de este pago ya fue usado`. Only `MANAGE_FINANCIALS` can void; reason required.
- **BR-FIN-001.18** — *Saldo a favor* is never paid out in cash in v1; it is only applied to charges of the same account.
- **BR-FIN-001.19** — At most one late fee per original charge. A late fee is created only if the original's outstanding amount > 0 at the end of the grace period, and is never itself subject to a late fee.
- **BR-FIN-001.20** — A store order by a user with no family account in that school (e.g. a staff member) keeps the store's own payment flow (out of FIN). Cancelling a store order cancels its charge if unpaid, otherwise `409`.
- **BR-FIN-001.21** — Reminders go only to guardians with a user account linked to a student of the account; none for `CANCELLED`/`PAID` charges or net 0.

## 5. Data
New models (legacy `Charge`, `Payment`, `ChargeType`, `ChargeStatus`, `StudyPlan.monthlyTuitionAmount/tuitionStartMonth/tuitionEndMonth`, `DegreeEnrollmentCost`, `StudyPlanEnrollmentCost` are **dropped**, see Q1):

- `FamilyAccount` — `id, organizationId, schoolId, number (per school), creditBalance` (cached), timestamps. `Student.familyAccounts` via `FamilyAccountStudent (accountId, studentId, schoolId)` with `@@unique([studentId, schoolId])`.
- `FeeItem` — `schoolId, name, kind (ENROLLMENT|TUITION|OTHER), amount, schedule (ONE_TIME|MONTHLY), dueMonth? (ONE_TIME), startMonth?, endMonth? (MONTHLY), dueDay, active`. Months resolve to dates per academic year: a month ≥ the school's `schoolYearStartMonth` is in year *Y*, earlier months in *Y + 1*; the due day is clamped to the month's last day (S02).
- `FeeAssignment` — `feeItemId, year, degreeId? | studyPlanId?, amountOverride?`.
- `DiscountType` — `schoolId, name, mode (PERCENT|FIXED), value, appliesTo FeeKind[] , active`; `StudentDiscount` — `studentId, discountTypeId, year, endsAt?, note`.
- `Charge` (new) — `organizationId, schoolId, accountId, studentId?, year, source (FEE|MANUAL|LATE_FEE|STORE_ORDER), feeItemId?, installment?, parentChargeId? (late fee), storeOrderId?, description, grossAmount, discountAmount, netAmount, dueDate, status, cancelledAt/By/Reason`; `ChargeDiscount` lines.
- `Payment` (new) — `organizationId, schoolId, accountId, method (CARD|BANK_TRANSFER|YAPPY|CREDIT), status (PENDING|COMPLETED|FAILED|VOIDED), amount, receivedAt, reference, cardBrand?, cardLast4?, provider, providerRef, idempotencyKey (unique), receiptNumber, payerUserId?, createdById, voidedAt/By/Reason`.
- `PaymentAllocation` — `paymentId, chargeId, amount, reversedAt?`.
- `CreditEntry` — `accountId, paymentId?, amount (+ generated / − applied / ± reversal), chargeId?, reason`.
- `FinanceSettings` *(from S03, which adds `receiptSeq` only; later slices add their fields)* — per school: `receiptSeq, lateFeeEnabled, lateFeeGraceDays, lateFeeMode, lateFeeValue, lateFeeAppliesTo, reminderDaysBefore`.
- `FinanceAuditLog` — `organizationId, schoolId, actorId, action, entity, entityId, payload, createdAt`: charge generation/cancel, payment create/void, credit apply, discount assign, settings change.
- Account membership is kept by `finance/account-sync.ts` (S01): every account read first syncs the school's accounts with its parent ↔ student links, so links made anywhere (onboarding, imports, the parents directory) are picked up without hooks. A solo account with no charges folds into a sibling's account once a guardian is linked; accounts with charges or several students are only changed by an admin.
- Tenancy: every query filters by caller's `organizationId` and the requested `schoolId` (validated against the org). Parent reads/writes additionally require the account to contain a student linked to the caller's `Parent` profile.
- Ledger integrity: balances are computed from charges − active allocations; `creditBalance` is a cache rebuilt from `CreditEntry`. No hard deletes of charges/payments.

## 6. API surface
Base `/api/v1/finance` (new controller; legacy `/api/v1/financial/*` removed).

| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `GET /accounts?schoolId&q&overdue&page` | List accounts | `VIEW_FINANCIALS` (staff) | .2 |
| `GET /accounts/:id` | Account detail + ledger | `VIEW_FINANCIALS` (staff, or guardian of account) | .3 .12 |
| `POST /accounts/:id/students/:studentId/move` | Move student | `MANAGE_FINANCIALS` | .3 |
| `GET/POST/PATCH /fee-items` | Fee catalog | `MANAGE_FINANCIALS` | .4 |
| `GET/POST/DELETE /fee-assignments`, `GET /fee-targets` | Assign to degree/plan; degrees → plans → groups of the school | `MANAGE_FINANCIALS` | .5 |
| `GET /students?schoolId&search` | Active students by name or cédula (charge and generation pickers) | `MANAGE_FINANCIALS` | .6 .7 |
| `POST /charges/generate/preview`, `POST /charges/generate` | Generate | `MANAGE_FINANCIALS` | .6 |
| `POST /charges` | Manual charge (student or group) | `MANAGE_FINANCIALS` | .7 |
| `POST /charges/:id/cancel` | Cancel | `MANAGE_FINANCIALS` | .8 .19 |
| `GET/POST/PATCH /discount-types`, `GET/POST/DELETE /student-discounts` | Discounts | `MANAGE_FINANCIALS` | .9–.11 |
| `GET /me/accounts` | Parent's accounts summary | `VIEW_FINANCIALS` | .12 |
| `POST /me/checkout` | Pay selected charges (mock card + credit) | `PAY_FINANCIALS` | .13 .17 |
| `POST /payments` | Register offline payment | `MANAGE_FINANCIALS` | .14 |
| `GET /payments?schoolId&method&from&to` | Payments list | `VIEW_FINANCIALS` | .15 |
| `GET /payments/:id/receipt` | Receipt data | `VIEW_FINANCIALS` (staff or account guardian) | .15 |
| `POST /payments/:id/void` | Void | `MANAGE_FINANCIALS` | .16 |
| `POST /accounts/:id/credit/apply` | Apply credit | `MANAGE_FINANCIALS` | .17 |
| `GET/PATCH /settings?schoolId` | Late fees, reminders | `MANAGE_FINANCIALS` | .18 .21 |
| `GET /reports/summary`, `GET /reports/aging(.csv)` | Reports | `VIEW_FINANCIALS` | .22 .23 |

Events / side effects: daily cron (overdue status + late fees, 06:00 school TZ); daily cron reminders (08:00); `Notification` rows + email via `ResendService`; store checkout calls FIN to create `STORE_ORDER` charge; HOM admin/parent home finance facts read from the new model.

## 7. UX
Admin (`/financial-module`, sidebar "Finanzas"; school picker in header):
- **Resumen** — KPI tiles (FR .22) and recent payments.
- **Cuentas** — accounts table → **Cuenta** detail page `/financial-module/accounts/:id` (tabs Cargos · Pagos · Movimientos; actions "Registrar pago", "Nuevo cargo", "Aplicar saldo a favor", "Mover estudiante").
- **Cargos** — school-wide charge list with filters; "Generar cargos" wizard (scope → preview → confirm).
- **Pagos** — payments list, receipt drawer, "Anular pago" dialog.
- **Catálogo** — fee items + assignments by degree/study plan.
- **Descuentos** — discount types + students with discounts.
- **Morosidad** — aging report + CSV.
- **Configuración** — late fees, reminders.

Parent (`/parent/finances`):
- **Estado de cuenta** — one card per school account: totals, charges grouped by child / Tienda, checkboxes → sticky "Pagar (n) · $X" bar.
- **Pagar** `/parent/finances/pay` — summary, credit toggle, mock card form (labelled "Modo de prueba" with test card hints), confirm → success with receipt / decline error.
- **Recibos** — history and `/parent/finances/receipts/:id` print-friendly view.

States everywhere: empty ("No hay cargos pendientes"), loading (`lib-loader`), error toast, no permission (hidden nav / 403 page). Components from `libs/ui` only (Card, Tabs, Table, Dialog, Badge for status, PageHeader); status colours via semantic tokens (`success`, `warning`, `danger`).

## 8. Non-functional
- Money math in `Decimal` server-side only; client never computes allocations it sends without server re-validation.
- PCI: no PAN/CVV storage or transit to our API (BR .12); mock form is clearly labelled.
- Checkout and payment registration in a single DB transaction with row locks on affected charges; receipt sequence locked per school.
- UI in Spanish; amounts formatted with school currency (`es-PA`).
- Lists paginated (25), reports for ≤ 5 000 accounts < 2 s.
- Parent views are mobile-first (Capacitor later).

## 9. Out of scope
- Real card processing, Yappy online/API, refunds to card (mock record only), payment plans/convenios, electronic invoicing (DGI factura electrónica), taxes (ITBMS), cash and check methods, cash-out of credit, student-facing finance view, multi-currency within a school, accounting exports beyond CSV, migrating legacy finance data.

## 10. Open questions
- [x] **Q1** — Drop legacy finance tables and enrolment-cost/tuition columns **without migrating data**. *(answered 2026-11-26)*
- [x] **Q2** — One account **per school** (BR .1). *(answered 2026-11-26)*
- [x] **Q3** — Store orders are added to the family account and paid later (FR .20). *(answered 2026-11-26)*
- [ ] **Q4** — Can parents *report* a transfer/Yappy with a proof image for admin approval? v1: admin-only. *(deferred)*
- [x] **Q5** — Sibling discount is assigned manually like any discount. *(answered 2026-11-26)*
- [ ] **Q6** — Confirm the success metric. *(deferred)*

## 11. Slices
| Slice | Title | FRs | Status |
|---|---|---|---|
| [FIN-001-S01](../slices/FIN-001-S01-ledger-foundation.md) | Ledger foundation: family accounts, manual charge, parent Estado de cuenta | .1 .2 .3 (read) .7 .12 | Done |
| [FIN-001-S02](../slices/FIN-001-S02-fee-catalog-generation.md) | Fee catalog, assignments and charge generation | .4 .5 .6 | Done |
| [FIN-001-S03](../slices/FIN-001-S03-offline-payments-receipts.md) | Register offline payment (Transfer/ACH, Yappy) + receipt | .14 .15 | Done |
| [FIN-001-S04](../slices/FIN-001-S04-family-checkout-mock-card.md) | Parent family checkout with mock card | .13 .15 | Done |
| [FIN-001-S05](../slices/FIN-001-S05-void-payment-cancel-charge.md) | Void payment + cancel charge | .8 .16 | In review |
| FIN-001-S06 | Saldo a favor: apply by admin and at checkout | .17 | Proposed |
| FIN-001-S07 | Account detail actions: move student, ledger tab | .3 | Proposed |
| FIN-001-S08 | Discounts & scholarships | .9 .10 .11 | Proposed |
| FIN-001-S09 | Late fees (settings + daily job) | .18 .19 | Proposed |
| FIN-001-S10 | Store orders into the family ledger | .20 | Proposed |
| FIN-001-S11 | Due-soon / overdue reminders | .21 | Proposed |
| FIN-001-S12 | Resumen KPIs + morosidad report & CSV | .22 .23 | Proposed |
