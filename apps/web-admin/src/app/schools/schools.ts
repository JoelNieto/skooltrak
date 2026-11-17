import {
  Breadcrumbs,
  Button,
  Confirmation,
  Icon,
  Modal,
  Pagination,
  Paginator,
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
import { Component, effect, inject } from '@angular/core';
import { Prisma } from '@generated/prisma';
import { toFetchQueryRecord, toPageQuery } from '../core/fetch-query-params';
import { SchoolsForm } from './schools-form';
@Component({
  selector: 'app-schools',
  imports: [
    Breadcrumbs,
    UiTable,
    Button,
    DatePipe,
    Paginator,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  providers: [Pagination],
  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Escuelas' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Escuelas</h1>
        <p class="text-sm text-ink-muted">Listado de escuelas</p>
      </div>

      <button uiButton variant="primary" (click)="editSchool()"><ui-icon name="circle-plus" /> Nueva Escuela</button>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="schools.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Organización</th>
            <th>Año actual</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (schoolsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pagination.take()" [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="schools.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (school of schoolsList.rows(); track school.id) {
                <tr>
                  <td>{{ school.name }}</td>
                  <td>{{ school.organization?.name }}</td>
                  <td>{{ school.currentYear }}</td>
                  <td>{{ school.createdAt | date: 'medium' }}</td>
                  <td>{{ school.updatedAt | date: 'medium' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + school.name"
                      (action)="onRowAction($event, school)"
                    />
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="6" icon="school" title="Aún no hay colegios"></tr>
              }
            </tbody>
          }
        }
      </table>
      <div class="p-2">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div> `,
})
export class Schools {
  private readonly modal = inject(Modal);
  public pagination = inject(Pagination);
  private readonly http = inject(HttpClient);
  private readonly toasts = inject(Toast);
  private readonly confirmation = inject(Confirmation);

  public schools = httpResource<Prisma.SchoolGetPayload<{ include: { organization: true } }>[]>(
    () => ({
      url: '/api/v1/schools',
      params: toFetchQueryRecord(toPageQuery(this.pagination)),
    }),
    { defaultValue: [] },
  );
  /** schools with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly schoolsList = listState(this.schools);

  private readonly schoolsCount = httpResource<number>(() => '/api/v1/schools/count');

  constructor() {
    effect(() => {
      const count = this.schoolsCount.value();
      if (count != null) {
        this.pagination.updateCount(count);
      }
    });
  }

  public editSchool(school?: Prisma.SchoolGetPayload<{ include: { organization: true } }>) {
    this.modal
      .open(SchoolsForm, {
        title: school ? 'Editar Escuela' : 'Nueva Escuela',
        showCloseButton: true,
        size: 'large',
        data: { school },
      })
      .closed.subscribe(() => {
        this.schools.reload();
      });
  }

  deleteSchool(school: Prisma.SchoolGetPayload<{ include: { organization: true } }>) {
    this.confirmation
      .confirm({
        title: 'Eliminar Escuela',
        message: '¿Estás seguro de eliminar esta escuela?',
      })
      .subscribe((result) => {
        if (result) {
          this.http.delete(`/api/v1/schools/${school.id}`).subscribe({
            next: () => {
              this.toasts.showInfo('Escuela eliminada exitosamente');
              this.schools.reload();
            },
            error: (error) => {
              console.error(error);
              this.toasts.showError('Error al eliminar la escuela');
            },
          });
        }
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, school: Prisma.SchoolGetPayload<{ include: { organization: true } }>): void {
    switch (action) {
      case 'edit':
        this.editSchool(school);
        break;
      case 'delete':
        this.deleteSchool(school);
        break;
    }
  }
}
