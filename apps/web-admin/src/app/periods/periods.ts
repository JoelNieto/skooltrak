import { Breadcrumbs, Button, Confirmation, Icon, Modal, Toast, UiTable } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, viewChild } from '@angular/core';
import { Prisma } from '@generated/prisma';
import { filter, switchMap } from 'rxjs';
import PeriodsForm from './periods-form';

@Component({
  selector: 'app-periods',
  imports: [Breadcrumbs, UiTable, Button, DatePipe, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule, Icon],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Periodos' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Periodos</h1>
        <p class="text-sm text-ink-muted">Listado de periodos globales</p>
      </div>
      <button uiButton variant="primary" (click)="editPeriod()">
        <ui-icon name="circle-plus" />
        Nuevo periodo
      </button>
    </div>
    <div class="overflow-x-auto">
      <table uiTable>
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
                        (click)="editPeriod($any(period))"
                      >
                        <ui-icon name="pencil" class="text-lg" />
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                        (click)="deletePeriod($any(period))"
                      >
                        <ui-icon name="trash-2" class="text-lg" />
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
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  optionsMenu = viewChild<Menu<string>>('optionsMenu');
  public periods = httpResource<Prisma.PeriodGetPayload<{ include: undefined }>[]>(() => '/api/v1/periods', {
    defaultValue: [],
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
        switchMap(() => this.http.delete(`/api/v1/periods/${period.id}`)),
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
