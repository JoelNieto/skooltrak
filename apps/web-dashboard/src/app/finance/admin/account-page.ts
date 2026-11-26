import { Badge, Button, Card, Icon, Loader, Modal, UiTable, UiTableError } from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import Auth from '../../auth/auth';
import {
  daysSince,
  FinanceAccountDetail,
  FinanceCharge,
  groupCharges,
  money,
  overdueLabel,
  shortDate,
  statusLabel,
  statusTone,
} from '../finance.types';
import ChargeForm from './charge-form';
import { FinanceRefresh } from './finance-shell';

/** Finanzas › Cuenta (FR-FIN-001.3, read): who is on the account and every charge, by student. */
@Component({
  selector: 'app-finance-account',
  imports: [Badge, Button, Card, Icon, Loader, RouterLink, UiTable, UiTableError],
  template: `
    <nav class="flex gap-1.5 text-sm text-ink-muted mb-4" aria-label="Ruta">
      <a class="link link-primary" routerLink="/financial-module/accounts">Cuentas</a>
      <span aria-hidden="true">/</span>
      <span class="text-ink-strong">{{ account.value()?.name ?? '…' }}</span>
    </nav>

    @if (account.isLoading() && !account.hasValue()) {
      <div class="flex justify-center py-12"><lib-loader /></div>
    } @else if (account.error()) {
      <div uiCard>
        <table uiTable>
          <tbody><tr uiTableError [columns]="1" (retry)="account.reload()"></tr></tbody>
        </table>
      </div>
    } @else if (account.value(); as a) {
      <section uiCard class="p-5 md:p-6 flex flex-wrap gap-6 justify-between" data-testid="account-header">
        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex items-baseline gap-3 flex-wrap">
            <h2 class="type-heading-lg text-ink-strong">{{ a.name }}</h2>
            <span class="font-mono text-sm text-ink-subtle">{{ a.number }}</span>
          </div>
          <p class="text-ink-muted">
            @if (a.guardians.length) {
              Acudientes:
              @for (g of a.guardians; track g.id; let last = $last) {
                <span class="text-ink-strong font-medium">{{ g.name }}</span>
                @if (g.relationship) {
                  <span> ({{ g.relationship.toLowerCase() }})</span>
                }
                {{ last ? '' : ' · ' }}
              }
            } @else {
              Sin acudiente vinculado
            }
          </p>
          <div class="flex flex-wrap gap-1.5">
            @for (s of a.students; track s.id) {
              <span uiBadge>{{ s.name }}{{ s.classGroup ? ' · ' + s.classGroup.name : '' }}</span>
            }
          </div>
        </div>
        <dl class="flex flex-wrap gap-8 items-center">
          <div>
            <dt class="text-sm text-ink-muted">Por pagar</dt>
            <dd class="type-heading-md font-bold text-ink-strong" data-testid="due-amount">{{ fmt(a.dueAmount) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-muted">Vencido</dt>
            <dd class="type-heading-md font-bold" [class.text-warning]="a.overdueAmount > 0">{{ fmt(a.overdueAmount) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-muted">Saldo a favor</dt>
            <dd class="type-heading-md font-bold text-ink-strong">{{ fmt(a.creditAmount) }}</dd>
          </div>
        </dl>
      </section>

      <section uiCard class="mt-6 overflow-hidden">
        <div class="flex flex-wrap gap-3 justify-between items-center px-5 py-3 border-b border-line">
          <h3 class="type-heading-md text-ink-strong">Cargos</h3>
          @if (canManage()) {
            <button uiButton variant="primary" size="sm" type="button" (click)="newCharge(a)">
              <ui-icon name="plus" /> Nuevo cargo
            </button>
          }
        </div>
        <div class="overflow-x-auto">
          <table uiTable>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Vence</th>
                <th>Estado</th>
                <th class="text-right">Monto</th>
                <th class="text-right">Descuento</th>
                <th class="text-right">Pendiente</th>
              </tr>
            </thead>
            @for (group of groups(); track group.key) {
              <tbody>
                <tr>
                  <th colspan="6" scope="colgroup" class="bg-surface-0 text-ink-strong font-semibold">{{ group.title }}</th>
                </tr>
                @for (c of group.charges; track c.id) {
                  <tr data-testid="charge-row" [class.text-ink-subtle]="c.status === 'CANCELLED'">
                    <td>
                      <span [class.line-through]="c.status === 'CANCELLED'">{{ c.description }}</span>
                      @if (c.cancelReason) {
                        <div class="text-xs">Cancelado: “{{ c.cancelReason }}”</div>
                      }
                    </td>
                    <td class="whitespace-nowrap">{{ date(c.dueDate) }}</td>
                    <td>
                      <span uiBadge size="sm" [tone]="tone(c)">{{ label(c) }}</span>
                    </td>
                    <td class="text-right" [class.line-through]="c.status === 'CANCELLED'">{{ fmt(c.grossAmount) }}</td>
                    <td class="text-right text-ink-muted">{{ c.discountAmount > 0 ? '−' + fmt(c.discountAmount) : '—' }}</td>
                    <td class="text-right font-semibold text-ink-strong">
                      {{ c.status === 'CANCELLED' ? '—' : fmt(c.outstanding) }}
                    </td>
                  </tr>
                }
              </tbody>
            } @empty {
              <tbody>
                <tr>
                  <td colspan="6" class="py-10 text-center text-ink-muted">Esta cuenta aún no tiene cargos.</td>
                </tr>
              </tbody>
            }
          </table>
        </div>
      </section>
    }
  `,
})
export default class AccountPage {
  /** Route param. */
  readonly id = input.required<string>();

  private auth = inject(Auth);
  private modal = inject(Modal);
  private refresh = inject(FinanceRefresh);

  protected readonly canManage = computed(() => this.auth.hasPermission('MANAGE_FINANCIALS'));

  protected readonly account = httpResource<FinanceAccountDetail>(() => {
    this.refresh.version();
    return `/api/v1/finance/accounts/${this.id()}`;
  });

  protected readonly groups = computed(() => {
    const a = this.account.value();
    return a ? groupCharges(a) : [];
  });

  protected fmt(amount: number) {
    return money(amount, this.account.value()?.school.currencyCode);
  }

  protected date(d: string) {
    return shortDate(d);
  }

  protected label(c: FinanceCharge) {
    if (c.status !== 'OVERDUE') return statusLabel(c.status);
    const days = daysSince(c.dueDate);
    return days > 0 ? `Vencido · ${overdueLabel(days)}` : 'Vencido';
  }

  protected tone(c: FinanceCharge) {
    return statusTone(c.status);
  }

  protected newCharge(a: FinanceAccountDetail) {
    this.modal
      .open(ChargeForm, { title: 'Nuevo cargo', size: 'medium', data: { students: a.students } })
      .closed.subscribe(() => this.refresh.bump());
  }
}
