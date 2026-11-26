import {
  Alert,
  Badge,
  Button,
  Confirmation,
  Icon,
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
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter, Observable, switchMap } from 'rxjs';
import Auth from '../../auth/auth';
import SchoolPeriodForm, { SchoolPeriodRow, SchoolPeriodsYear } from '../forms/school-period-form';

const nextDay = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * A school's periods for one school year. By default the school uses the platform's global periods;
 * a school on another calendar (e.g. American, August to June) switches to its own periods and then
 * adds, edits and deletes them freely. Editing needs MANAGE_PERIODS.
 */
@Component({
  selector: 'app-school-periods',
  imports: [
    Alert,
    Badge,
    Button,
    DatePipe,
    FormsModule,
    Icon,
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
          <h3 class="text-base/7 font-semibold">Periodos {{ yearLabel() }}</h3>
          <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">
            Los periodos en que se registran calificaciones y hábitos. Si tu colegio sigue otro calendario (por
            ejemplo, americano), usa periodos propios con sus propias fechas y nombres.
          </p>
        </div>
        <div class="flex items-end gap-2">
          <ui-field label="Año escolar" class="w-32">
            <select uiSelect [ngModel]="year()" (ngModelChange)="year.set(+$event)">
              @for (y of years(); track y) {
                <option [ngValue]="y">{{ y }}</option>
              }
            </select>
          </ui-field>
          @if (canManage()) {
            <button uiButton variant="primary" size="sm" type="button" [disabled]="!data()" (click)="add()">
              <ui-icon name="circle-plus" />
              Agregar periodo
            </button>
          }
        </div>
      </div>

      @if (data(); as d) {
        <div class="mt-4 px-4 sm:px-0">
          @if (d.custom) {
            <div uiAlert tone="info" class="flex flex-wrap items-center justify-between gap-2">
              <span>El colegio usa <strong>periodos propios</strong> en {{ d.year }}.</span>
              @if (canManage()) {
                <button uiButton variant="ghost" size="sm" type="button" (click)="restore()">
                  Volver a los periodos globales
                </button>
              }
            </div>
          } @else {
            <div uiAlert class="flex flex-wrap items-center justify-between gap-2">
              <span>El colegio usa los <strong>periodos globales</strong> de la plataforma en {{ d.year }}.</span>
              @if (canManage()) {
                <button uiButton variant="ghost" size="sm" type="button" (click)="customize()">
                  Usar periodos propios
                </button>
              }
            </div>
          }
        </div>
      }

      <div class="mt-4 overflow-x-auto">
        <table uiTable [attr.aria-busy]="resource.isLoading()">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Nombre corto</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Calificaciones y hábitos</th>
              @if (editable()) {
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
                <tr uiTableError [columns]="columns()" (retry)="resource.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (period of periods(); track period.id) {
                  <tr>
                    <td>{{ period.name }}</td>
                    <td>{{ period.shortName || '—' }}</td>
                    <td>{{ period.startDate | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                    <td>{{ period.endDate | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                    <td>
                      @if (period.usage) {
                        <span uiBadge size="sm">{{ period.usage }}</span>
                      } @else {
                        <span class="text-ink-subtle">—</span>
                      }
                    </td>
                    @if (editable()) {
                      <td>
                        <ui-row-actions
                          [actions]="period.usage ? usedActions : actions"
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
                    [title]="data()?.custom ? 'Aún no hay periodos propios' : 'La plataforma aún no tiene periodos para este año'"
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

  /** The school's current year by default. */
  protected readonly year = linkedSignal(() => this.currentYear() ?? new Date().getFullYear());
  /** The previous, current and next school years (plus the selected one). */
  protected readonly years = computed(() => {
    const base = this.currentYear() ?? new Date().getFullYear();
    return [...new Set([base - 1, base, base + 1, this.year()])].sort((a, b) => a - b);
  });

  protected readonly resource = httpResource<SchoolPeriodsYear>(() => ({
    url: `/api/v1/periods/schools/${this.schoolId()}`,
    params: { year: String(this.year()) },
  }));
  protected readonly list = listState(this.resource);
  protected readonly data = computed(() => this.list.rows() ?? null);
  protected readonly periods = computed(() => this.data()?.periods ?? []);

  /** Own periods are edited row by row; global ones are read-only here. */
  protected readonly editable = computed(() => this.canManage() && !!this.data()?.custom);
  protected readonly columns = computed(() => (this.editable() ? 6 : 5));

  /** "2026" or, when the periods cross into the next calendar year, "2026–2027". */
  protected readonly yearLabel = computed(() => {
    const periods = this.periods();
    if (!periods.length) return String(this.year());
    const first = Math.min(...periods.map((p) => +p.startDate.slice(0, 4)));
    const last = Math.max(...periods.map((p) => +p.endDate.slice(0, 4)));
    return first === last ? String(first) : `${first}–${last}`;
  });

  protected readonly actions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];
  /** A period with grades can't be deleted. */
  protected readonly usedActions: UiRowAction[] = [{ id: 'edit', label: 'Editar', icon: 'pencil' }];

  protected onRowAction(action: string, period: SchoolPeriodRow): void {
    if (action === 'edit') this.openForm(period);
    if (action === 'delete') this.remove(period);
  }

  protected add(): void {
    const periods = this.periods();
    const last = periods[periods.length - 1];
    this.openForm(undefined, last ? nextDay(last.endDate) : undefined);
  }

  private openForm(period?: SchoolPeriodRow, suggestedStart?: string): void {
    const d = this.data();
    if (!d) return;
    this.modal
      .open(SchoolPeriodForm, {
        title: period ? `Editar ${period.name}` : `Nuevo periodo ${d.year}`,
        data: { schoolId: this.schoolId(), year: d.year, custom: d.custom, period, suggestedStart },
      })
      .closed.subscribe((saved) => {
        if (saved) this.resource.reload();
      });
  }

  protected customize(): void {
    this.confirmAnd(
      'Usar periodos propios',
      `Se copiarán los periodos globales de ${this.year()} al colegio, con sus calificaciones y hábitos, ` +
        'para que puedas cambiarlos, agregar o eliminar periodos.',
      () => this.http.post(`/api/v1/periods/schools/${this.schoolId()}/customize`, { year: this.year() }),
      'El colegio ahora usa periodos propios',
    );
  }

  protected restore(): void {
    this.confirmAnd(
      'Volver a los periodos globales',
      `Se eliminarán los periodos propios de ${this.year()}. Si tienen calificaciones, pasarán al periodo global ` +
        'en la misma posición (solo posible si hay tantos periodos propios como globales).',
      () => this.http.post(`/api/v1/periods/schools/${this.schoolId()}/restore`, { year: this.year() }),
      'El colegio usa de nuevo los periodos globales',
    );
  }

  private remove(period: SchoolPeriodRow): void {
    this.confirmAnd(
      'Eliminar periodo',
      `¿Eliminar ${period.name}?`,
      () => this.http.delete(`/api/v1/periods/schools/${this.schoolId()}/${period.id}`),
      'Periodo eliminado',
    );
  }

  private confirmAnd(title: string, message: string, request: () => Observable<unknown>, done: string): void {
    this.confirmation
      .confirm({ title, message })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(request),
      )
      .subscribe({
        next: () => {
          this.resource.reload();
          this.toast.showSuccess(done);
        },
        error: (error) => {
          const msg = error instanceof HttpErrorResponse ? error.error?.message : null;
          this.toast.showError(typeof msg === 'string' ? msg : 'No se pudo completar la acción');
        },
      });
  }
}
