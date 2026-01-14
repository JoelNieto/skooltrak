import { Confirmation, Modal, PrismaDecimalPipe, Toast } from '@/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import GradeMetricsForm from './grade-metrics-form';
@Component({
  selector: 'app-grade-metrics',
  imports: [RouterLink, DecimalPipe, PrismaDecimalPipe, DatePipe],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Metricas de calificaciones</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">
          Metricas de calificaciones
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Listado de metricas de calificaciones
        </p>
      </div>

      <button class="btn btn-primary" (click)="editGradeMetric()">
        <span class="material-symbols-outlined">add_circle</span>
        NEW_METRIC_TEXT
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
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
            <td>{{ metric.minimum | decimal | number : '1.2-2' }}</td>
            <td>{{ metric.maximum | decimal | number : '1.2-2' }}</td>
            <td>{{ metric.minimumApproval | decimal | number : '1.2-2' }}</td>
            <td>{{ metric.minimumExcellence | decimal | number : '1.2-2' }}</td>
            <td>{{ metric.createdAt | date : 'short' }}</td>
            <td>{{ metric.updatedAt | date : 'short' }}</td>
            <td>
              <button
                class="btn btn-primary btn-xs"
                (click)="editGradeMetric(metric)"
              >
                Editar
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export default class GradeMetrics {
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);

  private modal = inject(Modal);

  public metrics = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          gradeMetrics: Prisma.GradeMetricGetPayload<{ include: undefined }>[];
        }>({
          query: gql`
            query GetGradeMetrics {
              gradeMetrics {
                id
                name
                minimum
                maximum
                minimumApproval
                minimumExcellence
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.gradeMetrics)),
  });

  editGradeMetric(
    metric?: Prisma.GradeMetricGetPayload<{ include: undefined }>
  ) {
    this.modal
      .open(GradeMetricsForm, {
        title: metric
          ? 'Editar Metrica de calificaciones'
          : 'Nueva Metrica de calificaciones',
        data: { metric },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.metrics.reload();
        }
      });
  }
}
