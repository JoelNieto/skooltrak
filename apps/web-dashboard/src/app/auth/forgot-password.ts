import { Loader } from '@/ui';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import Auth from './auth';

@Component({
  selector: 'app-forgot-password',
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
              <h1 class="text-2xl font-bold">Recuperar contraseña</h1>
              <p class="text-primary-content mt-2">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu
                contraseña
              </p>
            </div>

            <!-- Form Section -->
            <div class="p-8 bg-base-100">
              @if (sent()) {
                <div class="alert alert-success mb-4">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span
                    >Revisa tu correo electrónico. Te hemos enviado un enlace
                    para restablecer tu contraseña.</span
                  >
                </div>
                <div class="text-center">
                  <a routerLink="/login" class="btn btn-primary">
                    Volver al inicio de sesión
                  </a>
                </div>
              } @else {
                <form
                  [formGroup]="form"
                  (ngSubmit)="onSubmit()"
                  class="space-y-6"
                >
                  <div class="fieldset">
                    <label for="email">Correo Electrónico</label>
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <span class="material-symbols-outlined">mail</span>
                      </div>
                      <input
                        id="email"
                        formControlName="email"
                        type="email"
                        autocomplete="email"
                        class="input input-primary"
                        placeholder="tu@email.com"
                      />
                    </div>
                    @if (
                      form.get('email')?.touched &&
                      form.get('email')?.hasError('required')
                    ) {
                      <p class="text-error text-xs mt-1">
                        El correo electrónico es requerido
                      </p>
                    }
                    @if (
                      form.get('email')?.touched &&
                      form.get('email')?.hasError('email')
                    ) {
                      <p class="text-error text-xs mt-1">
                        Ingresa un correo electrónico válido
                      </p>
                    }
                  </div>

                  <button
                    type="submit"
                    [disabled]="loading() || form.invalid"
                    class="btn btn-primary w-full"
                  >
                    @if (loading()) {
                      <span class="loading loading-spinner loading-sm"></span>
                      Enviando...
                    } @else {
                      Enviar enlace de recuperación
                    }
                  </button>
                </form>

                <div class="divider">o</div>

                <p class="text-center text-sm">
                  ¿Ya recuerdas tu contraseña?
                  <a routerLink="/login" class="link link-primary"
                    >Inicia sesión</a
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
export default class ForgotPasswordComponent {
  private auth = inject(Auth);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  loading = signal(false);
  sent = signal(false);

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const email = this.form.value.email;
    if (email) {
      await this.auth.requestPasswordReset(email);
    }
    this.loading.set(false);
    this.sent.set(true);
  }
}
