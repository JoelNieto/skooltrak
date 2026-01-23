import { Toast } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Loader, markGroupDirty } from '@/ui';

import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Loader, RouterLink],

  template: ` <div
    class="gradient-bg min-h-screen flex items-center justify-center p-4"
  >
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
          <form
            id="loginForm"
            class="space-y-6"
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
          >
            <!-- Email Field -->
            <div class="fieldset">
              <label for="email">Correo Electrónico</label>
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <span class="material-symbols-outlined">mail</span>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  class="input input-primary"
                  placeholder="you@example.com"
                  formControlName="email"
                />
              </div>
              @if(form.get('email')?.hasError('required')) {
              <p id="emailError" class="text-red-500 text-xs mt-1 hidden">
                Por favor, ingresa un correo electrónico válido
              </p>
              }
            </div>

            <!-- Password Field -->
            <div class="fieldset">
              <div class="flex justify-between items-center mb-1">
                <label for="password">Contraseña</label>
                <a href="#" class="text-sm link link-primary"
                  >¿Olvidaste tu contraseña?</a
                >
              </div>
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <i class="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  class="input input-primary"
                  placeholder="••••••••"
                  formControlName="password"
                />
                <button
                  type="button"
                  id="togglePassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i
                    class="fas fa-eye text-gray-400 hover:text-gray-600 transition duration-200"
                  ></i>
                </button>
              </div>
              @if(form.get('password')?.hasError('required')) {
              <p id="passwordError" class="text-error text-xs mt-1 hidden">
                Por favor, ingresa una contraseña
              </p>
              }
            </div>

            <button type="submit" class="btn btn-primary w-full">
              Iniciar Sesión
            </button>
          </form>

          <div class="divider">o</div>

          <p class="text-center text-sm">
            ¿No tienes cuenta?
            <a routerLink="/register" class="link link-primary">Regístrate aquí</a>
          </p>
        </div>
      </div>
      <p class="text-base-200 text-center">
        2025 © Skooltrak. Todos los derechos reservados.
      </p>
    </div>
    } @placeholder {
    <lib-loader />
    } @error {
    <div>Error loading login</div>
    }
  </div>`,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(Auth);
  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  private toasts = inject(Toast);
  public loading = signal(false);

  public onSubmit() {
    if (this.form.invalid) {
      this.toasts.showError('Llenar todos los campos');
      markGroupDirty(this.form);
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.signIn(email, password);
  }
}
