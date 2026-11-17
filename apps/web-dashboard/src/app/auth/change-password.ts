import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import Auth from './auth';
import { Alert, Breadcrumbs, Button, UiField, UiInput } from '#/ui';

@Component({
  selector: 'app-change-password',
  imports: [Alert, Breadcrumbs, UiField, UiInput, Button, FormField, RouterLink],
  template: `
    <div class="flex flex-col gap-6">
      <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cambiar contraseña' }]" />

      <div class="bg-base-100 rounded-lg border border-base-300 p-6 max-w-xl w-full">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-base-content">Cambiar contraseña</h2>
          <p class="text-sm text-base-content/70">Ingresa tu contraseña actual y define una nueva contraseña.</p>
        </div>

        @if (success()) {
          <div uiAlert tone="success" class="mb-4">
            <span class="material-symbols-outlined">check_circle</span>
            <span>Contraseña cambiada exitosamente.</span>
          </div>
        }

        @if (error()) {
          <div uiAlert tone="danger" class="mb-4">
            <span class="material-symbols-outlined">error</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (submit)="onSubmit($event)" class="space-y-4">
          <ui-field label="Contraseña actual" [field]="form.currentPassword">
            <input
              uiInput
              id="currentPassword"
              [formField]="form.currentPassword"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </ui-field>
          <ui-field label="Nueva contraseña" [field]="form.newPassword">
            <input
              uiInput
              id="newPassword"
              [formField]="form.newPassword"
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

          @if (form.confirmPassword().touched() && form.confirmPassword().errors().length) {
            @for (error of form.confirmPassword().errors(); track error) {
              <p class="text-error text-sm">{{ error.message }}</p>
            }
          }

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <a uiButton routerLink="/home" class="w-full sm:w-auto"> Cancelar </a>
            <button
              uiButton
              [loading]="loading()"
              variant="primary"
              type="submit"
              [disabled]="loading() || form().invalid()"
              class="w-full sm:w-auto"
            >
              @if (loading()) {
                Cambiando...
              } @else {
                Cambiar contraseña
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class ChangePasswordComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  loading = signal(false);
  success = signal(false);
  error = signal(false);
  errorMessage = signal('Error al cambiar la contraseña. Verifica tu contraseña actual.');

  private formModel = signal({ currentPassword: '', newPassword: '', confirmPassword: '' });

  form = form(this.formModel, (schemaPath) => {
    required(schemaPath.currentPassword);
    required(schemaPath.newPassword);
    required(schemaPath.confirmPassword);
    minLength(schemaPath.newPassword, 8, { message: 'Minimo 8 caracteres' });
    validate(schemaPath.confirmPassword, ({ value, valueOf, stateOf }) => {
      if (this.success() || this.error()) {
        this.success.set(false);
        this.error.set(false);
      }
      if (!stateOf(schemaPath.newPassword).touched()) {
        return null;
      }
      if (value() !== valueOf(schemaPath.newPassword)) {
        return {
          kind: 'passwordMismatch',
          message: 'Contrasenas no coiciden',
        };
      }
      return null;
    });
  });

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) return;

    this.loading.set(true);
    this.error.set(false);
    this.success.set(false);

    const { currentPassword, newPassword } = this.formModel();
    if (!currentPassword || !newPassword) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    const result = await this.auth.changePassword(currentPassword, newPassword);

    this.loading.set(false);

    if (result) {
      this.success.set(true);
      this.form().reset();
      this.formModel.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Navigate to home after a brief delay
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 2000);
    } else {
      this.error.set(true);
    }
  }
}
