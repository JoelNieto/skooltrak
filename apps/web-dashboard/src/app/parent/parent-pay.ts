import { Alert, Button, Card, Loader, PageHeader, UiField, UiInput, UiTable } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CARD_BRAND_LABEL, cardBrand, cardDigits, expired, formatCardNumber, luhnValid, parseExpiry, TEST_CARDS } from '../finance/card';
import { apiError, FinanceAccountDetail, localToday, money, PaymentReceipt, shortDate, toCents } from '../finance/finance.types';

interface CheckoutResult {
  status: 'COMPLETED' | 'DECLINED';
  message?: string;
  receipt?: PaymentReceipt;
}

/**
 * Pagar (FR-FIN-001.13): the charges picked in Estado de cuenta, each paid in full except at most
 * one (BR-FIN-001.11), and the card form. "Modo de prueba": the card is checked here and only its
 * brand, last 4 digits and expiry go to the API (BR-FIN-001.12). Each attempt has its own
 * idempotency key, so a double click or a retry never charges twice (BR-FIN-001.13).
 */
@Component({
  selector: 'app-parent-pay',
  imports: [Alert, Button, Card, Loader, PageHeader, RouterLink, UiField, UiInput, UiTable],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Estado de cuenta', link: '/parent/finances' }, { label: 'Pagar' }]"
      title="Pagar"
      subtitle="Paga los cargos que elegiste con tu tarjeta."
    />

    @if (accounts.isLoading() && !accounts.hasValue()) {
      <div class="flex justify-center py-12"><lib-loader /></div>
    } @else if (!payAccount() || !rows().length) {
      <div uiCard class="p-8 text-center text-ink-muted max-w-2xl">
        No hay cargos pendientes para pagar. <a class="link link-primary" routerLink="/parent/finances">Volver al estado de cuenta</a>
      </div>
    } @else {
      @let a = payAccount()!;
      <div class="flex flex-col gap-4 max-w-2xl">
        <section uiCard class="overflow-hidden" aria-labelledby="pay-summary-title">
          <h2 id="pay-summary-title" class="px-4 py-3 font-semibold text-ink-strong border-b border-line">
            {{ a.school.name }} · Cuenta <span class="font-mono">{{ a.number }}</span>
          </h2>
          <table uiTable>
            <thead>
              <tr>
                <th>Cargo</th>
                <th class="text-right">Debe</th>
                <th class="text-right w-36">A pagar</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rows(); track r.id) {
                <tr data-testid="pay-line">
                  <td>
                    <div class="font-medium text-ink-strong">{{ r.description }}</div>
                    <div class="text-xs text-ink-muted">{{ r.student }} · vence {{ date(r.dueDate) }}</div>
                  </td>
                  <td class="text-right whitespace-nowrap">{{ fmt(r.outstandingCents / 100) }}</td>
                  <td class="text-right">
                    <input
                      uiInput
                      size="sm"
                      type="number"
                      step="0.01"
                      inputmode="decimal"
                      class="w-full! text-right"
                      [attr.aria-label]="'Monto a pagar de ' + r.description"
                      [value]="((amounts().get(r.id) ?? 0) / 100).toFixed(2)"
                      (change)="setAmount(r.id, $any($event.target).value)"
                    />
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <th colspan="2">Total</th>
                <th class="text-right" data-testid="pay-total">{{ fmt(totalCents() / 100) }}</th>
              </tr>
            </tfoot>
          </table>
          @if (linesError(); as e) {
            <p class="px-4 pb-3 text-sm text-danger" role="alert">{{ e }}</p>
          } @else {
            <p class="px-4 pb-3 text-xs text-ink-muted">Puedes pagar una parte de uno de los cargos; los demás se pagan completos.</p>
          }
        </section>

        <form uiCard class="p-4 md:p-5 flex flex-col gap-4" (submit)="submit($event)" aria-labelledby="card-title">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 id="card-title" class="font-semibold text-ink-strong">Tarjeta</h2>
            <span class="text-xs font-semibold uppercase tracking-wide text-warning">Modo de prueba</span>
          </div>
          <details class="text-sm text-ink-muted">
            <summary class="cursor-pointer">Tarjetas de prueba</summary>
            <ul class="mt-2 flex flex-col gap-1 font-mono">
              @for (t of testCards; track t.number) {
                <li>{{ t.number }} · <span class="font-sans">{{ t.outcome }}</span></li>
              }
            </ul>
            <p class="mt-1">Cualquier fecha futura y cualquier CVV. No se cobra nada real.</p>
          </details>

          <ui-field label="Nombre en la tarjeta">
            <input uiInput type="text" autocomplete="cc-name" [value]="holder()" (input)="holder.set($any($event.target).value)" />
          </ui-field>
          <ui-field label="Número de tarjeta" [hint]="brandLabel()">
            <input
              uiInput
              type="text"
              inputmode="numeric"
              autocomplete="cc-number"
              [value]="number()"
              (input)="setNumber($any($event.target))"
            />
          </ui-field>
          <div class="grid grid-cols-2 gap-4">
            <ui-field label="Vencimiento (MM/AA)">
              <input uiInput type="text" inputmode="numeric" autocomplete="cc-exp" maxlength="5" [value]="expiry()" (input)="expiry.set($any($event.target).value)" />
            </ui-field>
            <ui-field label="CVV">
              <input uiInput type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" [value]="cvv()" (input)="cvv.set($any($event.target).value)" />
            </ui-field>
          </div>

          @if (error(); as e) {
            <div uiAlert tone="danger" data-testid="pay-error">{{ e }}</div>
          }

          <button uiButton variant="primary" type="submit" [disabled]="paying() || !!linesError()">
            {{ paying() ? 'Procesando…' : 'Pagar ' + fmt(totalCents() / 100) }}
          </button>
        </form>
      </div>
    }
  `,
})
export default class ParentPay {
  /** `?account=` */
  readonly account = input<string>();
  /** `?charges=a,b` */
  readonly charges = input<string>();

  private http = inject(HttpClient);
  private router = inject(Router);

  protected readonly testCards = TEST_CARDS;
  protected readonly accounts = httpResource<FinanceAccountDetail[]>(() => '/api/v1/finance/me/accounts');
  protected readonly payAccount = computed(() => this.accounts.value()?.find((a) => a.id === this.account()) ?? null);

  protected readonly rows = computed(() => {
    const a = this.payAccount();
    if (!a) return [];
    const ids = new Set((this.charges() ?? '').split(',').filter(Boolean));
    const names = new Map(a.students.map((s) => [s.id, s.name]));
    return a.charges
      .filter((c) => ids.has(c.id) && c.outstanding > 0 && c.status !== 'CANCELLED')
      .sort((x, y) => x.dueDate.localeCompare(y.dueDate))
      .map((c) => ({
        id: c.id,
        description: c.description,
        student: c.studentId ? (names.get(c.studentId) ?? '') : 'Cuenta',
        dueDate: c.dueDate,
        outstandingCents: toCents(c.outstanding),
      }));
  });

  /** Amount per charge in cents; each starts at what the charge owes. */
  protected readonly amounts = linkedSignal(() => new Map(this.rows().map((r) => [r.id, r.outstandingCents])));
  protected readonly totalCents = computed(() => [...this.amounts().values()].reduce((s, v) => s + v, 0));
  protected readonly linesError = computed(() => {
    const rows = this.rows();
    const amounts = this.amounts();
    if (rows.some((r) => !((amounts.get(r.id) ?? 0) > 0))) return 'Cada monto debe ser mayor que cero';
    if (rows.some((r) => (amounts.get(r.id) ?? 0) > r.outstandingCents)) return 'Un monto supera lo que debe el cargo';
    if (rows.filter((r) => (amounts.get(r.id) ?? 0) < r.outstandingCents).length > 1) return 'Solo un cargo puede pagarse en parte';
    if (this.totalCents() < 100) return 'El pago mínimo en línea es 1.00';
    return null;
  });

  protected readonly holder = signal('');
  protected readonly number = signal('');
  protected readonly expiry = signal('');
  protected readonly cvv = signal('');
  protected readonly paying = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly brandLabel = computed(() => (cardDigits(this.number()).length >= 2 ? CARD_BRAND_LABEL[cardBrand(this.number())] : ''));
  /** One key per attempt; renewed after a decline so another card is a new attempt. */
  private idempotencyKey = crypto.randomUUID();

  protected setAmount(id: string, value: string) {
    const next = new Map(this.amounts());
    next.set(id, toCents(Number(value)));
    this.amounts.set(next);
  }

  protected setNumber(el: HTMLInputElement) {
    const formatted = formatCardNumber(el.value);
    this.number.set(formatted);
    el.value = formatted;
  }

  protected fmt(amount: number) {
    return money(amount, this.payAccount()?.school.currencyCode);
  }

  protected date(d: string) {
    return shortDate(d);
  }

  async submit(event: Event) {
    event.preventDefault();
    const a = this.payAccount();
    if (!a || this.linesError() || this.paying()) return;
    const exp = parseExpiry(this.expiry());
    if (!this.holder().trim()) return this.error.set('Escribe el nombre en la tarjeta');
    if (!luhnValid(this.number())) return this.error.set('El número de tarjeta no es válido');
    if (!exp) return this.error.set('Escribe el vencimiento como MM/AA');
    if (expired(exp, localToday())) return this.error.set('La tarjeta está vencida');
    if (!/^\d{3,4}$/.test(this.cvv())) return this.error.set('El CVV no es válido');
    this.error.set(null);
    this.paying.set(true);
    try {
      const digits = cardDigits(this.number());
      const result = await firstValueFrom(
        this.http.post<CheckoutResult>('/api/v1/finance/me/checkout', {
          accountId: a.id,
          idempotencyKey: this.idempotencyKey,
          lines: this.rows().map((r) => ({ chargeId: r.id, amount: (this.amounts().get(r.id) ?? 0) / 100 })),
          // Never the number or the CVV (BR-FIN-001.12).
          card: { brand: cardBrand(digits), last4: digits.slice(-4), expMonth: exp.month, expYear: exp.year },
        }),
      );
      if (result.status === 'COMPLETED' && result.receipt) {
        await this.router.navigate(['/parent/finances/receipts', result.receipt.id]);
        return;
      }
      this.error.set(result.message ?? 'Pago rechazado');
      this.idempotencyKey = crypto.randomUUID();
    } catch (err) {
      this.error.set(apiError(err, 'No se pudo procesar el pago'));
      this.accounts.reload();
    } finally {
      this.paying.set(false);
    }
  }
}
