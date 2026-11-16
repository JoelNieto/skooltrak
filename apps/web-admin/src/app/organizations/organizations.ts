import { Breadcrumbs, Button, Confirmation, Error, Icon, Modal, Toast, UiTable } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, viewChild } from '@angular/core';
import { Prisma } from '@generated/prisma';
import { OrganizationsForm } from './organizations-form';
@Component({
  selector: 'app-organizations',
  imports: [
    Breadcrumbs,
    UiTable,
    Button,
    DatePipe,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    Error,
    Icon,
  ],

  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Organizaciones' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Organizaciones</h1>
        <p class="text-sm text-ink-muted">Listado de organizaciones</p>
      </div>

      <button uiButton variant="primary" (click)="editOrganization()">
        <ui-icon name="circle-plus" /> Nueva Organizacións
      </button>
    </div>
    @if (organizations.error()) {
      <lib-error
        (retry)="organizations.reload()"
        [description]="$safeNavigationMigration(organizations.error()?.message)"
      />
    } @else {
      <div class="overflow-x-auto">
        <table uiTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Fecha de creación</th>
              <th>Fecha de actualización</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (organization of organizations.value(); track organization.id) {
              <tr>
                <td>{{ organization.name }}</td>
                <td>{{ organization.description }}</td>
                <td>{{ organization.createdAt | date: 'medium' }}</td>
                <td>{{ organization.updatedAt | date: 'medium' }}</td>
                <td>
                  <button
                    class="cursor-pointer hover:bg-surface-2 p-1 rounded-lg flex items-center justify-center"
                    ngMenuTrigger
                    #origin
                    #trigger="ngMenuTrigger"
                    [menu]="actionsMenu()"
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
                    <div ngMenu class="bg-surface-1 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                      <ng-template ngMenuContent>
                        <button
                          ngMenuItem
                          value="Edit"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (keydown.enter)="editOrganization($any(organization))"
                          (click)="editOrganization($any(organization))"
                          type="button"
                        >
                          <ui-icon name="pencil" class="text-lg" />
                          <span>Editar</span>
                        </button>
                        <button
                          ngMenuItem
                          value="Delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-2 w-full"
                          (click)="deleteOrganization($any(organization))"
                          (keydown.enter)="deleteOrganization($any(organization))"
                          type="button"
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
    }`,
})
export class Organizations {
  private readonly http = inject(HttpClient);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');

  public organizations = httpResource<Prisma.OrganizationCreateInput[]>(() => '/api/v1/organizations', {
    defaultValue: [],
  });

  public editOrganization(organization?: Prisma.OrganizationCreateInput) {
    this.modal
      .open(OrganizationsForm, {
        title: organization ? 'Editar Organización' : 'Nueva Organización',
        showCloseButton: true,
        size: 'small',
        data: { organization },
      })
      .closed.subscribe(() => {
        this.organizations.reload();
      });
  }

  public deleteOrganization(organization: Prisma.OrganizationCreateInput) {
    this.confirmation
      .confirm({
        title: 'Eliminar Organización',
        message: '¿Estás seguro de eliminar esta organización?',
      })
      .subscribe((result) => {
        if (result) {
          this.http.delete(`/api/v1/organizations/${organization.id!}`).subscribe({
            next: () => {
              this.toasts.showInfo('Organización eliminada exitosamente');
              this.organizations.reload();
            },
            error: (error) => {
              console.error(error);
              this.toasts.showError('Error al eliminar la organización');
            },
          });
        }
      });
  }
}
