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
import { RolesForm } from './roles-form';

@Component({
  selector: 'app-roles',
  imports: [Breadcrumbs, UiTable, Button, DatePipe, Icon, UiRowActions, UiTableEmpty, UiTableError, UiTableSkeleton],
  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Roles' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Roles</h1>
        <p class="text-sm text-ink-muted">Listado de roles</p>
      </div>

      <button uiButton variant="primary" (click)="editRole()"><ui-icon name="circle-plus" /> Nuevo Rol</button>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="roles.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Nombre</th>
            <th>Organización</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (rolesList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="roles.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (role of rolesList.rows(); track role.id) {
                <tr>
                  <td>{{ role.name }}</td>
                  <td>{{ role.description }}</td>
                  <td>{{ role.name }}</td>
                  <td>{{ role.organization?.name }}</td>
                  <td>{{ role.createdAt | date: 'medium' }}</td>
                  <td>{{ role.updatedAt | date: 'medium' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + role.name"
                      (action)="onRowAction($event, role)"
                    />
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="7" icon="shield-user" title="Aún no hay roles"></tr>
              }
            </tbody>
          }
        }
      </table>
    </div>`,
})
export class Roles {
  private modal = inject(Modal);
  private http = inject(HttpClient);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public roles = httpResource<Prisma.RoleGetPayload<{ include: { organization: true; permissions: true } }>[]>(
    () => '/api/v1/roles',
    { defaultValue: [] },
  );
  /** roles with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly rolesList = listState(this.roles);

  public editRole(role?: Prisma.RoleGetPayload<false>) {
    this.modal
      .open(RolesForm, {
        title: role ? 'Editar Rol' : 'Nuevo Rol',
        showCloseButton: true,
        data: { role },
      })
      .closed.subscribe(() => {
        this.roles.reload();
      });
  }

  deleteRole(role: Prisma.RoleGetPayload<false>) {
    this.confirmation
      .confirm({
        title: 'Eliminar Rol',
        message: '¿Estás seguro de eliminar este rol?',
      })
      .subscribe((result) => {
        if (result) {
          this.http.delete(`/api/v1/roles/${role.id}`).subscribe({
            next: () => {
              this.toast.showInfo('Rol eliminado exitosamente');
              this.roles.reload();
            },
            error: (error) => {
              console.error(error);
              this.toast.showError('Error al eliminar el rol');
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

  protected onRowAction(action: string, role: Prisma.RoleGetPayload<false>): void {
    switch (action) {
      case 'edit':
        this.editRole(role);
        break;
      case 'delete':
        this.deleteRole(role);
        break;
    }
  }
}
