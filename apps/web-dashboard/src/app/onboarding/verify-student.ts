import { Alert, Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import Auth from '../auth/auth';
import { BrandLogo } from '../shared/brand-logo';

@Component({
  selector: 'app-verify-student',
  imports: [Alert, UiField, UiInput, Button, BrandLogo, FormField],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <app-brand-logo class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-5xl text-success">badge</span>
            </div>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Verificación de Estudiante</h1>
            <p class="text-ink-muted">
              Ingresa tu documento de identidad para vincular tu cuenta con tu registro en
              <strong>{{ schoolName() }}</strong
              >.
            </p>
          </div>

          <form (submit)="verify($event)" class="space-y-4 text-left">
            <ui-field label="Documento de Identidad" [field]="form.documentId">
              <input uiInput type="text" id="documentId" placeholder="Ej: 8-123-4567" [formField]="form.documentId" />
            </ui-field>

            @if (errorMessage()) {
              <div uiAlert tone="danger">
                <span class="material-symbols-outlined">error</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="pt-2 space-y-3">
              <button
                uiButton
                [loading]="loading()"
                variant="primary"
                type="submit"
                class="w-full"
                [disabled]="loading()"
              >
                @if (loading()) {
                  Verificando...
                } @else {
                  <span class="material-symbols-outlined">check</span>
                  Verificar y Vincular
                }
              </button>
              <button uiButton variant="ghost" size="sm" type="button" class="w-full" (click)="goBack()">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
                Volver
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export default class VerifyStudent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private auth = inject(Auth);

  public schoolId = signal('');
  public schoolName = signal('');
  public loading = signal(false);
  public errorMessage = signal('');
  formModel = signal({
    documentId: '',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.documentId, { message: 'El documento de identidad es requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      this.schoolId.set(this.route.snapshot.queryParamMap.get('schoolId') || '');
      this.schoolName.set(this.route.snapshot.queryParamMap.get('schoolName') || '');

      if (!this.schoolId()) {
        this.router.navigate(['/onboarding/join-school']);
      }
    });
  }

  verify(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const documentId = this.form.documentId();

    this.http
      .post<{ status: string; message?: string }>('/api/v1/auth/request-join-school', {
        schoolId: this.schoolId(),
        requestedRole: 'STUDENT',
        documentId,
      })
      .subscribe({
        next: async (result) => {
          this.loading.set(false);
          if (result?.status === 'LINKED') {
            this.toasts.showSuccess(result.message || 'Cuenta vinculada exitosamente');
            // Reload user so role/org/onboardingStep are fresh before the
            // dashboard guards run; otherwise the stale state bounces the
            // student back into onboarding.
            await this.auth.reloadUser();
            this.router.navigate(['/home']);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.message || 'Error al verificar el documento');
        },
      });
  }

  goBack() {
    this.router.navigate(['/onboarding/select-role'], {
      queryParams: { schoolId: this.schoolId(), schoolName: this.schoolName() },
    });
  }
}
