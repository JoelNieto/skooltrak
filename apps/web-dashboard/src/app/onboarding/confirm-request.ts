import { Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-confirm-request',
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-5xl text-primary">send</span>
            </div>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-base-content">Confirmar Solicitud</h1>
            <p class="text-base-content/70">
              Estás solicitando unirte a <strong>{{ schoolName() }}</strong> como
              <strong>{{ roleLabel() }}</strong>.
            </p>
            <p class="text-base-content/50 text-sm">
              El administrador de la escuela recibirá tu solicitud y deberá aprobarla.
            </p>
          </div>

          <div class="space-y-3">
            <button class="btn btn-primary w-full" (click)="sendRequest()" [disabled]="loading()">
              @if (loading()) {
                <span class="loading loading-spinner loading-sm"></span>
                Enviando...
              } @else {
                <span class="material-symbols-outlined">send</span>
                Enviar Solicitud
              }
            </button>
            <button class="btn btn-ghost btn-sm" (click)="goBack()">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
              Volver
            </button>
          </div>
        </div>
      </main>
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
export default class ConfirmRequest implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);

  public schoolId = signal('');
  public schoolName = signal('');
  public role = signal('');
  public loading = signal(false);

  private roleLabels: Record<string, string> = {
    ORG_ADMIN: 'Administrador',
    TEACHER: 'Docente',
  };

  public roleLabel = () => this.roleLabels[this.role()] || this.role();

  ngOnInit() {
    this.schoolId.set(this.route.snapshot.queryParamMap.get('schoolId') || '');
    this.schoolName.set(this.route.snapshot.queryParamMap.get('schoolName') || '');
    this.role.set(this.route.snapshot.queryParamMap.get('role') || '');

    if (!this.schoolId() || !this.role()) {
      this.router.navigate(['/onboarding/join-school']);
    }
  }

  sendRequest() {
    this.loading.set(true);

    this.apollo
      .mutate<{ requestJoinSchool: { status: string; message: string } }>({
        mutation: gql`
          mutation RequestJoinSchool($input: RequestJoinSchoolInput!) {
            requestJoinSchool(input: $input) {
              status
              message
            }
          }
        `,
        variables: {
          input: {
            schoolId: this.schoolId(),
            requestedRole: this.role(),
          },
        },
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toasts.showSuccess(res.data?.requestJoinSchool.message || 'Solicitud enviada');
          this.router.navigate(['/onboarding/waiting-approval']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al enviar la solicitud');
        },
      });
  }

  goBack() {
    this.router.navigate(['/onboarding/select-role'], {
      queryParams: { schoolId: this.schoolId(), schoolName: this.schoolName() },
    });
  }
}
