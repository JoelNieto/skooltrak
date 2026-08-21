import { Loader, Toast } from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [FormField, Loader, RouterLink],

  template: ` <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
    @defer {
      <div class="max-w-md w-full flex flex-col gap-8 items-center">
        <div><img src="skooltrak.png" alt="" class="h-12" /></div>

        <div class=" w-full rounded-2xl shadow-xl overflow-hidden flex flex-col ">
          <!-- Header Section -->
          <div class="bg-primary p-6 text-white text-center">
            <h1 class="text-2xl font-bold">Bienvenido</h1>
            <p class="text-primary-content mt-2">Inicia sesión para continuar</p>
          </div>

          <!-- Form Section -->
          <div class="p-8 bg-base-100">
            @if (passwordResetSuccess()) {
              <div class="alert alert-success mb-4">
                <span class="material-symbols-outlined">check_circle</span>
                <span>Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.</span>
              </div>
            }
            <form id="loginForm" class="space-y-6" (submit)="onSubmit($event)">
              <!-- Email Field -->
              <div class="fieldset">
                <label for="email">Correo Electrónico</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined">mail</span>
                  </div>
                  <input
                    type="email"
                    id="email"
                    class="input input-primary"
                    placeholder="you@example.com"
                    [formField]="form.email"
                    [class.ng-invalid]="form.email().invalid() && form.email().touched()"
                  />
                </div>
                @if (form.email().touched() && form.email().errors()) {
                  @for (error of form.email().errors(); track error.message) {
                    <p class="text-error text-xs mt-1">{{ error.message }}</p>
                  }
                }
              </div>

              <!-- Password Field -->
              <div class="fieldset">
                <div class="flex justify-between items-center mb-1">
                  <label for="password">Contraseña</label>
                  <a routerLink="/forgot-password" class="text-sm link link-primary">¿Olvidaste tu contraseña?</a>
                </div>

                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    type="password"
                    id="password"
                    class="input input-primary"
                    placeholder="••••••••"
                    [class.ng-invalid]="form.password().invalid() && form.password().touched()"
                    [formField]="form.password"
                  />
                </div>
                @if (form.password().touched() && form.password().errors()) {
                  @for (error of form.password().errors(); track error.message) {
                    <p class="text-error text-xs mt-1">{{ error.message }}</p>
                  }
                }
              </div>

              <button type="submit" class="btn btn-primary w-full">Iniciar Sesión</button>
            </form>

            <div class="divider">o</div>
            <a routerLink="/auth/magic-link" class="btn btn-outline btn-secondary w-full">Acceso sin contraseña</a>
            <p class="text-center text-sm mt-4">
              ¿No tienes cuenta?
              <a routerLink="/register" class="link link-primary">Regístrate aquí</a>
            </p>
          </div>
        </div>
        <p class="text-base-200 text-center">2025 © Skooltrak. Todos los derechos reservados.</p>
      </div>
    } @placeholder {
      <lib-loader />
    } @error {
      <div>Error loading login</div>
    }
  </div>`,
})
export default class Login {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private toasts = inject(Toast);

  private loginModel = signal({
    email: '',
    password: '',
  });

  public form = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'El correo electrónico es requerido' });
    required(schemaPath.password, { message: 'La contraseña es requerida' });
    email(schemaPath.email, { message: 'El correo electrónico no es válido' });
    minLength(schemaPath.password, 6, { message: 'La contraseña debe tener al menos 6 caracteres' });
  });

  public loading = signal(false);
  public passwordResetSuccess = signal(false);

  constructor() {
    // Check for password reset success query param
    this.route.queryParams.subscribe((params) => {
      if (params['reset'] === 'success') {
        this.passwordResetSuccess.set(true);
      }
    });
  }

  public async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Llenar todos los campos');
      return;
    }
    const { email, password } = this.form().value();
    this.loading.set(true);
    await this.auth.signIn(email, password);
    this.loading.set(false);
  }
}
