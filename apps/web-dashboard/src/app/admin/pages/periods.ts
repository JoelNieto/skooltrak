import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import PeriodsForm from '../forms/periods-form';
@Component({
  selector: 'app-periods',
  imports: [NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
    }),
  ],
  template: `
    <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editPeriod()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Agregar periodo
      </button>
    </div>
    <div
      class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha de inicio</th>
            <th>Fecha de fin</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (period of periods.value(); track period.id) {
          <tr>
            <td>{{ period.name }}</td>
            <td>{{ period.startDate | date : 'shortDate' }}</td>
            <td>{{ period.endDate | date : 'shortDate' }}</td>
            <td>{{ period.createdAt | date : 'short' }}</td>
            <td>{{ period.updatedAt | date : 'short' }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-primary btn-xs btn-soft"
                  (click)="editPeriod(period)"
                >
                  <ng-icon name="phosphorPencilDuotone" /> Editar
                </button>
                <button
                  class="btn btn-error btn-xs btn-soft"
                  (click)="deletePeriod(period)"
                >
                  <ng-icon name="phosphorTrashDuotone" /> Eliminar
                </button>
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export default class Periods {
  private store = inject(Store);
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);

  public periods = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          periodsBySchoolId: Prisma.PeriodGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query PeriodsBySchoolId($schoolId: String!) {
              periodsBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
                schoolId
                startDate
                endDate
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.periodsBySchoolId));
    },
  });

  editPeriod(period?: Prisma.PeriodGetPayload<{ include: undefined }>) {
    this.modal
      .open(PeriodsForm, {
        title: period ? 'Editar Periodo' : 'Agregar Periodo',
        data: {
          period,
        },
      })
      .closed.subscribe((res) => {
        if (res) {
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
          })
        )
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
