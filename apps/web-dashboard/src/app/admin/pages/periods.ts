import { Confirmation, Modal, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorDotsThreeOutlineDuotone,
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
  imports: [
    NgIcon,
    DatePipe,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
  ],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorDotsThreeOutlineDuotone,
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
            <th></th>
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
              <button
                class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                ngMenuTrigger
                #origin
                #trigger="ngMenuTrigger"
                [menu]="actionsMenu()"
              >
                <ng-icon
                  name="phosphorDotsThreeOutlineDuotone"
                  class="text-xl"
                />
              </button>
              <ng-template
                [cdkConnectedOverlayOpen]="trigger.expanded()"
                [cdkConnectedOverlay]="{origin, usePopover: 'inline'}"
                [cdkConnectedOverlayPositions]="[
                  {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top',
                    offsetY: 4
                  }
                ]"
                cdkAttachPopoverAsChild
              >
                <div
                  ngMenu
                  class="bg-base-100 shadow-sm rounded-lg p-1 w-48"
                  #actionsMenu="ngMenu"
                >
                  <ng-template ngMenuContent>
                    <button
                      ngMenuItem
                      value="edit"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="editPeriod(period)"
                    >
                      <ng-icon name="phosphorPencilDuotone" class="text-lg" />
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deletePeriod(period)"
                    >
                      <ng-icon name="phosphorTrashDuotone" class="text-lg" />
                      <span>Eliminar</span>
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
  `,
})
export default class Periods {
  private store = inject(Store);
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
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
