import { Badge, Card, PaginatorV2, UiInput, UiSelect, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, UiTableToolbar, listState } from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Store from '../../core/store';
import { FinancePaymentList, money, PAYMENT_METHOD_LABEL, PaymentMethod, shortDate } from '../finance.types';
import { FinanceRefresh } from './finance-shell';

/** Finanzas › Pagos (FR-FIN-001.15): the school's payments, newest first, with their receipts. */
@Component({
  selector: 'app-finance-payments',
  imports: [Badge, Card, FormsModule, PaginatorV2, RouterLink, UiInput, UiSelect, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, UiTableToolbar],
  template: `
    <ui-table-toolbar label="Filtrar pagos">
      <select uiSelect size="sm" class="w-48" aria-label="Método" [ngModel]="method()" (ngModelChange)="method.set($event)">
        <option value="">Todos los métodos</option>
        @for (m of methods; track m.value) {
          <option [value]="m.value">{{ m.label }}</option>
        }
      </select>
      <label class="flex items-center gap-2 text-sm text-ink-muted">
        Desde <input uiInput size="sm" type="date" aria-label="Desde" [ngModel]="from()" (ngModelChange)="from.set($event)" />
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-muted">
        Hasta <input uiInput size="sm" type="date" aria-label="Hasta" [ngModel]="to()" (ngModelChange)="to.set($event)" />
      </label>
      <span uiToolbarEnd class="text-sm text-ink-muted">{{ countLabel() }}</span>
    </ui-table-toolbar>

    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="payments.isLoading()">
        <thead>
          <tr>
            <th>Recibo</th>
            <th>Fecha</th>
            <th>Cuenta</th>
            <th>Método</th>
            <th>Referencia</th>
            <th class="text-right">Monto</th>
          </tr>
        </thead>
        @switch (list.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="6" [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody><tr uiTableError [columns]="6" (retry)="payments.reload()"></tr></tbody>
          }
          @case ('ready') {
            <tbody>
              @for (p of list.rows()?.items; track p.id) {
                <tr data-testid="payment-row">
                  <td>
                    <a class="link link-primary font-mono" [routerLink]="['/financial-module/payments', p.id]">{{ p.receiptNumber }}</a>
                    @if (p.status === 'VOIDED') {
                      <span uiBadge size="sm" tone="danger" class="ml-2">Anulado</span>
                    }
                  </td>
                  <td class="whitespace-nowrap">{{ date(p.receivedAt) }}</td>
                  <td>
                    <a class="link" [routerLink]="['/financial-module/accounts', p.account.id]">{{ p.account.name }}</a>
                    <div class="font-mono text-xs text-ink-subtle">{{ p.account.number }}</div>
                  </td>
                  <td>{{ methodLabel[p.method] }}</td>
                  <td class="font-mono text-sm">{{ p.reference ?? '—' }}</td>
                  <td class="text-right font-semibold" [class.line-through]="p.status === 'VOIDED'">{{ fmt(p.amount) }}</td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="6" icon="receipt" title="Sin pagos" description="Los pagos registrados aparecerán aquí."></tr>
              }
            </tbody>
          }
        }
      </table>
      <div class="p-4">
        <lib-paginator
          [total]="list.rows()?.total ?? 0"
          [page]="page()"
          [pageSize]="pageSize()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>
    </div>
  `,
})
export default class PaymentsPage {
  private store = inject(Store);
  private refresh = inject(FinanceRefresh);

  protected readonly methodLabel = PAYMENT_METHOD_LABEL;
  protected readonly methods = (['BANK_TRANSFER', 'YAPPY', 'CARD'] as PaymentMethod[]).map((value) => ({ value, label: PAYMENT_METHOD_LABEL[value] }));
  protected readonly method = signal<string>('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(25);

  protected readonly payments = httpResource<FinancePaymentList>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    this.refresh.version();
    return {
      url: '/api/v1/finance/payments',
      params: {
        schoolId,
        page: this.page(),
        take: this.pageSize(),
        ...(this.method() ? { method: this.method() } : {}),
        ...(this.from() ? { from: this.from() } : {}),
        ...(this.to() ? { to: this.to() } : {}),
      },
    };
  });
  protected readonly list = listState(this.payments);

  constructor() {
    effect(() => {
      this.method();
      this.from();
      this.to();
      untracked(() => this.page.set(1));
    });
  }

  protected readonly countLabel = computed(() => {
    const total = this.list.rows()?.total;
    return total == null ? '' : total === 1 ? '1 pago' : `${total} pagos`;
  });

  protected fmt(amount: number) {
    return money(amount, this.payments.value()?.currencyCode);
  }

  protected date(d: string) {
    return shortDate(d);
  }
}
