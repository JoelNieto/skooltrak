import { Badge, Button, Card, Loader, PageHeader, UiCheckbox, UiTable, UiTableError } from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import {
  FinanceAccountDetail,
  FinanceCharge,
  groupCharges,
  localToday,
  money,
  PAYMENT_METHOD_LABEL,
  shortDate,
  statusLabel,
  statusTone,
} from '../finance/finance.types';

/**
 * Estado de cuenta (FR-FIN-001.12): one family account per school where the guardian has a linked
 * child, with its charges grouped by child and its payments with receipts (FIN-001-S03). Paying
 * online arrives with FIN-001-S04.
 */
@Component({
  selector: 'app-parent-finances',
  imports: [Badge, Button, Card, Loader, PageHeader, RouterLink, UiCheckbox, UiTable, UiTableError],
  template: `
    <lib-page-header title="Estado de cuenta" subtitle="Lo que tienes pendiente con el colegio de tus hijos." />

    @if (accounts.isLoading() && !accounts.hasValue()) {
      <div class="flex justify-center py-12"><lib-loader /></div>
    } @else if (accounts.error()) {
      <div uiCard>
        <table uiTable>
          <tbody><tr uiTableError [columns]="1" (retry)="accounts.reload()"></tr></tbody>
        </table>
      </div>
    } @else {
      @let list = accounts.value() ?? [];
      @if (!list.length) {
        <div uiCard class="p-8 text-center text-ink-muted">
          No tienes hijos vinculados o el colegio aún no ha registrado cargos.
        </div>
      } @else {
        <div class="flex flex-col gap-4 max-w-2xl">
          @if (list.length > 1) {
            <div class="flex flex-wrap gap-2" role="tablist" aria-label="Colegio">
              @for (a of list; track a.id) {
                <button
                  uiButton
                  size="sm"
                  type="button"
                  role="tab"
                  [variant]="a.id === selected()?.id ? 'primary' : 'secondary'"
                  [attr.aria-selected]="a.id === selected()?.id"
                  (click)="selectedId.set(a.id)"
                >
                  {{ a.school.name }}
                </button>
              }
            </div>
          }

          @if (selected(); as a) {
            <section uiCard class="p-4 md:p-5 flex flex-col gap-3" data-testid="parent-account-summary">
              <div class="flex justify-between items-baseline gap-2 flex-wrap">
                <span class="text-ink-muted">
                  {{ a.school.name }} · Cuenta <span class="font-mono">{{ a.number }}</span>
                </span>
                <span class="text-sm text-ink-muted">{{ childNames(a) }}</span>
              </div>
              <div>
                <div class="text-sm text-ink-muted">Por pagar</div>
                <div class="type-display text-ink-strong" data-testid="parent-due">{{ fmt(a, a.dueAmount) }}</div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-box p-3" [class.bg-warning/15]="a.overdueAmount > 0" [class.bg-surface-0]="!a.overdueAmount">
                  <div class="text-xs font-semibold" [class.text-warning]="a.overdueAmount > 0" [class.text-ink-muted]="!a.overdueAmount">
                    Vencido
                  </div>
                  <div class="font-semibold text-ink-strong">{{ fmt(a, a.overdueAmount) }}</div>
                </div>
                <div class="rounded-box p-3 bg-surface-0">
                  <div class="text-xs font-semibold text-ink-muted">Saldo a favor</div>
                  <div class="font-semibold text-ink-strong" data-testid="parent-credit">{{ fmt(a, a.creditAmount) }}</div>
                </div>
              </div>
            </section>

            @for (group of groups(); track group.key) {
              <section uiCard class="overflow-hidden">
                <h2 class="px-4 py-3 font-semibold text-ink-strong border-b border-line">{{ group.title }}</h2>
                <ul>
                  @for (c of group.charges; track c.id) {
                    <li class="flex gap-3 items-start px-4 py-3 border-t border-line first:border-t-0" data-testid="parent-charge">
                      @if (canPay() && c.outstanding > 0) {
                        <input
                          uiCheckbox
                          type="checkbox"
                          class="mt-1"
                          [attr.aria-label]="'Seleccionar ' + c.description"
                          [checked]="picked().has(c.id)"
                          (change)="toggle(c.id, $any($event.target).checked)"
                        />
                      }
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-ink-strong">{{ c.description }}</div>
                        <div class="text-sm text-ink-muted mt-0.5">
                          {{ dueText(c) }} ·
                          <span uiBadge size="sm" [tone]="tone(c)">{{ label(c) }}</span>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-semibold text-ink-strong">{{ fmt(a, c.status === 'PAID' ? c.netAmount : c.outstanding) }}</div>
                        @if (c.paidAmount > 0 && c.outstanding > 0) {
                          <div class="text-xs text-ink-muted">pagado {{ fmt(a, c.paidAmount) }}</div>
                        }
                      </div>
                    </li>
                  }
                </ul>
              </section>
            } @empty {
              <div uiCard class="p-8 text-center text-ink-muted">No hay cargos en esta cuenta.</div>
            }

            @if (picked().size) {
              <div
                class="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-box bg-surface-1 border border-line shadow-lg px-4 py-3"
                data-testid="pay-bar"
              >
                <span class="text-sm text-ink-muted">{{ picked().size === 1 ? '1 cargo' : picked().size + ' cargos' }}</span>
                <button uiButton variant="primary" type="button" (click)="pay(a)">
                  Pagar ({{ picked().size }}) · {{ fmt(a, selectedTotal()) }}
                </button>
              </div>
            }

            @if (a.payments.length) {
              <section uiCard class="overflow-hidden" aria-labelledby="parent-payments-title">
                <h2 id="parent-payments-title" class="px-4 py-3 font-semibold text-ink-strong border-b border-line">Pagos y recibos</h2>
                <ul>
                  @for (p of a.payments; track p.id) {
                    <li class="border-t border-line first:border-t-0" data-testid="parent-payment">
                      <a class="flex gap-3 items-center px-4 py-3 hover:bg-surface-0" [routerLink]="['/parent/finances/receipts', p.id]">
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-ink-strong font-mono">{{ p.receiptNumber }}</div>
                          <div class="text-sm text-ink-muted">
                            {{ day(p.receivedAt) }} · {{ methodLabel[p.method] }}
                            @if (p.status === 'VOIDED') {
                              · <span uiBadge size="sm" tone="danger">Anulado</span>
                            }
                          </div>
                        </div>
                        <div class="font-semibold text-ink-strong">{{ fmt(a, p.amount) }}</div>
                      </a>
                    </li>
                  }
                </ul>
              </section>
            }
          }
        </div>
      }
    }
  `,
})
export default class ParentFinances {
  protected readonly accounts = httpResource<FinanceAccountDetail[]>(() => '/api/v1/finance/me/accounts');

  /** The school shown; the first account until the guardian picks another. */
  protected readonly selectedId = linkedSignal<FinanceAccountDetail[] | undefined, string | null>({
    source: () => this.accounts.value(),
    computation: (list, previous) => {
      const kept = previous?.value;
      return kept && list?.some((a) => a.id === kept) ? kept : (list?.[0]?.id ?? null);
    },
  });

  protected readonly selected = computed(() => this.accounts.value()?.find((a) => a.id === this.selectedId()) ?? null);
  protected readonly groups = computed(() => {
    const a = this.selected();
    return a ? groupCharges(a, { hideCancelled: true }) : [];
  });

  protected readonly methodLabel = PAYMENT_METHOD_LABEL;

  private auth = inject(Auth);
  private router = inject(Router);
  /** FIN-001-S04: guardians with PAY_FINANCIALS pick charges to pay by card. */
  protected readonly canPay = computed(() => this.auth.hasPermission('PAY_FINANCIALS'));
  /** Selected charge ids of the shown account; cleared when another school is picked. */
  protected readonly picked = linkedSignal<string | null, Set<string>>({
    source: () => this.selectedId(),
    computation: () => new Set<string>(),
  });
  protected readonly selectedTotal = computed(() => {
    const a = this.picked();
    const charges = this.selectedAccountCharges();
    return charges.filter((c) => a.has(c.id)).reduce((sum, c) => sum + Math.round(c.outstanding * 100), 0) / 100;
  });
  private readonly selectedAccountCharges = computed(() => this.accounts.value()?.find((x) => x.id === this.selectedId())?.charges ?? []);

  protected toggle(id: string, checked: boolean) {
    const next = new Set(this.picked());
    if (checked) next.add(id);
    else next.delete(id);
    this.picked.set(next);
  }

  protected pay(a: FinanceAccountDetail) {
    const charges = a.charges.filter((c) => this.picked().has(c.id)).map((c) => c.id);
    this.router.navigate(['/parent/finances/pay'], { queryParams: { account: a.id, charges: charges.join(',') } });
  }

  protected day(d: string) {
    return shortDate(d);
  }

  protected fmt(a: FinanceAccountDetail, amount: number) {
    return money(amount, a.school.currencyCode);
  }

  protected childNames(a: FinanceAccountDetail) {
    return a.students.map((s) => s.name.split(' ')[0]).join(' y ');
  }

  protected dueText(c: FinanceCharge) {
    const past = c.status === 'OVERDUE' || (c.status === 'PAID' && c.dueDate < localToday());
    return `${past ? 'Venció' : 'Vence'} ${shortDate(c.dueDate)}`;
  }

  protected label(c: FinanceCharge) {
    return statusLabel(c.status);
  }

  protected tone(c: FinanceCharge) {
    return statusTone(c.status);
  }
}
