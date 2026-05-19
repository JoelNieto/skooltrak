import { Confirmation, Error, Modal, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { HttpClient } from '@angular/common/http';
import HabitMetricsForm from './habit-metrics-form';

@Component({
  selector: 'app-habit-metrics',
  imports: [RouterLink, DatePipe, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule, Error],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Hábitos y actitudes</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Criterios de hábitos y actitudes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Listado de criterios para evaluación de hábitos y actitudes
        </p>
      </div>

      <button class="btn btn-primary" (click)="editHabitMetric()">
        <span class="material-symbols-outlined">add_circle</span>
        Nueva métrica
      </button>
    </div>
    @if (metrics.error()) {
      <lib-error
        (retry)="metrics.reload()"
        [description]="metrics.error()?.message"
      />
    } @else {
    <div class="overflow-x-auto">
      <table class="table">
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
        <tbody>
          @if (metrics.isLoading()) {
            <tr>
              <td colspan="6" class="text-center">
                <span class="loading loading-spinner loading-md"></span>
              </td>
            </tr>
          }
          @for (metric of metrics.value(); track metric.id) {
            <tr>
              <td>{{ metric.name }}</td>
              <td class="max-w-64 truncate">{{ metric.description || '-' }}</td>
              <td>
                <span class="badge" [class.badge-success]="metric.active" [class.badge-error]="!metric.active">
                  {{ metric.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>{{ metric.order }}</td>
              <td>{{ metric.createdAt | date: 'short' }}</td>
              <td>
                <button
                  class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="optionsMenu()"
                >
                  <span class="material-symbols-outlined text-xl">more_horiz</span>
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
                  <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #optionsMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <button
                        ngMenuItem
                        value="Edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editHabitMetric($any(metric))"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteHabitMetric(metric.id!)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </ng-template>
                  </div></ng-template
                >
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    }
  `,
})
export default class HabitMetrics {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  private modal = inject(Modal);
  optionsMenu = viewChild<Menu<string>>('optionsMenu');

  public metrics = httpResource<Prisma.HabitMetricGetPayload<{ include: undefined }>[]>(
    () => '/api/v1/habit-metrics',
    { defaultValue: [] },
  );

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
}
