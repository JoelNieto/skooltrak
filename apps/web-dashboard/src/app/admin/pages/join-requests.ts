import { EmptyState, Loader, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

interface PendingJoinRequest {
  id: string;
  requestedRole: string;
  documentId: string;
  status: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userImage: string;
  schoolId: string;
  schoolName: string;
  createdAt: Date;
}

@Component({
  selector: 'app-join-requests',
  imports: [Loader, DatePipe, EmptyState],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Solicitudes de Acceso</h1>
          <p class="text-base-content/60">Administra las solicitudes de usuarios que desean unirse a tu escuela.</p>
        </div>
        <button class="btn btn-ghost btn-sm" (click)="loadRequests()">
          <span class="material-symbols-outlined">refresh</span>
          Actualizar
        </button>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <lib-loader />
        </div>
      } @else if (requests().length === 0) {
        <lib-empty-state
          [title]="'No hay solicitudes pendientes'"
          [description]="'Cuando un usuario solicite unirse a tu escuela, aparecerá aquí.'"
          [icon]="'inbox'"
        />
      } @else {
        <div class="grid gap-4">
          @for (request of requests(); track request.id) {
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <div class="flex items-start gap-4">
                  <!-- Avatar -->
                  <div class="avatar avatar-placeholder">
                    <div class="w-12 h-12 rounded-full bg-primary/10 text-primary">
                      <span class="text-lg font-medium">
                        {{ request.userFirstName.charAt(0) }}{{ request.userLastName.charAt(0) }}
                      </span>
                    </div>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-base-content">
                      {{ request.userFirstName }} {{ request.userLastName }}
                    </h3>
                    <p class="text-sm text-base-content/60">{{ request.userEmail }}</p>
                    <div class="flex items-center gap-3 mt-2">
                      <span class="badge" [class]="getRoleBadgeClass(request.requestedRole)">
                        {{ getRoleLabel(request.requestedRole) }}
                      </span>
                      <span class="text-xs text-base-content/40">
                        {{ request.schoolName }}
                      </span>
                      @if (request.documentId) {
                        <span class="text-xs text-base-content/40"> Doc: {{ request.documentId }} </span>
                      }
                    </div>
                    <p class="text-xs text-base-content/40 mt-1">Solicitado {{ request.createdAt | date: 'medium' }}</p>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-2">
                    <button class="btn btn-success btn-sm" (click)="approve(request.id)" [disabled]="processing()">
                      <span class="material-symbols-outlined text-lg">check</span>
                      Aprobar
                    </button>
                    <button
                      class="btn btn-error btn-sm btn-outline"
                      (click)="reject(request.id)"
                      [disabled]="processing()"
                    >
                      <span class="material-symbols-outlined text-lg">close</span>
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class JoinRequests {
  private apollo = inject(Apollo);
  private toasts = inject(Toast);

  public loading = signal(true);
  public processing = signal(false);
  public requests = signal<PendingJoinRequest[]>([]);

  private roleLabels: Record<string, string> = {
    ORG_ADMIN: 'Administrador',
    TEACHER: 'Docente',
    PARENT: 'Padre/Tutor',
  };

  constructor() {
    this.loadRequests();
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ORG_ADMIN':
        return 'badge-error';
      case 'TEACHER':
        return 'badge-primary';
      case 'PARENT':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  }

  loadRequests() {
    this.loading.set(true);

    this.apollo
      .query<{ pendingJoinRequests: PendingJoinRequest[] }>({
        query: gql`
          query PendingJoinRequests {
            pendingJoinRequests {
              id
              requestedRole
              documentId
              status
              userId
              userFirstName
              userLastName
              userEmail
              userImage
              schoolId
              schoolName
              createdAt
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (res) => {
          this.requests.set(res.data?.pendingJoinRequests || []);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al cargar solicitudes');
        },
      });
  }

  approve(requestId: string) {
    this.processRequest(requestId, true);
  }

  reject(requestId: string) {
    this.processRequest(requestId, false);
  }

  private processRequest(requestId: string, approve: boolean) {
    this.processing.set(true);

    this.apollo
      .mutate<{ approveJoinRequest: boolean }>({
        mutation: gql`
          mutation ApproveJoinRequest($requestId: String!, $approve: Boolean!) {
            approveJoinRequest(requestId: $requestId, approve: $approve)
          }
        `,
        variables: { requestId, approve },
      })
      .subscribe({
        next: () => {
          this.processing.set(false);
          this.toasts.showSuccess(approve ? 'Solicitud aprobada' : 'Solicitud rechazada');
          // Remove from list
          this.requests.update((reqs) => reqs.filter((r) => r.id !== requestId));
        },
        error: (err) => {
          this.processing.set(false);
          this.toasts.showError(err.message || 'Error al procesar la solicitud');
        },
      });
  }
}
