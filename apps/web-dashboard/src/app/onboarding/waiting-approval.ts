import { Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { OnboardingMyJoinRequestStatusDocument } from '../graphql/generated/graphql';
import Auth from '../auth/auth';

@Component({
  selector: 'app-waiting-approval',
  imports: [],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
        <button class="btn btn-ghost btn-sm" (click)="logout()">
          <span class="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-5xl text-warning">hourglass_top</span>
            </div>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-base-content">Esperando Aprobación</h1>
            @if (schoolName()) {
              <p class="text-base-content/70">
                Tu solicitud para unirte a <strong>{{ schoolName() }}</strong> como
                <strong>{{ roleLabel() }}</strong> ha sido enviada.
              </p>
            } @else {
              <p class="text-base-content/70">Tu solicitud ha sido enviada al administrador de la escuela.</p>
            }
          </div>

          <div class="bg-base-200 rounded-xl p-6 space-y-4">
            <div class="flex items-start gap-3 text-left">
              <span class="material-symbols-outlined text-warning mt-0.5">schedule</span>
              <div>
                <p class="font-medium text-base-content">Solicitud en revisión</p>
                <p class="text-sm text-base-content/60">
                  El administrador de la escuela revisará tu solicitud y te notificará cuando sea aprobada.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3 text-left">
              <span class="material-symbols-outlined text-primary mt-0.5">notifications</span>
              <div>
                <p class="font-medium text-base-content">Te avisaremos</p>
                <p class="text-sm text-base-content/60">
                  Verificamos automáticamente cada 30 segundos. También recibirás una notificación.
                </p>
              </div>
            </div>
          </div>

          @if (checking()) {
            <div class="flex items-center justify-center gap-2 text-base-content/50">
              <span class="loading loading-spinner loading-xs"></span>
              <span class="text-sm">Verificando estado...</span>
            </div>
          }
        </div>
      </main>

      <footer class="p-4 md:p-6 flex justify-center border-t border-base-200 bg-base-100/80 backdrop-blur-sm">
        <p class="text-sm text-base-content/60">
          ¿Necesitas ayuda?
          <a href="mailto:soporte@skooltrak.com" class="link link-primary">Contactar soporte</a>
        </p>
      </footer>
    </div>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WaitingApproval implements OnInit, OnDestroy {
  private apollo = inject(Apollo);
  private router = inject(Router);
  private auth = inject(Auth);
  private toasts = inject(Toast);

  public schoolName = signal('');
  public requestedRole = signal('');
  public checking = signal(false);
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private roleLabels: Record<string, string> = {
    ORG_ADMIN: 'Administrador',
    TEACHER: 'Docente',
    PARENT: 'Padre/Tutor',
  };

  public roleLabel = () => this.roleLabels[this.requestedRole()] || this.requestedRole();

  ngOnInit() {
    this.checkStatus();
    // Poll every 30 seconds
    this.pollInterval = setInterval(() => this.checkStatus(), 30000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private checkStatus() {
    this.checking.set(true);

    this.apollo
      .query({
        query: OnboardingMyJoinRequestStatusDocument,
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (res) => {
          this.checking.set(false);
          const request = res.data?.myJoinRequestStatus;

          if (request) {
            this.schoolName.set(request.schoolName ?? '');
            this.requestedRole.set(request.requestedRole);

            if (request.status === 'APPROVED') {
              this.toasts.showSuccess('Tu solicitud ha sido aprobada. ¡Bienvenido!');
              // Force refresh user data and navigate
              window.location.href = '/home';
            } else if (request.status === 'REJECTED') {
              this.toasts.showError('Tu solicitud ha sido rechazada.');
              this.router.navigate(['/onboarding/choose-path']);
            }
          }
        },
        error: () => {
          this.checking.set(false);
        },
      });
  }

  public logout() {
    this.auth.logout();
  }
}
