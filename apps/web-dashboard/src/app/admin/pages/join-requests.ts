import { Badge, BadgeTone, Button, Card, CardBody, EmptyState, Loader, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

type JoinRequestRow = {
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
  createdAt: string;
};

@Component({
  selector: 'app-join-requests',
  imports: [Badge, Card, CardBody, Button, Loader, DatePipe, EmptyState],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Solicitudes de Acceso</h1>
          <p class="text-base-content/60">Administra las solicitudes de usuarios que desean unirse a tu escuela.</p>
        </div>
        <button uiButton variant="ghost" size="sm" (click)="loadRequests()">
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
            <div uiCard>
              <div uiCardBody>
                <div class="flex items-start gap-4">
                  <div class="avatar avatar-placeholder">
                    <div class="w-12 h-12 rounded-full bg-primary/10 text-primary">
                      <span class="text-lg font-medium">
                        {{ request.userFirstName.charAt(0) }}{{ request.userLastName.charAt(0) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-base-content">
                      {{ request.userFirstName }} {{ request.userLastName }}
                    </h3>
                    <p class="text-sm text-base-content/60">{{ request.userEmail }}</p>
                    <div class="flex items-center gap-3 mt-2">
                      <span uiBadge [tone]="roleTone(request.requestedRole)">
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

                  <div class="flex gap-2">
                    <button
                      uiButton
                      variant="primary"
                      size="sm"
                      (click)="approve(request.id)"
                      [disabled]="processing()"
                    >
                      <span class="material-symbols-outlined text-lg">check</span>
                      Aprobar
                    </button>
                    <button uiButton variant="danger" size="sm" (click)="reject(request.id)" [disabled]="processing()">
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
})
export default class JoinRequests {
  private http = inject(HttpClient);
  private toasts = inject(Toast);

  public loading = signal(true);
  public processing = signal(false);
  public requests = signal<JoinRequestRow[]>([]);

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

  roleTone(role: string): BadgeTone {
    switch (role) {
      case 'ORG_ADMIN':
        return 'danger';
      case 'TEACHER':
        return 'action';
      case 'PARENT':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  loadRequests() {
    this.loading.set(true);

    this.http.get<JoinRequestRow[]>('/api/v1/auth/pending-join-requests').subscribe({
      next: (rows) => {
        this.requests.set(rows ?? []);
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

    this.http.post('/api/v1/auth/approve-join-request', { requestId, approve }).subscribe({
      next: () => {
        this.processing.set(false);
        this.toasts.showSuccess(approve ? 'Solicitud aprobada' : 'Solicitud rechazada');
        this.requests.update((reqs) => reqs.filter((r) => r.id !== requestId));
      },
      error: (err) => {
        this.processing.set(false);
        this.toasts.showError(err.message || 'Error al procesar la solicitud');
      },
    });
  }
}
