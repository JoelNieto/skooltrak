import { Loader, Toast } from '@/ui';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import Auth from './auth';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, Loader],
  template: `
    <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
      @defer {
        <div class="max-w-md w-full flex flex-col gap-8 items-center">
          <div><img src="skooltrak.png" alt="" class="h-12" /></div>

          <div
            class="w-full rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            <!-- Header Section -->
            <div class="bg-primary p-6 text-white text-center">
              <h1 class="text-2xl font-bold">Nueva contraseña</h1>
              <p class="text-primary-content mt-2">
                Ingresa tu nueva contraseña
              </p>
            </div>

            <!-- Form Section -->
            <div class="p-8 bg-base-100">
              @if (resendSuccess()) {
                <div class="alert alert-success mb-4">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Invitación reenviada. Revisa tu bandeja de entrada.</span>
                </div>
                <a routerLink="/login" class="btn btn-primary w-full">
                  Volver al inicio de sesión
                </a>
              } @else if (error()) {
                <div class="alert alert-error mb-4">
                  <span class="material-symbols-outlined">error</span>
                  <span
                    >El enlace es inválido o ha expirado. Solicita uno
                    nuevo.</span
                  >
                </div>
                <div class="flex flex-col gap-3 text-center">
                  @if (emailFromUrl()) {
                    <button
                      type="button"
                      class="btn btn-primary"
                      [disabled]="resending()"
                      (click)="resendInvitation()"
                    >
                      @if (resending()) {
                        <span class="loading loading-spinner loading-sm"></span>
                        Enviando...
                      } @else {
                        <span class="material-symbols-outlined">mail</span>
                        Reenviar invitación
                      }
                    </button>
                  } @else {
                    <a routerLink="/forgot-password" class="btn btn-primary">
                      Solicitar nuevo enlace
                    </a>
                  }
                </div>
              } @else {
                <form
                  [formGroup]="form"
                  (ngSubmit)="onSubmit()"
                  class="space-y-6"
                >
                  <div class="fieldset">
                    <label for="password">Nueva contraseña</label>
                    <input
                      id="password"
                      formControlName="password"
                      type="password"
                      autocomplete="new-password"
                      class="input input-primary w-full"
                      placeholder="Mínimo 8 caracteres"
                    />
                    @if (
                      form.get('password')?.touched &&
                      form.get('password')?.hasError('required')
                    ) {
                      <p class="text-error text-xs mt-1">
                        La contraseña es requerida
                      </p>
                    }
                    @if (
                      form.get('password')?.touched &&
                      form.get('password')?.hasError('minlength')
                    ) {
                      <p class="text-error text-xs mt-1">
                        La contraseña debe tener al menos 8 caracteres
                      </p>
                    }
                  </div>

                  <div class="fieldset">
                    <label for="confirmPassword">Confirmar contraseña</label>
                    <input
                      id="confirmPassword"
                      formControlName="confirmPassword"
                      type="password"
                      autocomplete="new-password"
                      class="input input-primary w-full"
                      placeholder="Repite la nueva contraseña"
                    />
                    @if (
                      form.get('confirmPassword')?.touched &&
                      form.get('confirmPassword')?.hasError('required')
                    ) {
                      <p class="text-error text-xs mt-1">
                        Confirma tu contraseña
                      </p>
                    }
                  </div>

                  @if (passwordMismatch()) {
                    <p class="text-error text-sm">
                      Las contraseñas no coinciden.
                    </p>
                  }

                  <button
                    type="submit"
                    [disabled]="loading() || form.invalid || passwordMismatch()"
                    class="btn btn-primary w-full"
                  >
                    @if (loading()) {
                      <span class="loading loading-spinner loading-sm"></span>
                      Guardando...
                    } @else {
                      Guardar nueva contraseña
                    }
                  </button>
                </form>

                <div class="divider">o</div>

                <p class="text-center text-sm">
                  <a routerLink="/login" class="link link-primary"
                    >Volver al inicio de sesión</a
                  >
                </p>
              }
            </div>
          </div>

          <p class="text-base-200 text-center">
            2025 © Skooltrak. Todos los derechos reservados.
          </p>
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
  private apollo = inject(Apollo);
  private toasts = inject(Toast);

  token = signal<string | null>(null);
  emailFromUrl = signal<string | null>(null);
  error = signal(false);
  loading = signal(false);
  resending = signal(false);
  resendSuccess = signal(false);
  passwordMismatch = signal(false);

  form = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
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

    // Watch for password mismatch
    this.form.valueChanges.subscribe(() => {
      const { password, confirmPassword } = this.form.value;
      this.passwordMismatch.set(
        !!password && !!confirmPassword && password !== confirmPassword
      );
    });
  }

  async onSubmit() {
    const token = this.token();
    const password = this.form.value.password;

    if (this.form.invalid || !token || this.passwordMismatch() || !password) {
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
    this.apollo
      .mutate<{ resendUserInvitation: boolean }>({
        mutation: gql`
          mutation ResendUserInvitation($email: String!) {
            resendUserInvitation(email: $email)
          }
        `,
        variables: { email },
      })
      .subscribe({
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
