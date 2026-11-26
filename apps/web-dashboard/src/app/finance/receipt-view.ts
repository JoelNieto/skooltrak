import { Badge, Button, Card, Icon, Loader, UiTable, UiTableError } from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { money, PAYMENT_METHOD_LABEL, PaymentReceipt, shortDate } from './finance.types';

/**
 * A payment's receipt (FR-FIN-001.15), print-friendly: "Imprimir" uses the browser's print, which
 * also saves it as PDF. Shared by staff (`/financial-module/payments/:id`) and guardians
 * (`/parent/finances/receipts/:id`); the API decides who may read it.
 */
@Component({
  selector: 'app-finance-receipt',
  imports: [Badge, Button, Card, Icon, Loader, RouterLink, UiTable, UiTableError],
  styles: `
    @media print {
      :host .no-print {
        display: none !important;
      }
    }
  `,
  template: `
    <nav class="no-print flex flex-wrap gap-3 justify-between items-center mb-4" aria-label="Ruta">
      <a class="link link-primary text-sm" [routerLink]="backLink()">← {{ backLabel() }}</a>
      @if (receipt.hasValue()) {
        <button uiButton variant="secondary" size="sm" type="button" (click)="print()"><ui-icon name="printer" /> Imprimir</button>
      }
    </nav>

    @if (receipt.isLoading() && !receipt.hasValue()) {
      <div class="flex justify-center py-12"><lib-loader /></div>
    } @else if (receipt.error()) {
      <div uiCard>
        <table uiTable>
          <tbody><tr uiTableError [columns]="1" (retry)="receipt.reload()"></tr></tbody>
        </table>
      </div>
    } @else if (receipt.value(); as r) {
      <article uiCard class="p-6 md:p-8 max-w-2xl flex flex-col gap-6" data-testid="receipt" aria-labelledby="receipt-title">
        <header class="flex flex-wrap gap-4 justify-between items-start">
          <div class="flex items-center gap-3">
            @if (r.school.logo) {
              <img [src]="r.school.logo" alt="" class="h-12 w-12 object-contain" />
            }
            <div>
              <div class="font-semibold text-ink-strong">{{ r.school.name }}</div>
              <div class="text-sm text-ink-muted">Recibo de pago</div>
            </div>
          </div>
          <div class="text-right">
            <h1 id="receipt-title" class="type-heading-lg font-mono text-ink-strong" data-testid="receipt-number">{{ r.receiptNumber }}</h1>
            @if (r.status === 'VOIDED') {
              <span uiBadge tone="danger">ANULADO</span>
            }
          </div>
        </header>

        @if (r.status === 'VOIDED') {
          <p class="text-sm text-danger" role="note">Anulado el {{ day(r.voidedAt!) }}: “{{ r.voidReason }}”</p>
        }

        <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt class="text-ink-muted">Cuenta</dt>
            <dd class="text-ink-strong">{{ r.account.name }} · <span class="font-mono">{{ r.account.number }}</span></dd>
          </div>
          <div>
            <dt class="text-ink-muted">Pagado por</dt>
            <dd class="text-ink-strong">{{ r.payers.length ? r.payers.join(', ') : r.account.name }}</dd>
          </div>
          <div>
            <dt class="text-ink-muted">Fecha</dt>
            <dd class="text-ink-strong">{{ day(r.receivedAt) }}</dd>
          </div>
          <div>
            <dt class="text-ink-muted">Método</dt>
            <dd class="text-ink-strong" data-testid="receipt-method">{{ methodLabel(r) }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="text-ink-muted">{{ r.method === 'CARD' ? 'Tarjeta' : 'Referencia' }}</dt>
            <dd class="text-ink-strong font-mono" data-testid="receipt-reference">
              {{ r.method === 'CARD' ? (r.cardBrand ?? '') + ' ···· ' + r.cardLast4 : r.reference }}
            </dd>
          </div>
        </dl>

        <table uiTable class="text-sm">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Estudiante</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            @for (l of r.lines; track l.chargeId) {
              <tr data-testid="receipt-line">
                <td>{{ l.description }}</td>
                <td>{{ l.student ?? '—' }}</td>
                <td class="text-right">{{ fmt(r, l.amount) }}</td>
              </tr>
            }
            @if (r.creditAmount > 0) {
              <tr data-testid="receipt-credit">
                <td colspan="2">Saldo a favor</td>
                <td class="text-right">{{ fmt(r, r.creditAmount) }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <th colspan="2">Total</th>
              <th class="text-right" data-testid="receipt-total">{{ fmt(r, r.amount) }}</th>
            </tr>
          </tfoot>
        </table>

        @if (r.note) {
          <p class="text-sm text-ink-muted">Nota: {{ r.note }}</p>
        }
        <footer class="text-xs text-ink-subtle">
          Registrado el {{ stamp(r.createdAt) }}{{ r.createdBy ? ' por ' + r.createdBy : '' }}.
        </footer>
      </article>
    }
  `,
})
export default class ReceiptView {
  /** Payment id (route param). */
  readonly id = input.required<string>();
  readonly backLink = input<string>('/financial-module/payments');
  readonly backLabel = input<string>('Pagos');

  protected readonly receipt = httpResource<PaymentReceipt>(() => `/api/v1/finance/payments/${this.id()}/receipt`);

  protected fmt(r: PaymentReceipt, amount: number) {
    return money(amount, r.school.currencyCode);
  }

  protected day(d: string) {
    return shortDate(d.slice(0, 10));
  }

  protected stamp(iso: string) {
    return new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }

  protected methodLabel(r: PaymentReceipt) {
    return PAYMENT_METHOD_LABEL[r.method];
  }

  protected print() {
    window.print();
  }
}
