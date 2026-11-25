import {
  Badge,
  Confirmation,
  Modal,
  Toast,
  UiField,
  UiRowAction,
  UiRowActions,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import Auth from '../../auth/auth';
import SchoolPeriodForm, { SchoolPeriodRow } from '../forms/school-period-form';

/**
 * A school's periods for one year: the platform's global periods with this school's overrides of
 * name, short name and dates. School admins (MANAGE_PERIODS) can override or restore each one.
 */
@Component({
  selector: 'app-school-periods',
  imports: [
    Badge,
    DatePipe,
    FormsModule,
    UiField,
    UiRowActions,
    UiSelect,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  template: `
    <div class="bg-surface-1 border-line p-4 rounded-lg">
      <div class="flex flex-wrap items-end justify-between gap-4 px-4 sm:px-0">
        <div>
          <h3 class="text-base/7 font-semibold">Periodos</h3>
          <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">
            Los periodos los define la plataforma por año. Si tu colegio usa otras fechas o nombres, puedes
            ajustarlos aquí; las calificaciones se mantienen en el mismo periodo.
          </p>
        </div>
        <ui-field label="Año" class="w-32">
          <select uiSelect [ngModel]="year()" (ngModelChange)="year.set(+$event)">
            @for (y of years(); track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
        </ui-field>
      </div>
      <div class="mt-4 overflow-x-auto">
        <table uiTable [attr.aria-busy]="periods.isLoading()">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Nombre corto</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Origen</th>
              @if (canManage()) {
                <th><span class="sr-only">Acciones</span></th>
              }
            </tr>
          </thead>
          @switch (list.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="columns()"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="columns()" (retry)="periods.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (period of list.rows(); track period.id) {
                  <tr>
                    <td>
                      {{ period.name }}
                      @if (period.override?.name) {
                        <span class="block text-xs text-ink-subtle">Global: {{ period.defaults.name }}</span>
                      }
                    </td>
                    <td>{{ period.shortName }}</td>
                    <td>
                      {{ period.startDate | date: 'dd/MM/yyyy' : 'UTC' }}
                      @if (period.override?.startDate) {
                        <span class="block text-xs text-ink-subtle">
                          Global: {{ period.defaults.startDate | date: 'dd/MM/yyyy' : 'UTC' }}
                        </span>
                      }
                    </td>
                    <td>
                      {{ period.endDate | date: 'dd/MM/yyyy' : 'UTC' }}
                      @if (period.override?.endDate) {
                        <span class="block text-xs text-ink-subtle">
                          Global: {{ period.defaults.endDate | date: 'dd/MM/yyyy' : 'UTC' }}
                        </span>
                      }
                    </td>
                    <td>
                      @if (period.overridden) {
                        <span uiBadge tone="warning" size="sm">Personalizado</span>
                      } @else {
                        <span uiBadge size="sm">Global</span>
                      }
                    </td>
                    @if (canManage()) {
                      <td>
                        <ui-row-actions
                          [actions]="period.overridden ? overriddenActions : actions"
                          [label]="'Acciones para ' + period.name"
                          (action)="onRowAction($event, period)"
                        />
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr
                    uiTableEmpty
                    [columns]="columns()"
                    icon="calendar"
                    title="La plataforma aún no tiene periodos para este año"
                  ></tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    </div>
  `,
})
export class SchoolPeriods {
  public schoolId = input.required<string>();
  public currentYear = input<number | null | undefined>();

  private http = inject(HttpClient);
  private modal = inject(Modal);
  private toast = inject(Toast);
  private confirmation = inject(Confirmation);
  private auth = inject(Auth);

  protected readonly canManage = computed(() => this.auth.hasPermission('MANAGE_PERIODS'));
  protected readonly columns = computed(() => (this.canManage() ? 6 : 5));

  /** The school's current year by default. */
  protected readonly year = linkedSignal(() => this.currentYear() ?? new Date().getFullYear());
  /** The previous, current and next school years (plus the selected one). */
  protected readonly years = computed(() => {
    const base = this.currentYear() ?? new Date().getFullYear();
    return [...new Set([base - 1, base, base + 1, this.year()])].sort((a, b) => a - b);
  });

  protected readonly periods = httpResource<SchoolPeriodRow[]>(
    () => ({ url: `/api/v1/periods/schools/${this.schoolId()}`, params: { year: String(this.year()) } }),
    { defaultValue: [] },
  );
  protected readonly list = listState(this.periods);

  protected readonly actions: UiRowAction[] = [{ id: 'edit', label: 'Personalizar', icon: 'pencil' }];
  protected readonly overriddenActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar personalización', icon: 'pencil' },
    { id: 'restore', label: 'Restaurar valores globales', icon: 'undo-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, period: SchoolPeriodRow): void {
    if (action === 'edit') this.edit(period);
    if (action === 'restore') this.restore(period);
  }

  private edit(period: SchoolPeriodRow): void {
    this.modal
      .open(SchoolPeriodForm, {
        title: `Personalizar ${period.defaults.name}`,
        data: { schoolId: this.schoolId(), period },
      })
      .closed.subscribe((saved) => {
        if (saved) this.periods.reload();
      });
  }

  private restore(period: SchoolPeriodRow): void {
    this.confirmation
      .confirm({
        title: 'Restaurar periodo',
        message: `${period.name} volverá a usar el nombre y las fechas globales (${period.defaults.name}).`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.http.delete(`/api/v1/periods/schools/${this.schoolId()}/${period.id}`)),
      )
      .subscribe({
        next: () => {
          this.periods.reload();
          this.toast.showSuccess('Periodo restaurado');
        },
        error: () => this.toast.showError('No se pudo restaurar el periodo'),
      });
  }
}
