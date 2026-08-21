import { Toast } from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';

import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: ` <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- Header Section -->
      <div class="bg-neutral p-6 text-white text-center">
        <h1 class="text-2xl font-bold">Bienvenido</h1>
        <p class="text-neutral-content mt-2">Inicia sesión para continuar</p>
      </div>

      <!-- Form Section -->
      <div class="p-8">
        <form id="loginForm" class="space-y-6" (submit)="onSubmit($event)">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-envelope text-gray-400"></i>
              </div>
              <input type="email" id="email" class="input" placeholder="you@example.com" [formField]="form.email" />
            </div>
            @if (form.email().touched() && form.email().errors()) {
              @for (error of form.email().errors(); track error.message) {
                <p class="text-red-500 text-xs mt-1">{{ error.message }}</p>
              }
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
              <input type="password" id="password" class="input" placeholder="••••••••" [formField]="form.password" />
              <button type="button" id="togglePassword" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <i class="fas fa-eye text-gray-400 hover:text-gray-600 transition duration-200"></i>
              </button>
            </div>
            @if (form.password().touched() && form.password().errors()) {
              @for (error of form.password().errors(); track error.message) {
                <p class="text-red-500 text-xs mt-1">{{ error.message }}</p>
              }
            }
          </div>

          <button type="submit" class="btn btn-neutral w-full">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  </div>`,
})
export default class Login {
  #auth = inject(Auth);
  public loginModel = signal({
    email: '',
    password: '',
  });

  public form = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email);
    required(schemaPath.password);
    email(schemaPath.email);
  });

  private toasts = inject(Toast);
  public loading = signal(false);

  public async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Llenar todos los campos');
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form().value();
    await this.#auth.signIn(email, password);
    this.loading.set(false);
  }
}
