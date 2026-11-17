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
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Prisma } from '@generated/prisma';
import { filter, switchMap } from 'rxjs';
import PeriodsForm from './periods-form';

@Component({
  selector: 'app-periods',
  imports: [Breadcrumbs, UiTable, Button, DatePipe, Icon, UiRowActions, UiTableEmpty, UiTableError, UiTableSkeleton],
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
      <table uiTable [attr.aria-busy]="periods.isLoading()">
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
        @switch (periodsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="periods.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (period of periodsList.rows(); track period.id) {
                <tr>
                  <td>{{ period.name }}</td>
                  <td>{{ period.shortName }}</td>
                  <td>{{ period.year }}</td>
                  <td>{{ period.startDate | date: 'shortDate' }}</td>
                  <td>{{ period.endDate | date: 'shortDate' }}</td>
                  <td>{{ period.createdAt | date: 'short' }}</td>
                  <td class="flex gap-2">
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + period.name"
                      (action)="onRowAction($event, period)"
                    />
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="7" icon="calendar" title="Aún no hay periodos"></tr>
              }
            </tbody>
          }
        }
      </table>
    </div>
  `,
})
export default class Periods {
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  public periods = httpResource<Prisma.PeriodGetPayload<{ include: undefined }>[]>(() => '/api/v1/periods', {
    defaultValue: [],
  });
  /** periods with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly periodsList = listState(this.periods);

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

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, period: Prisma.PeriodGetPayload<{ include: undefined }>): void {
    switch (action) {
      case 'edit':
        this.editPeriod(period);
        break;
      case 'delete':
        this.deletePeriod(period);
        break;
    }
  }
}
