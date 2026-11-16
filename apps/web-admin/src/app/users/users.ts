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
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { UsersForm } from './users-form';
@Component({
  selector: 'app-users',
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
  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Usuarios' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Usuarios</h1>
        <p class="text-sm text-ink-muted">Listado de usuarios</p>
      </div>

      <button uiButton variant="primary" (click)="editUser()"><ui-icon name="circle-plus" /> Nuevo Usuario</button>
    </div>
    <div class="flex justify-between items-center mb-4">
      <div class="md:w-96 w-full">
        <input uiInput type="text" placeholder="Buscar" [(ngModel)]="searchText" />
      </div>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="users.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Organización</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @if (users.isLoading() && !users.hasValue()) {
          <tbody uiTableSkeleton [columns]="7"></tbody>
        } @else if (users.error()) {
          <tbody>
            <tr uiTableError [columns]="7" (retry)="users.reload()"></tr>
          </tbody>
        } @else {
          <tbody>
            @for (user of users.value(); track user.id) {
              <tr>
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role?.name ?? 'Sin rol' }}</td>
                <td>{{ user.organization?.name ?? 'Sin organización' }}</td>
                <td>{{ user.createdAt | date: 'medium' }}</td>
                <td>{{ user.updatedAt | date: 'medium' }}</td>
                <td>
                  <ui-row-actions
                    [actions]="rowActions"
                    [label]="'Acciones para ' + user.firstName"
                    (action)="onRowAction($event, user)"
                  />
                </td>
              </tr>
            } @empty {
              @if (searchText()) {
                <tr
                  uiTableEmpty
                  [columns]="7"
                  icon="search-x"
                  title="Sin resultados"
                  description="Ningún resultado coincide con la búsqueda."
                ></tr>
              } @else {
                <tr uiTableEmpty [columns]="7" icon="users" title="Aún no hay usuarios"></tr>
              }
            }
          </tbody>
        }
      </table>
      <lib-paginator
        [count]="pagination.count()"
        [take]="pagination.take()"
        [skip]="pagination.skip()"
        (skipChange)="pagination.updateSkip($event)"
        (takeChange)="pagination.updateTake($event)"
      />
    </div> `,
})
export class Users {
  public pagination = inject(Pagination);
  private modal = inject(Modal);
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private confirmation = inject(Confirmation);
  public searchText = signal('');
  public users = httpResource<Prisma.UserGetPayload<{ include: { organization: true; role: true } }>[]>(
    () => ({
      url: '/api/v1/users',
      params: toFetchQueryRecord({
        take: this.pagination.take(),
        skip: this.pagination.skip(),
        search: this.pagination.search(),
      }),
    }),
    { defaultValue: [] },
  );

  private readonly usersCount = httpResource<number>(() => ({
    url: '/api/v1/users/count',
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
      const count = this.usersCount.value();
      if (count != null) {
        this.pagination.updateCount(count);
      }
    });
  }

  public editUser(
    user?: Prisma.UserGetPayload<{
      include: { organization: true; role: true };
    }>,
  ) {
    this.modal.open(UsersForm, {
      title: user ? 'Editar Usuario' : 'Nuevo Usuario',
      showCloseButton: true,
      size: 'large',
      data: { user },
    });
  }

  public deleteUser(
    user: Prisma.UserGetPayload<{
      include: { organization: true; role: true };
    }>,
  ) {
    this.confirmation
      .confirm({
        title: 'Eliminar Usuario',
        message: '¿Estás seguro de eliminar este usuario?',
      })
      .subscribe((result) => {
        if (result) {
          this.http.delete(`/api/v1/users/${user.id}`).subscribe({
            next: () => {
              this.toasts.showInfo('Usuario eliminado exitosamente');
              this.users.reload();
            },
            error: (error) => {
              console.error(error);
              this.toasts.showError('Error al eliminar el usuario');
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

  protected onRowAction(
    action: string,
    user: Prisma.UserGetPayload<{
      include: { organization: true; role: true };
    }>,
  ): void {
    switch (action) {
      case 'edit':
        this.editUser(user);
        break;
      case 'delete':
        this.deleteUser(user);
        break;
    }
  }
}
