import { Toast } from '#/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { markGroupDirty } from '../core/util';
import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: ` <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- Header Section -->
      <div class="bg-neutral p-6 text-white text-center">
        <h1 class="text-2xl font-bold">Bienvenido</h1>
        <p class="text-neutral-content mt-2">Inicia sesión para continuar</p>
      </div>

      <!-- Form Section -->
      <div class="p-8">
        <form id="loginForm" class="space-y-6" [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-envelope text-gray-400"></i>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                class="input"
                placeholder="you@example.com"
                formControlName="email"
              />
            </div>
            @if (form.get('email')?.hasError('required')) {
              <p id="emailError" class="text-red-500 text-xs mt-1 hidden">
                Por favor, ingresa un correo electrónico válido
              </p>
            }
          </div>

          <!-- Password Field -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
              <a href="#" class="text-sm link ">¿Olvidaste tu contraseña?</a>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-lock text-gray-400"></i>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                class="input"
                placeholder="••••••••"
                formControlName="password"
              />
              <button type="button" id="togglePassword" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <i class="fas fa-eye text-gray-400 hover:text-gray-600 transition duration-200"></i>
              </button>
            </div>
            @if (form.get('password')?.hasError('required')) {
              <p id="passwordError" class="text-red-500 text-xs mt-1 hidden">Por favor, ingresa una contraseña</p>
            }
          </div>

          <button type="submit" class="btn btn-neutral w-full">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login {
  #auth = inject(Auth);
  private fb = inject(NonNullableFormBuilder);
  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  private toasts = inject(Toast);
  public loading = signal(false);

  public async onSubmit() {
    if (this.form.invalid) {
      this.toasts.showError('Llenar todos los campos');
      markGroupDirty(this.form);
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    await this.#auth.signIn(email, password);
    this.loading.set(false);
  }
}
