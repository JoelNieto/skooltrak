import { Confirmation, Modal, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap } from 'rxjs';
import PeriodsForm from './periods-form';

@Component({
  selector: 'app-periods',
  imports: [RouterLink, DatePipe, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
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
            <th>Nombre corto</th>
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
              <td>{{ period.shortName }}</td>
              <td>{{ period.year }}</td>
              <td>{{ period.startDate | date: 'shortDate' }}</td>
              <td>{{ period.endDate | date: 'shortDate' }}</td>
              <td>{{ period.createdAt | date: 'short' }}</td>
              <td class="flex gap-2">
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
                        (click)="editPeriod(period)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deletePeriod(period)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
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
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  optionsMenu = viewChild<Menu<string>>('optionsMenu');
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
                shortName
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
