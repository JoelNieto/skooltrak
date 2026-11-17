import { Alert, Button, Loader, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import Auth from './auth';
import { BrandLogo } from '../shared/brand-logo';

@Component({
  selector: 'app-reset-password',
  imports: [Alert, UiField, UiInput, Button, BrandLogo, FormField, RouterLink, Loader],
  template: `
    <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
      @defer {
        <div class="max-w-md w-full flex flex-col gap-8 items-center">
          <div><app-brand-logo alt="" class="h-12" /></div>

          <div class="w-full rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <!-- Header Section -->
            <div class="bg-primary p-6 text-white text-center">
              <h1 class="text-2xl font-bold">Nueva contraseña</h1>
              <p class="text-primary-content mt-2">Ingresa tu nueva contraseña</p>
            </div>

            <!-- Form Section -->
            <div class="p-8 bg-base-100">
              @if (resendSuccess()) {
                <div uiAlert tone="success" class="mb-4">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Invitación reenviada. Revisa tu bandeja de entrada.</span>
                </div>
                <a uiButton variant="primary" routerLink="/login" class="w-full"> Volver al inicio de sesión </a>
              } @else if (error()) {
                <div uiAlert tone="danger" class="mb-4">
                  <span class="material-symbols-outlined">error</span>
                  <span>El enlace es inválido o ha expirado. Solicita uno nuevo.</span>
                </div>
                <div class="flex flex-col gap-3 text-center">
                  @if (emailFromUrl()) {
                    <button
                      uiButton
                      [loading]="resending()"
                      variant="primary"
                      type="button"
                      [disabled]="resending()"
                      (click)="resendInvitation()"
                    >
                      @if (resending()) {
                        Enviando...
                      } @else {
                        <span class="material-symbols-outlined">mail</span>
                        Reenviar invitación
                      }
                    </button>
                  } @else {
                    <a uiButton variant="primary" routerLink="/forgot-password"> Solicitar nuevo enlace </a>
                  }
                </div>
              } @else {
                <form (submit)="onSubmit($event)" class="space-y-6">
                  <ui-field label="Nueva contraseña" [field]="form.password">
                    <input
                      uiInput
                      id="password"
                      [formField]="form.password"
                      type="password"
                      autocomplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </ui-field>

                  <ui-field label="Confirmar contraseña" [field]="form.confirmPassword">
                    <input
                      uiInput
                      id="confirmPassword"
                      [formField]="form.confirmPassword"
                      type="password"
                      autocomplete="new-password"
                      placeholder="Repite la nueva contraseña"
                    />
                  </ui-field>

                  <button
                    uiButton
                    [loading]="loading()"
                    variant="primary"
                    type="submit"
                    [disabled]="loading() || form().invalid()"
                    class="w-full"
                  >
                    @if (loading()) {
                      Guardando...
                    } @else {
                      Guardar nueva contraseña
                    }
                  </button>
                </form>

                <div class="divider">o</div>

                <p class="text-center text-sm">
                  <a routerLink="/login" class="link link-primary">Volver al inicio de sesión</a>
                </p>
              }
            </div>
          </div>

          <p class="text-ink-muted text-center">2025 © Skooltrak. Todos los derechos reservados.</p>
        </div>
      } @placeholder {
        <lib-loader />
      }
    </div>
  `,
})
export default class ResetPasswordComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toasts = inject(Toast);

  token = signal<string | null>(null);
  emailFromUrl = signal<string | null>(null);
  error = signal(false);
  loading = signal(false);
  resending = signal(false);
  resendSuccess = signal(false);

  private formModel = signal({ password: '', confirmPassword: '' });

  form = form(this.formModel, (schemaPath) => {
    required(schemaPath.password, { message: 'Contrasena requerida' });
    required(schemaPath.confirmPassword, { message: 'Confirma tu contraseña' });
    minLength(schemaPath.password, 8, { message: 'Minimo 8 caracteres' });
    validate(schemaPath.confirmPassword, ({ value, valueOf, stateOf }) => {
      if (!stateOf(schemaPath.password).touched()) {
        return null;
      }
      if (value() !== valueOf(schemaPath.password)) {
        return {
          kind: 'passwordMismatch',
          message: 'Las contraseñas no coinciden.',
        };
      }
      return null;
    });
  });

  constructor() {
    // Get token and email from URL query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const email = params.get('email');
      const errorParam = params.get('error');

      this.emailFromUrl.set(email);
      if (errorParam || !token) {
        this.error.set(true);
      } else {
        this.token.set(token);
      }
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const token = this.token();
    const { password } = this.formModel();

    if (this.form().invalid() || !token || !password) {
      return;
    }

    this.loading.set(true);
    const accessToken = await this.auth.resetPassword(token, password);
    this.loading.set(false);

    if (accessToken) {
      // User is already logged in after password reset, navigate to home
      this.router.navigate(['/home']);
    } else {
      this.error.set(true);
    }
  }

  resendInvitation() {
    const email = this.emailFromUrl();
    if (!email) return;

    this.resending.set(true);
    this.http.post('/api/v1/auth/resend-invitation', { email }).subscribe({
      next: () => {
        this.resending.set(false);
        this.toasts.showSuccess('Invitación reenviada. Revisa tu correo.');
        this.resendSuccess.set(true);
        this.error.set(false);
      },
      error: (err) => {
        this.resending.set(false);
        this.toasts.showError(err.message || 'Error al reenviar invitación');
      },
    });
  }
}
