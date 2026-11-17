import { Button, Card, CardBody, Toast, UiField, UiInput } from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';

import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [Button, Card, CardBody, FormField, UiField, UiInput],
  template: `
    <div class="bg-surface-0 min-h-screen flex items-center justify-center p-4">
      <div uiCard class="max-w-md w-full overflow-hidden">
        <div class="bg-neutral p-6 text-neutral-content text-center">
          <h1 class="text-2xl font-semibold">Bienvenido</h1>
          <p class="mt-2 opacity-80">Inicia sesión para continuar</p>
        </div>

        <div uiCardBody class="p-8">
          <form id="loginForm" class="flex flex-col gap-4" (submit)="onSubmit($event)">
            <ui-field label="Correo electrónico" [field]="form.email">
              <input uiInput type="email" autocomplete="email" placeholder="tu@correo.com" [formField]="form.email" />
            </ui-field>

            <ui-field label="Contraseña" [field]="form.password">
              <div class="relative">
                <input
                  uiInput
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="pr-12"
                  [formField]="form.password"
                />
                <button
                  uiButton
                  variant="ghost"
                  size="sm"
                  iconOnly
                  type="button"
                  class="absolute inset-y-0 right-1 my-auto"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  [attr.aria-pressed]="showPassword()"
                  (click)="showPassword.set(!showPassword())"
                >
                  <span class="material-symbols-outlined text-xl" aria-hidden="true">{{
                    showPassword() ? 'visibility_off' : 'visibility'
                  }}</span>
                </button>
              </div>
            </ui-field>

            <button uiButton variant="primary" type="submit" class="w-full mt-2" [loading]="loading()">
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
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
  public showPassword = signal(false);

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
