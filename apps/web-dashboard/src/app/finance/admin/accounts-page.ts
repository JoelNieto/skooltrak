import {
  Badge,
  Card,
  Icon,
  PaginatorV2,
  UiCheckbox,
  UiChoice,
  UiFilterChip,
  UiFilterMenu,
  UiInputGroup,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
  listState,
} from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import Store from '../../core/store';
import { FinanceAccountList, FinanceAccountSummary, money, overdueLabel } from '../finance.types';
import { FinanceRefresh } from './finance-shell';

/** Finanzas › Cuentas (FR-FIN-001.2): the school's family accounts, most overdue first. */
@Component({
  selector: 'app-finance-accounts',
  imports: [
    Badge,
    Card,
    FormField,
    Icon,
    PaginatorV2,
    RouterLink,
    UiCheckbox,
    UiChoice,
    UiFilterChip,
    UiFilterMenu,
    UiInputGroup,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
  ],
  template: `
    <ui-table-toolbar label="Filtrar cuentas">
      <label uiInputGroup size="sm" class="w-full sm:w-96">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input
          type="search"
          placeholder="Buscar por estudiante, acudiente o cédula"
          aria-label="Buscar cuenta"
          [formField]="filters.q"
        />
      </label>
      <ui-filter-menu [activeCount]="filters.overdue().value() ? 1 : 0" (clear)="filters.overdue().value.set(false)">
        <ui-choice label="Solo con saldo vencido">
          <input uiCheckbox type="checkbox" [formField]="filters.overdue" />
        </ui-choice>
      </ui-filter-menu>
      <span uiToolbarEnd class="text-sm text-ink-muted">{{ countLabel() }}</span>
      @if (filters.overdue().value()) {
        <ng-container uiToolbarChips>
          <ui-filter-chip label="Con saldo vencido" (remove)="filters.overdue().value.set(false)" />
        </ng-container>
      }
    </ui-table-toolbar>

    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="accounts.isLoading()">
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Acudientes</th>
            <th>Estudiantes</th>
            <th class="text-right">Por pagar</th>
            <th class="text-right">Vencido</th>
            <th class="text-right">Saldo a favor</th>
          </tr>
        </thead>
        @switch (list.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="8" [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="accounts.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (a of list.rows()?.items; track a.id) {
                <tr data-testid="account-row">
                  <td>
                    <a class="link link-primary font-semibold" [routerLink]="['/financial-module/accounts', a.id]">{{ a.name }}</a>
                    <div class="font-mono text-xs text-ink-subtle mt-0.5">{{ a.number }}</div>
                  </td>
                  <td>
                    @for (g of a.guardians; track g.id; let first = $first) {
                      <div [class.text-ink-subtle]="!first" [class.text-xs]="!first">{{ g.name }}</div>
                    } @empty {
                      <span class="text-ink-subtle">Sin acudiente</span>
                    }
                  </td>
                  <td>
                    @for (s of a.students; track s.id; let first = $first) {
                      <div [class.text-ink-subtle]="!first" [class.text-xs]="!first">
                        {{ s.name }}{{ s.classGroup ? ' · ' + s.classGroup.name : '' }}
                      </div>
                    }
                  </td>
                  <td class="text-right font-semibold text-ink-strong">{{ fmt(a.dueAmount) }}</td>
                  <td class="text-right">
                    @if (a.overdueAmount > 0) {
                      <span uiBadge size="sm" [tone]="overdueTone(a)">{{ fmt(a.overdueAmount) }} · {{ days(a.overdueDays) }}</span>
                    } @else {
                      <span class="text-ink-subtle">—</span>
                    }
                  </td>
                  <td class="text-right">
                    @if (a.creditAmount > 0) {
                      <span class="font-semibold text-success">{{ fmt(a.creditAmount) }}</span>
                    } @else {
                      <span class="text-ink-subtle">—</span>
                    }
                  </td>
                </tr>
              } @empty {
                @if (filters.q().value() || filters.overdue().value()) {
                  <tr
                    uiTableEmpty
                    [columns]="6"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ninguna cuenta coincide con los filtros."
                  ></tr>
                } @else {
                  <tr
                    uiTableEmpty
                    [columns]="6"
                    icon="wallet"
                    title="Aún no hay cuentas"
                    description="Cada estudiante del colegio tendrá su cuenta familiar."
                  ></tr>
                }
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
    <p class="text-sm text-ink-muted mt-4">
      Cada estudiante pertenece a una sola cuenta por colegio. Los hermanos con el mismo acudiente comparten cuenta.
    </p>
  `,
})
export default class AccountsPage {
  /** `?overdue=true` (the home "Cargos vencidos" tile) opens with that filter on. */
  readonly overdue = input<string>();

  private store = inject(Store);
  private refresh = inject(FinanceRefresh);

  private filterModel = signal({ q: '', overdue: false });
  protected readonly filters = form(this.filterModel, (p) => debounce(p.q, 300));
  protected readonly page = signal(1);
  protected readonly pageSize = signal(25);

  protected readonly accounts = httpResource<FinanceAccountList>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    this.refresh.version();
    return {
      url: '/api/v1/finance/accounts',
      params: {
        schoolId,
        page: this.page(),
        take: this.pageSize(),
        ...(this.filters.q().value().trim() ? { q: this.filters.q().value().trim() } : {}),
        ...(this.filters.overdue().value() ? { overdue: 'true' } : {}),
      },
    };
  });
  protected readonly list = listState(this.accounts);

  constructor() {
    effect(() => {
      if (this.overdue() === 'true') untracked(() => this.filters.overdue().value.set(true));
    });
    // A new search or filter starts again on the first page.
    effect(() => {
      this.filters.q().value();
      this.filters.overdue().value();
      untracked(() => this.page.set(1));
    });
  }

  protected readonly countLabel = computed(() => {
    const total = this.list.rows()?.total;
    return total == null ? '' : total === 1 ? '1 cuenta' : `${total} cuentas`;
  });

  protected fmt(amount: number) {
    return money(amount, this.accounts.value()?.currencyCode);
  }

  protected days(d: number | null) {
    return overdueLabel(d);
  }

  /** Past 60 days the overdue badge turns red. */
  protected overdueTone(a: FinanceAccountSummary) {
    return (a.overdueDays ?? 0) > 60 ? 'danger' : 'warning';
  }
}
