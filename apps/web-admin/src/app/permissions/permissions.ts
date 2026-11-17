import {
  Breadcrumbs,
  Button,
  Confirmation,
  Error,
  Icon,
  Modal,
  Pagination,
  Paginator,
  Toast,
  UiInput,
  UiTable,
} from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, effect, inject, signal, viewChild } from '@angular/core';
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
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    Paginator,
    FormsModule,
    Error,
    Icon,
  ],
  providers: [Pagination],
  template: ` <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Permisos' }]" />
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
    @if (permissions.error()) {
      <lib-error
        (retry)="permissions.reload()"
        [description]="$safeNavigationMigration(permissions.error()?.message)"
      />
    } @else {
      <div class="overflow-x-auto">
        <table uiTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Fecha de creación</th>
              <th>Fecha de actualización</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (permission of permissions.value(); track permission.id) {
              <tr>
                <td>{{ permission.descriptiveId }}</td>
                <td>{{ permission.description }}</td>
                <td>{{ permission.createdAt | date: 'medium' }}</td>
                <td>{{ permission.updatedAt | date: 'medium' }}</td>
                <td>
                  <button
                    class="cursor-pointer hover:bg-surface-2 p-1 rounded-lg flex items-center justify-center"
                    ngMenuTrigger
                    #origin
                    #trigger="ngMenuTrigger"
                    [menu]="formatMenu()"
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
                    <div ngMenu class="bg-surface-1 shadow-sm rounded-lg p-1 w-48" #formatMenu="ngMenu">
                      <ng-template ngMenuContent>
                        <button
                          ngMenuItem
                          value="Edit"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="editPermission($any(permission))"
                        >
                          <ui-icon name="pencil" class="text-lg" />
                          <span>Editar</span>
                        </button>
                        <button
                          ngMenuItem
                          value="Delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="deletePermission($any(permission))"
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
      <div class="px-4">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    }`,
})
export class Permissions {
  private modal = inject(Modal);
  public pagination = inject(Pagination);
  formatMenu = viewChild<Menu<string>>('formatMenu');
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
}
