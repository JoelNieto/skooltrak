import {
  Breadcrumbs,
  Button,
  Confirmation,
  Icon,
  Modal,
  Pagination,
  Paginator,
  Toast,
  UiInput,
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
import { afterRenderEffect, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { PermissionsForm } from './permissions-form';
@Component({
  selector: 'app-permissions',
  imports: [
    Breadcrumbs,
    UiTable,
    UiInput,
    Button,
    DatePipe,
    Paginator,
    FormsModule,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  providers: [Pagination],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Permisos' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Permisos</h1>
        <p class="text-sm text-ink-muted">Listado de permisos</p>
      </div>

      <button uiButton variant="primary" (click)="editPermission()">
        <ui-icon name="circle-plus" /> Nuevo Permiso
      </button>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div class="md:w-96 w-full">
        <input uiInput type="text" placeholder="Buscar" [(ngModel)]="searchText" />
      </div>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="permissions.isLoading()">
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (permissionsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pagination.take()" [columns]="5"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="5" (retry)="permissions.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (permission of permissionsList.rows(); track permission.id) {
                <tr>
                  <td>{{ permission.descriptiveId }}</td>
                  <td>{{ permission.description }}</td>
                  <td>{{ permission.createdAt | date: 'medium' }}</td>
                  <td>{{ permission.updatedAt | date: 'medium' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + permission.descriptiveId"
                      (action)="onRowAction($event, permission)"
                    />
                  </td>
                </tr>
              } @empty {
                @if (searchText()) {
                  <tr
                    uiTableEmpty
                    [columns]="5"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún resultado coincide con la búsqueda."
                  ></tr>
                } @else {
                  <tr uiTableEmpty [columns]="5" icon="key-round" title="Aún no hay permisos"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
    </div>
    <div class="px-4">
      <lib-paginator
        [count]="pagination.count()"
        [take]="pagination.take()"
        [skip]="pagination.skip()"
        (skipChange)="pagination.updateSkip($event)"
        (takeChange)="pagination.updateTake($event)"
      />
    </div>
  `,
})
export class Permissions {
  private modal = inject(Modal);
  public pagination = inject(Pagination);
  searchText = signal('');
  private http = inject(HttpClient);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public permissions = httpResource<Prisma.PermissionGetPayload<false>[]>(
    () => ({
      url: '/api/v1/permissions',
      params: toFetchQueryRecord({
        take: this.pagination.take(),
        skip: this.pagination.skip(),
        search: this.pagination.search(),
      }),
    }),
    { defaultValue: [] },
  );
  /** permissions with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly permissionsList = listState(this.permissions);

  private readonly permissionsCount = httpResource<number>(() => ({
    url: '/api/v1/permissions/count',
    params: toFetchQueryRecord({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
    }),
  }));

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
    effect(() => {
      const count = this.permissionsCount.value();
      if (count != null) {
        this.pagination.updateCount(count);
      }
    });
  }

  public editPermission(permission?: Prisma.PermissionGetPayload<false>) {
    this.modal
      .open(PermissionsForm, {
        title: permission ? 'Editar Permiso' : 'Nuevo Permiso',
        showCloseButton: true,
        data: { permission },
      })
      .closed.subscribe(() => {
        this.permissions.reload();
      });
  }

  public deletePermission(permission: Prisma.PermissionGetPayload<false>) {
    this.confirmation
      .confirm({
        title: 'Eliminar Permiso',
        message: '¿Estás seguro de eliminar este permiso?',
      })
      .subscribe((result) => {
        if (result) {
          this.http.delete(`/api/v1/permissions/${permission.id}`).subscribe({
            next: () => {
              this.toast.showInfo('Permiso eliminado exitosamente');
              this.permissions.reload();
            },
            error: (error) => {
              console.error(error);
              this.toast.showError('Error al eliminar el permiso');
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

  protected onRowAction(action: string, permission: Prisma.PermissionGetPayload<false>): void {
    switch (action) {
      case 'edit':
        this.editPermission(permission);
        break;
      case 'delete':
        this.deletePermission(permission);
        break;
    }
  }
}
