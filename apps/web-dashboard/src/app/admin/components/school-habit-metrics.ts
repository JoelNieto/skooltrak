import {
  Alert,
  Badge,
  Button,
  Confirmation,
  Icon,
  Modal,
  Toast,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { filter, Observable, switchMap } from 'rxjs';
import Auth from '../../auth/auth';
import SchoolHabitMetricForm, { SchoolHabitMetricRow, SchoolHabitMetricsResponse } from '../forms/school-habit-metric-form';

/**
 * A school's habits and aptitudes. By default it uses the platform's global ones; it can switch to its
 * own set and then add, edit, deactivate and delete them. Editing needs MANAGE_SCHOOLS.
 */
@Component({
  selector: 'app-school-habit-metrics',
  imports: [
    Alert,
    Badge,
    Button,
    Icon,
    UiRowActions,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  template: `
    <div class="bg-surface-1 border-line p-4 rounded-lg">
      <div class="flex flex-wrap items-end justify-between gap-4 px-4 sm:px-0">
        <div>
          <h3 class="text-base/7 font-semibold">Hábitos y actitudes</h3>
          <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">
            Los criterios que los docentes evalúan por grupo y periodo y que aparecen en el boletín. Si tu colegio usa
            otros, usa hábitos propios.
          </p>
        </div>
        @if (canManage()) {
          <button uiButton variant="primary" size="sm" type="button" [disabled]="!data()" (click)="openForm()">
            <ui-icon name="circle-plus" />
            Agregar hábito
          </button>
        }
      </div>

      @if (data(); as d) {
        <div class="mt-4 px-4 sm:px-0">
          <div uiAlert class="flex flex-wrap items-center justify-between gap-2">
            @if (d.custom) {
              <span>El colegio usa <strong>hábitos propios</strong>.</span>
              @if (canManage()) {
                <button uiButton variant="ghost" size="sm" type="button" (click)="restore()">
                  Volver a los hábitos globales
                </button>
              }
            } @else {
              <span>El colegio usa los <strong>hábitos globales</strong> de la plataforma.</span>
              @if (canManage()) {
                <button uiButton variant="ghost" size="sm" type="button" (click)="customize()">
                  Usar hábitos propios
                </button>
              }
            }
          </div>
        </div>
      }

      <div class="mt-4 overflow-x-auto">
        <table uiTable [attr.aria-busy]="resource.isLoading()">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Evaluaciones</th>
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
                @for (metric of metrics(); track metric.id) {
                  <tr>
                    <td>{{ metric.order }}</td>
                    <td>{{ metric.name }}</td>
                    <td class="text-ink-muted">{{ metric.description || '—' }}</td>
                    <td>
                      @if (metric.active) {
                        <span uiBadge tone="success" size="sm">Activo</span>
                      } @else {
                        <span uiBadge size="sm">Inactivo</span>
                      }
                    </td>
                    <td>
                      @if (metric.usage) {
                        <span uiBadge size="sm">{{ metric.usage }}</span>
                      } @else {
                        <span class="text-ink-subtle">—</span>
                      }
                    </td>
                    @if (editable()) {
                      <td>
                        <ui-row-actions
                          [actions]="metric.usage ? usedActions : actions"
                          [label]="'Acciones para ' + metric.name"
                          (action)="onRowAction($event, metric)"
                        />
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr uiTableEmpty [columns]="columns()" icon="list-checks" title="Aún no hay hábitos"></tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    </div>
  `,
})
export class SchoolHabitMetrics {
  public schoolId = input.required<string>();

  private http = inject(HttpClient);
  private modal = inject(Modal);
  private toast = inject(Toast);
  private confirmation = inject(Confirmation);
  private auth = inject(Auth);

  protected readonly canManage = computed(() => this.auth.hasPermission('MANAGE_SCHOOLS'));

  protected readonly resource = httpResource<SchoolHabitMetricsResponse>(
    () => `/api/v1/habit-metrics/schools/${this.schoolId()}`,
  );
  protected readonly list = listState(this.resource);
  protected readonly data = computed(() => this.list.rows() ?? null);
  protected readonly metrics = computed(() => this.data()?.metrics ?? []);

  /** Own metrics are edited row by row; global ones are read-only here. */
  protected readonly editable = computed(() => this.canManage() && !!this.data()?.custom);
  protected readonly columns = computed(() => (this.editable() ? 6 : 5));

  protected readonly actions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];
  /** A metric with evaluations can only be edited (or deactivated). */
  protected readonly usedActions: UiRowAction[] = [{ id: 'edit', label: 'Editar', icon: 'pencil' }];

  protected onRowAction(action: string, metric: SchoolHabitMetricRow): void {
    if (action === 'edit') this.openForm(metric);
    if (action === 'delete') this.remove(metric);
  }

  protected openForm(metric?: SchoolHabitMetricRow): void {
    const d = this.data();
    if (!d) return;
    const nextOrder = Math.max(-1, ...d.metrics.map((m) => m.order)) + 1;
    this.modal
      .open(SchoolHabitMetricForm, {
        title: metric ? `Editar ${metric.name}` : 'Nuevo hábito',
        data: { schoolId: this.schoolId(), custom: d.custom, metric, nextOrder },
      })
      .closed.subscribe((saved) => {
        if (saved) this.resource.reload();
      });
  }

  protected customize(): void {
    this.confirmAnd(
      'Usar hábitos propios',
      'Se copiarán los hábitos globales al colegio, con sus evaluaciones, para que puedas cambiarlos, agregar o ' +
        'eliminar hábitos.',
      () => this.http.post(`/api/v1/habit-metrics/schools/${this.schoolId()}/customize`, {}),
      'El colegio ahora usa hábitos propios',
    );
  }

  protected restore(): void {
    this.confirmAnd(
      'Volver a los hábitos globales',
      'Se eliminarán los hábitos propios. Sus evaluaciones pasarán al hábito global con el mismo nombre (solo ' +
        'posible si todos los hábitos evaluados tienen uno).',
      () => this.http.post(`/api/v1/habit-metrics/schools/${this.schoolId()}/restore`, {}),
      'El colegio usa de nuevo los hábitos globales',
    );
  }

  private remove(metric: SchoolHabitMetricRow): void {
    this.confirmAnd(
      'Eliminar hábito',
      `¿Eliminar ${metric.name}?`,
      () => this.http.delete(`/api/v1/habit-metrics/schools/${this.schoolId()}/${metric.id}`),
      'Hábito eliminado',
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
