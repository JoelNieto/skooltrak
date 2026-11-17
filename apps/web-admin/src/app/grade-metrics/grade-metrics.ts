import { Breadcrumbs, Button, Confirmation, Error, Icon, Modal, Toast, UiTable } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, viewChild } from '@angular/core';
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
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    Error,
    Icon,
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
    @if (metrics.error()) {
      <lib-error (retry)="metrics.reload()" [description]="$safeNavigationMigration(metrics.error()?.message)" />
    } @else {
      <div class="overflow-x-auto">
        <table uiTable>
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
          <tbody>
            @for (metric of metrics.value()!; track metric.id) {
              <tr>
                <td>{{ metric.name }}</td>
                <td>{{ $any(metric).minimum | number: '1.2-2' }}</td>
                <td>{{ $any(metric).maximum | number: '1.2-2' }}</td>
                <td>{{ $any(metric).minimumApproval | number: '1.2-2' }}</td>
                <td>{{ $any(metric).minimumExcellence | number: '1.2-2' }}</td>
                <td>{{ metric.createdAt | date: 'short' }}</td>
                <td>{{ metric.updatedAt | date: 'short' }}</td>
                <td>
                  <button
                    class="cursor-pointer hover:bg-surface-2 p-1 rounded-lg flex items-center justify-center"
                    ngMenuTrigger
                    #origin
                    #trigger="ngMenuTrigger"
                    [menu]="optionsMenu()"
                  >
                    <ui-icon name="ellipsis" class="text-xl" />
                  </button>
                  <ng-template
                    [cdkConnectedOverlayOpen]="trigger.expanded()"
                    [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
                    [cdkConnectedOverlayPositions]="[
                      {
                        originX: 'end',
                        originY: 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                        offsetY: 4,
                      },
                    ]"
                    cdkAttachPopoverAsChild
                  >
                    <div ngMenu class="bg-surface-1 shadow-sm rounded-lg p-1 w-48" #optionsMenu="ngMenu">
                      <ng-template ngMenuContent>
                        <button
                          ngMenuItem
                          value="Edit"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="editGradeMetric($any(metric))"
                        >
                          <ui-icon name="pencil" class="text-lg" />
                          <span>Editar</span>
                        </button>
                      </ng-template>
                    </div>
                  </ng-template>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export default class GradeMetrics {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  optionsMenu = viewChild<Menu<string>>('optionsMenu');

  private modal = inject(Modal);

  public metrics = httpResource<Prisma.GradeMetricGetPayload<{ include: undefined }>[]>(() => '/api/v1/grade-metrics', {
    defaultValue: [],
  });

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
}
