import {
  Badge,
  Button,
  Card,
  Confirmation,
  Icon,
  Modal,
  Toast,
  UiRowActions,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import Store from '../../core/store';
import { apiError, FEE_KIND_LABEL, FeeAssignment, FeeItem, FeeItemList, FeeTargets, money, yearOptions } from '../finance.types';
import FeeAssignmentForm from './fee-assignment-form';
import FeeItemForm from './fee-item-form';
import { FinanceRefresh } from './finance-shell';

/**
 * Finanzas › Catálogo (FR-FIN-001.4, .5): the school's fee items, and which degree or study plan
 * each applies to in a year. "Generar cargos" turns the year's assignments into charges (FR .6).
 */
@Component({
  selector: 'app-finance-catalog',
  imports: [
    Badge,
    Button,
    Card,
    FormsModule,
    Icon,
    RouterLink,
    UiRowActions,
    UiSelect,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  template: `
    <section class="flex flex-col gap-3" aria-labelledby="fee-items-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fee-items-title" class="type-heading-md text-ink-strong">Conceptos de cobro</h2>
          <p class="text-sm text-ink-muted">Matrícula, mensualidad y otros cobros del colegio.</p>
        </div>
        <button uiButton variant="secondary" size="sm" (click)="editItem()">
          <ui-icon name="plus" /> Nuevo concepto
        </button>
      </div>
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="items.isLoading()">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Tipo</th>
              <th>Calendario</th>
              <th class="text-right">Monto</th>
              <th><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @switch (itemList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [rows]="3" [columns]="5"></tbody>
            }
            @case ('error') {
              <tbody><tr uiTableError [columns]="5" (retry)="items.reload()"></tr></tbody>
            }
            @case ('ready') {
              <tbody>
                @for (i of itemList.rows()?.items; track i.id) {
                  <tr data-testid="fee-item-row" [class.opacity-60]="!i.active">
                    <td class="font-semibold text-ink-strong">
                      {{ i.name }}
                      @if (!i.active) {
                        <span uiBadge size="sm" tone="neutral" class="ml-2">Inactivo</span>
                      }
                    </td>
                    <td>{{ kindLabel[i.kind] }}</td>
                    <td>{{ i.scheduleLabel }}</td>
                    <td class="text-right font-semibold">{{ fmt(i.amount) }}</td>
                    <td class="text-right">
                      <ui-row-actions [actions]="itemActions" [label]="'Acciones para ' + i.name" (action)="editItem(i)" />
                    </td>
                  </tr>
                } @empty {
                  <tr
                    uiTableEmpty
                    [columns]="5"
                    icon="wallet"
                    title="Aún no hay conceptos"
                    description="Crea la matrícula, la mensualidad y los demás cobros del colegio."
                  ></tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    </section>

    <section class="flex flex-col gap-3 mt-8" aria-labelledby="fee-assignments-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fee-assignments-title" class="type-heading-md text-ink-strong">Asignaciones</h2>
          <p class="text-sm text-ink-muted">
            Lo que se cobra en cada nivel y plan de estudio. El plan reemplaza el monto del nivel para el mismo concepto.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm text-ink-muted">
            Año
            <select uiSelect class="w-28" aria-label="Año escolar" [ngModel]="year()" (ngModelChange)="year.set(+$event)">
              @for (y of years(); track y) {
                <option [ngValue]="y">{{ y }}</option>
              }
            </select>
          </label>
          <button uiButton variant="secondary" size="sm" [disabled]="!targets.hasValue()" (click)="assign()">
            <ui-icon name="plus" /> Asignar
          </button>
          <a uiButton variant="primary" size="sm" routerLink="/financial-module/charges/generate" [queryParams]="{ year: year() }">
            Generar cargos
          </a>
        </div>
      </div>
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="assignments.isLoading()">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Aplica a</th>
              <th class="text-right">Monto</th>
              <th><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @switch (assignmentList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [rows]="3" [columns]="4"></tbody>
            }
            @case ('error') {
              <tbody><tr uiTableError [columns]="4" (retry)="assignments.reload()"></tr></tbody>
            }
            @case ('ready') {
              <tbody>
                @for (a of assignmentList.rows(); track a.id) {
                  <tr data-testid="fee-assignment-row">
                    <td class="font-semibold text-ink-strong">{{ a.feeItem.name }}</td>
                    <td>{{ targetLabel(a) }}</td>
                    <td class="text-right">
                      <span class="font-semibold">{{ fmt(a.amount) }}</span>
                      @if (a.amountOverride !== null) {
                        <div class="text-xs text-ink-subtle">monto propio</div>
                      }
                    </td>
                    <td class="text-right">
                      <ui-row-actions
                        [actions]="assignmentActions"
                        [label]="'Acciones para ' + a.feeItem.name + ' en ' + targetLabel(a)"
                        (action)="unassign(a)"
                      />
                    </td>
                  </tr>
                } @empty {
                  <tr
                    uiTableEmpty
                    [columns]="4"
                    icon="layers"
                    [title]="'Sin asignaciones en ' + year()"
                    description="Asigna los conceptos a un nivel o a un plan de estudio."
                  ></tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    </section>
  `,
})
export default class CatalogPage {
  private store = inject(Store);
  private http = inject(HttpClient);
  private modal = inject(Modal);
  private toast = inject(Toast);
  private confirmation = inject(Confirmation);
  private refresh = inject(FinanceRefresh);

  protected readonly kindLabel = FEE_KIND_LABEL;
  protected readonly itemActions = [{ id: 'edit', label: 'Editar', icon: 'pencil' as const }];
  protected readonly assignmentActions = [{ id: 'delete', label: 'Quitar asignación', icon: 'circle-minus' as const, tone: 'danger' as const }];
  protected readonly year = signal<number | null>(null);

  protected readonly items = httpResource<FeeItemList>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    this.refresh.version();
    return { url: '/api/v1/finance/fee-items', params: { schoolId } };
  });
  protected readonly itemList = listState(this.items);

  protected readonly targets = httpResource<FeeTargets>(() => {
    const schoolId = this.store.currentSchoolId();
    return schoolId ? { url: '/api/v1/finance/fee-targets', params: { schoolId } } : undefined;
  });

  protected readonly assignments = httpResource<FeeAssignment[]>(() => {
    const schoolId = this.store.currentSchoolId();
    const year = this.year();
    if (!schoolId || year == null) return undefined;
    this.refresh.version();
    return { url: '/api/v1/finance/fee-assignments', params: { schoolId, year } };
  });
  protected readonly assignmentList = listState(this.assignments);

  protected readonly years = computed(() => yearOptions(this.targets.value()?.currentYear ?? new Date().getFullYear()));

  constructor() {
    // Start on the school's current year.
    effect(() => {
      const current = this.targets.value()?.currentYear;
      if (current != null) untracked(() => this.year() == null && this.year.set(current));
    });
  }

  protected fmt(amount: number) {
    return money(amount, this.items.value()?.currencyCode);
  }

  protected targetLabel(a: FeeAssignment): string {
    return a.degree ? `Nivel ${a.degree.name}` : (a.studyPlan?.name ?? '');
  }

  protected editItem(item?: FeeItem) {
    this.modal
      .open(FeeItemForm, { title: item ? 'Editar concepto' : 'Nuevo concepto', size: 'medium', data: { item } })
      .closed.subscribe(() => this.refresh.bump());
  }

  protected assign() {
    const targets = this.targets.value();
    const year = this.year();
    if (!targets || year == null) return;
    this.modal
      .open(FeeAssignmentForm, { title: 'Asignar concepto', size: 'medium', data: { year, items: this.items.value()?.items ?? [], targets } })
      .closed.subscribe(() => this.refresh.bump());
  }

  protected unassign(a: FeeAssignment) {
    this.confirmation
      .confirm({
        title: 'Quitar asignación',
        message: `${a.feeItem.name} dejará de aplicarse a ${this.targetLabel(a)} en ${a.year}. Los cargos ya generados no cambian.`,
        confirmText: 'Quitar',
        severity: 'warning',
      })
      .pipe(filter(Boolean))
      .subscribe(async () => {
        try {
          await firstValueFrom(this.http.delete(`/api/v1/finance/fee-assignments/${a.id}`));
          this.toast.showSuccess('Asignación quitada');
          this.refresh.bump();
        } catch (err) {
          this.toast.showError(apiError(err, 'No se pudo quitar la asignación'));
        }
      });
  }
}
