import {
  Badge,
  BadgeTone,
  Breadcrumbs,
  Button,
  Confirmation,
  Icon,
  Modal,
  Toast,
  UiIconName,
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
import { OrganizationsForm } from './organizations-form';

/** Latest admin invitation as returned by `GET /api/v1/organizations` (IAM-001 FR .4). */
export interface AdminInvitationSummary {
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  state: 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED' | 'ACCEPTED';
  expiresAt: string;
}

export type OrganizationRow = Prisma.OrganizationCreateInput & { adminInvitation: AdminInvitationSummary | null };

/** S01 shows the first two console states; the full set (expired, failed, setup n/5, active) is IAM-001-S04/S06. */
export function invitationBadge(invitation: AdminInvitationSummary | null): { label: string; tone: BadgeTone; icon: UiIconName } | null {
  if (!invitation) return null;
  switch (invitation.state) {
    case 'ACCEPTED':
      return { label: 'Aceptada', tone: 'success', icon: 'circle-check' };
    case 'VALID':
      return { label: 'Invitación enviada', tone: 'info', icon: 'mail-check' };
    default:
      return null;
  }
}
@Component({
  selector: 'app-organizations',
  imports: [Badge, Breadcrumbs, UiTable, Button, DatePipe, Icon, UiRowActions, UiTableEmpty, UiTableError, UiTableSkeleton],

  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Organizaciones' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Organizaciones</h1>
        <p class="text-sm text-ink-muted">Listado de organizaciones</p>
      </div>

      <button uiButton variant="primary" (click)="editOrganization()">
        <ui-icon name="circle-plus" /> Nueva organización
      </button>
    </div>
    <div class="overflow-x-auto">
      <table uiTable [attr.aria-busy]="organizations.isLoading()">
        <thead>
          <tr>
            <th>Organización</th>
            <th>Administrador invitado</th>
            <th>Estado</th>
            <th>Fecha de creación</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (organizationsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="5"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="5" (retry)="organizations.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (organization of organizationsList.rows(); track organization.id) {
                <tr>
                  <td>
                    <div class="font-semibold text-ink-strong">{{ organization.name }}</div>
                    @if (organization.description) {
                      <div class="type-caption text-ink-muted">{{ organization.description }}</div>
                    }
                  </td>
                  <td>
                    @if (organization.adminInvitation; as invitation) {
                      <div>{{ invitation.firstName }} {{ invitation.lastName }}</div>
                      <div class="type-caption text-ink-muted">{{ invitation.email }}</div>
                    } @else {
                      <span class="text-ink-subtle">—</span>
                    }
                  </td>
                  <td>
                    @if (badge(organization); as b) {
                      <span uiBadge size="sm" [tone]="b.tone"><ui-icon [name]="b.icon" /> {{ b.label }}</span>
                    }
                  </td>
                  <td>{{ organization.createdAt | date: 'medium' }}</td>
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
        }
      </table>
    </div> `,
})
export class Organizations {
  private readonly http = inject(HttpClient);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);

  public organizations = httpResource<OrganizationRow[]>(() => '/api/v1/organizations', {
    defaultValue: [],
  });
  /** organizations with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly organizationsList = listState(this.organizations);

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

  protected badge(organization: OrganizationRow) {
    return invitationBadge(organization.adminInvitation);
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
