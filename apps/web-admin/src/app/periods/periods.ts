import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap } from 'rxjs';
import PeriodsForm from './periods-form';

@Component({
  selector: 'app-periods',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Periodos</li>
      </ul>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-base-content font-medium">Periodos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Listado de periodos globales</p>
      </div>
      <button class="btn btn-primary" (click)="editPeriod()">
        <span class="material-symbols-outlined">add_circle</span>
        Nuevo periodo
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Año</th>
            <th>Fecha de inicio</th>
            <th>Fecha de fin</th>
            <th>Fecha de creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (period of periods.value(); track period.id) {
            <tr>
              <td>{{ period.name }}</td>
              <td>{{ period.year }}</td>
              <td>{{ period.startDate | date: 'shortDate' }}</td>
              <td>{{ period.endDate | date: 'shortDate' }}</td>
              <td>{{ period.createdAt | date: 'short' }}</td>
              <td class="flex gap-2">
                <button class="btn btn-primary btn-xs" (click)="editPeriod(period)">Editar</button>
                <button class="btn btn-error btn-xs" (click)="deletePeriod(period)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export default class Periods {
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);

  public periods = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          periods: Prisma.PeriodGetPayload<{ include: undefined }>[];
        }>({
          query: gql`
            query GetPeriods {
              periods {
                id
                name
                year
                startDate
                endDate
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.periods)),
  });

  editPeriod(period?: Prisma.PeriodGetPayload<{ include: undefined }>) {
    this.modal
      .open(PeriodsForm, {
        title: period ? 'Editar Periodo' : 'Nuevo Periodo',
        data: { period },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.periods.reload();
        }
      });
  }

  deletePeriod(period: Prisma.PeriodGetPayload<{ include: undefined }>) {
    this.confirmation
      .confirm({
        title: 'Eliminar Periodo',
        message: `¿Estás seguro de eliminar el periodo ${period.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() =>
          this.apollo.mutate({
            mutation: gql`
              mutation RemovePeriod($removePeriodId: String!) {
                removePeriod(id: $removePeriodId) {
                  id
                }
              }
            `,
            variables: {
              removePeriodId: period.id,
            },
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.periods.reload();
          this.toast.showSuccess('Periodo eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar el periodo');
        },
      });
  }
}
