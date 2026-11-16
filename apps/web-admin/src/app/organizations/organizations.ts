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
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Prisma } from '@generated/prisma';
import { OrganizationsForm } from './organizations-form';
@Component({
  selector: 'app-organizations',
  imports: [Breadcrumbs, UiTable, Button, DatePipe, Icon, UiRowActions, UiTableEmpty, UiTableError, UiTableSkeleton],

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
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="organizations.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @if (organizations.isLoading() && !organizations.hasValue()) {
          <tbody uiTableSkeleton [columns]="5"></tbody>
        } @else if (organizations.error()) {
          <tbody>
            <tr uiTableError [columns]="5" (retry)="organizations.reload()"></tr>
          </tbody>
        } @else {
          <tbody>
            @for (organization of organizations.value(); track organization.id) {
              <tr>
                <td>{{ organization.name }}</td>
                <td>{{ organization.description }}</td>
                <td>{{ organization.createdAt | date: 'medium' }}</td>
                <td>{{ organization.updatedAt | date: 'medium' }}</td>
                <td>
                  <ui-row-actions
                    [actions]="rowActions"
                    [label]="'Acciones para ' + organization.name"
                    (action)="onRowAction($event, organization)"
                  />
                </td>
              </tr>
            } @empty {
              <tr uiTableEmpty [columns]="5" icon="building-2" title="Aún no hay organizaciones"></tr>
            }
          </tbody>
        }
      </table>
    </div> `,
})
export class Organizations {
  private readonly http = inject(HttpClient);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);

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

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, organization: Prisma.OrganizationCreateInput): void {
    switch (action) {
      case 'edit':
        this.editOrganization(organization);
        break;
      case 'delete':
        this.deleteOrganization(organization);
        break;
    }
  }
}
