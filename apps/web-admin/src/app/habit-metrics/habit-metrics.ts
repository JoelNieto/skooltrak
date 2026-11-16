import {
  Badge,
  Breadcrumbs,
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
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Prisma } from '@generated/prisma';
import HabitMetricsForm from './habit-metrics-form';

@Component({
  selector: 'app-habit-metrics',
  imports: [
    Breadcrumbs,
    UiTable,
    Badge,
    Button,
    DatePipe,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Hábitos y actitudes' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Criterios de hábitos y actitudes</h1>
        <p class="text-sm text-ink-muted">Listado de criterios para evaluación de hábitos y actitudes</p>
      </div>

      <button uiButton variant="primary" (click)="editHabitMetric()">
        <ui-icon name="circle-plus" />
        Nueva métrica
      </button>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="metrics.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th class="w-96">Descripción</th>
            <th>Estado</th>
            <th>Orden</th>
            <th>Fecha de creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        @switch (metricsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="metrics.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (metric of metricsList.rows(); track metric.id) {
                <tr>
                  <td>{{ metric.name }}</td>
                  <td class="max-w-64 truncate">{{ metric.description || '-' }}</td>
                  <td>
                    <span uiBadge [tone]="metric.active ? 'success' : 'danger'">
                      {{ metric.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>{{ metric.order }}</td>
                  <td>{{ metric.createdAt | date: 'short' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + metric.name"
                      (action)="onRowAction($event, metric)"
                    />
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="6" icon="list-checks" title="Aún no hay criterios de hábitos"></tr>
              }
            </tbody>
          }
        }
      </table>
    </div>
  `,
})
export default class HabitMetrics {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  private modal = inject(Modal);

  public metrics = httpResource<Prisma.HabitMetricGetPayload<{ include: undefined }>[]>(() => '/api/v1/habit-metrics', {
    defaultValue: [],
  });
  /** metrics with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly metricsList = listState(this.metrics);

  editHabitMetric(metric?: Prisma.HabitMetricGetPayload<{ include: undefined }>) {
    this.modal
      .open(HabitMetricsForm, {
        title: metric ? 'Editar criterio de hábitos' : 'Nuevo criterio de hábitos',
        data: { metric },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.metrics.reload();
        }
      });
  }

  deleteHabitMetric(id: string) {
    this.confirmation
      .confirm({
        title: '¿Estás seguro?',
        message: 'Esta acción eliminará el criterio de hábitos. Las evaluaciones existentes no se eliminarán.',
      })
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.http.delete(`/api/v1/habit-metrics/${id}`).subscribe({
          next: () => {
            this.toasts.showSuccess('Criterio eliminado exitosamente');
            this.metrics.reload();
          },
          error: (error) => {
            this.toasts.showError('Error al eliminar el criterio');
            console.error(error);
          },
        });
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, metric: Prisma.HabitMetricGetPayload<{ include: undefined }>): void {
    switch (action) {
      case 'edit':
        this.editHabitMetric(metric);
        break;
      case 'delete':
        this.deleteHabitMetric(metric.id);
        break;
    }
  }
}
