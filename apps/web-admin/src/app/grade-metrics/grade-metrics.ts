import {
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
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Prisma } from '@generated/prisma';
import GradeMetricsForm from './grade-metrics-form';
@Component({
  selector: 'app-grade-metrics',
  imports: [
    Breadcrumbs,
    UiTable,
    Button,
    DecimalPipe,
    DatePipe,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Metricas de calificaciones' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Metricas de calificaciones</h1>
        <p class="text-sm text-ink-muted">Listado de metricas de calificaciones</p>
      </div>

      <button uiButton variant="primary" (click)="editGradeMetric()">
        <ui-icon name="circle-plus" />
        Nueva métrica
      </button>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="metrics.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Minimo</th>
            <th>Maximo</th>
            <th>Minimo de aprobacion</th>
            <th>Minimo de excelencia</th>
            <th>Fecha de creacion</th>
            <th>Acciones</th>
          </tr>
        </thead>
        @switch (metricsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="metrics.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (metric of metricsList.rows()!; track metric.id) {
                <tr>
                  <td>{{ metric.name }}</td>
                  <td>{{ $any(metric).minimum | number: '1.2-2' }}</td>
                  <td>{{ $any(metric).maximum | number: '1.2-2' }}</td>
                  <td>{{ $any(metric).minimumApproval | number: '1.2-2' }}</td>
                  <td>{{ $any(metric).minimumExcellence | number: '1.2-2' }}</td>
                  <td>{{ metric.createdAt | date: 'short' }}</td>
                  <td>{{ metric.updatedAt | date: 'short' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + metric.name"
                      (action)="onRowAction($event, metric)"
                    />
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="7" icon="chart-column" title="Aún no hay escalas de calificación"></tr>
              }
            </tbody>
          }
        }
      </table>
    </div>
  `,
})
export default class GradeMetrics {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);

  private modal = inject(Modal);

  public metrics = httpResource<Prisma.GradeMetricGetPayload<{ include: undefined }>[]>(() => '/api/v1/grade-metrics', {
    defaultValue: [],
  });
  /** metrics with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly metricsList = listState(this.metrics);

  editGradeMetric(metric?: Prisma.GradeMetricGetPayload<{ include: undefined }>) {
    this.modal
      .open(GradeMetricsForm, {
        title: metric ? 'Editar Metrica de calificaciones' : 'Nueva Metrica de calificaciones',
        data: { metric },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.metrics.reload();
        }
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [{ id: 'edit', label: 'Editar', icon: 'pencil' }];

  protected onRowAction(action: string, metric: Prisma.GradeMetricGetPayload<{ include: undefined }>): void {
    switch (action) {
      case 'edit':
        this.editGradeMetric(metric);
        break;
    }
  }
}
