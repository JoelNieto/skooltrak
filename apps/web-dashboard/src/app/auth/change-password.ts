import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Auth from './auth';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex flex-col gap-6">
      <div class="breadcrumbs text-sm">
        <ul>
          <li><a routerLink="/">Inicio</a></li>
          <li>Cambiar contraseña</li>
        </ul>
      </div>

      <div class="bg-base-100 rounded-lg border border-base-300 p-6 max-w-xl w-full">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-base-content">Cambiar contraseña</h2>
          <p class="text-sm text-base-content/70">
            Ingresa tu contraseña actual y define una nueva contraseña.
          </p>
        </div>

        @if (success()) {
          <div class="alert alert-success mb-4">
            <span class="material-symbols-outlined">check_circle</span>
            <span>Contraseña cambiada exitosamente.</span>
          </div>
        }

        @if (error()) {
          <div class="alert alert-error mb-4">
            <span class="material-symbols-outlined">error</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="fieldset">
            <label for="currentPassword">Contraseña actual</label>
            <input
              id="currentPassword"
              formControlName="currentPassword"
              type="password"
              autocomplete="current-password"
              class="input input-primary w-full"
              placeholder="••••••••"
            />
          </div>
          <div class="fieldset">
            <label for="newPassword">Nueva contraseña</label>
            <input
              id="newPassword"
              formControlName="newPassword"
              type="password"
              autocomplete="new-password"
              class="input input-primary w-full"
              placeholder="Mínimo 8 caracteres"
            />
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
          </div>

          @if (passwordMismatch()) {
            <p class="text-error text-sm">Las contraseñas no coinciden.</p>
          }

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <a routerLink="/home" class="btn btn-outline w-full sm:w-auto">
              Cancelar
            </a>
            <button
              type="submit"
              [disabled]="loading() || form.invalid || passwordMismatch()"
              class="btn btn-primary w-full sm:w-auto"
            >
              @if (loading()) {
                <span class="loading loading-spinner loading-sm"></span>
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
  passwordMismatch = signal(false);

  form = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  constructor() {
    // Watch for password mismatch
    this.form.valueChanges.subscribe(() => {
      const { newPassword, confirmPassword } = this.form.value;
      this.passwordMismatch.set(
        !!newPassword && !!confirmPassword && newPassword !== confirmPassword
      );
      // Clear success/error when form changes
      if (this.success() || this.error()) {
        this.success.set(false);
        this.error.set(false);
      }
    });
  }

  async onSubmit() {
    if (this.form.invalid || this.passwordMismatch()) return;

    this.loading.set(true);
    this.error.set(false);
    this.success.set(false);

    const { currentPassword, newPassword } = this.form.getRawValue();
    if (!currentPassword || !newPassword) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    const result = await this.auth.changePassword(currentPassword, newPassword);

    this.loading.set(false);

    if (result) {
      this.success.set(true);
      this.form.reset();
      // Navigate to home after a brief delay
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 2000);
    } else {
      this.error.set(true);
    }
  }
}
