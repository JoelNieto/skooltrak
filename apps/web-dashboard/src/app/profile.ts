import { Loader, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from './auth/auth';
import { ThemePreference, ThemeService } from './core/theme.service';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  image: string;
  themePreference: ThemePreference;
}

@Component({
  selector: 'app-profile',
  imports: [FormField, RouterLink, Loader],
  template: `
    <div class="flex flex-col gap-6">
      <div class="breadcrumbs text-sm">
        <ul>
          <li><a routerLink="/">Inicio</a></li>
          <li>Mi perfil</li>
        </ul>
      </div>

      @if (auth.isUserLoading()) {
        <lib-loader />
      } @else if (!auth.user()) {
        <div class="alert alert-warning">
          <span class="material-symbols-outlined">warning</span>
          <span>No se pudo cargar la información de tu perfil.</span>
        </div>
      } @else {
        <div class="sm:grid sm:grid-cols-3 sm:gap-6">
          <!-- Summary card -->
          <div class="sm:col-span-1">
            <div class="card card-border border-base-300 bg-base-100">
              <div class="card-body items-center text-center gap-3">
                @if (auth.user()?.image) {
                  <div class="avatar">
                    <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img [src]="auth.user()?.image" [alt]="auth.userInitials()" />
                    </div>
                  </div>
                } @else {
                  <div
                    class="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white"
                    [style.background-color]="auth.user()?.color || '#64748b'"
                  >
                    {{ auth.userInitials() }}
                  </div>
                }
                <h2 class="card-title">{{ auth.userName() }}</h2>
                <p class="text-sm text-base-content/70">{{ auth.user()?.email }}</p>
                @if (roleLabel()) {
                  <span class="badge badge-primary">{{ roleLabel() }}</span>
                }
                @if (auth.user()?.organization?.name) {
                  <p class="text-xs text-base-content/60">{{ auth.user()?.organization?.name }}</p>
                }
                @if (auth.user()?.emailVerified) {
                  <span class="badge badge-success badge-sm gap-1">
                    <span class="material-symbols-outlined text-sm">verified</span>
                    Verificado
                  </span>
                } @else {
                  <span class="badge badge-warning badge-sm">Correo sin verificar</span>
                }
              </div>
            </div>
          </div>

          <!-- Edit form -->
          <div class="sm:col-span-2">
            <div class="card card-border border-base-300 bg-base-100">
              <div class="card-body gap-6">
                <div>
                  <h2 class="text-lg/7 font-semibold text-base-content">Información personal</h2>
                  <p class="mt-1 text-sm text-base-content/70">Actualiza tus datos de perfil.</p>
                </div>

                @if (saved()) {
                  <div class="alert alert-success">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>Perfil actualizado exitosamente.</span>
                  </div>
                }

                @if (errorMessage()) {
                  <div class="alert alert-error">
                    <span class="material-symbols-outlined">error</span>
                    <span>{{ errorMessage() }}</span>
                  </div>
                }

                <form (submit)="onSubmit($event)" novalidate="novalidate" class="space-y-4">
                  <div class="sm:grid sm:grid-cols-2 sm:gap-4">
                    <div class="fieldset">
                      <label for="firstName">Nombres</label>
                      <input
                        id="firstName"
                        type="text"
                        [formField]="profileForm.firstName"
                        class="input input-primary w-full"
                        [class.ng-invalid]="profileForm.firstName().touched() && profileForm.firstName().invalid()"
                      />
                      @if (profileForm.firstName().touched() && profileForm.firstName().invalid()) {
                        @for (error of profileForm.firstName().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
                      }
                    </div>
                    <div class="fieldset">
                      <label for="lastName">Apellidos</label>
                      <input
                        id="lastName"
                        type="text"
                        [formField]="profileForm.lastName"
                        class="input input-primary w-full"
                        [class.ng-invalid]="profileForm.lastName().touched() && profileForm.lastName().invalid()"
                      />
                      @if (profileForm.lastName().touched() && profileForm.lastName().invalid()) {
                        @for (error of profileForm.lastName().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
                      }
                    </div>
                  </div>

                  <div class="fieldset">
                    <label for="email">Correo electrónico</label>
                    <input id="email" type="email" class="input w-full" [value]="auth.user()?.email" disabled />
                    <p class="text-base-content/50 text-xs">El correo electrónico no se puede cambiar.</p>
                  </div>

                  <div class="fieldset">
                    <label for="image">URL de la foto de perfil</label>
                    <input
                      id="image"
                      type="text"
                      [formField]="profileForm.image"
                      class="input input-primary w-full"
                      placeholder="https://..."
                    />
                  </div>

                  <div class="fieldset">
                    <label>Tema de la interfaz</label>
                    <div class="join">
                      @for (option of themeOptions; track option.value) {
                        <button
                          type="button"
                          class="btn join-item"
                          [class.btn-primary]="profileForm.themePreference().value() === option.value"
                          (click)="setTheme(option.value)"
                        >
                          <span class="material-symbols-outlined">{{ option.icon }}</span>
                          {{ option.label }}
                        </button>
                      }
                    </div>
                  </div>

                  <div class="flex justify-end gap-3 pt-2">
                    <a routerLink="/home" class="btn btn-ghost">Cancelar</a>
                    <button type="submit" class="btn btn-primary" [disabled]="isSaving() || profileForm().invalid()">
                      @if (isSaving()) {
                        <span class="loading loading-spinner loading-sm"></span>
                      }
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export default class Profile {
  public auth = inject(Auth);
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private themeService = inject(ThemeService);

  public isSaving = signal(false);
  public saved = signal(false);
  public errorMessage = signal('');

  public themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'light_mode' },
    { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
    { value: 'system', label: 'Sistema', icon: 'settings_brightness' },
  ];

  public roleLabel = computed(() => {
    const role = this.auth.role();
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      ORG_ADMIN: 'Administrador de organización',
      TEACHER: 'Docente',
      STUDENT: 'Estudiante',
      PARENT: 'Apoderado',
    };
    return role ? (labels[role] ?? role) : '';
  });

  #profileModel = signal<ProfileFormData>({
    firstName: '',
    lastName: '',
    image: '',
    themePreference: 'system',
  });

  public profileForm = form(this.#profileModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Los nombres son requeridos' });
    required(schemaPath.lastName, { message: 'Los apellidos son requeridos' });
  });

  constructor() {
    afterRenderEffect(() => {
      const user = this.auth.user();
      if (user) {
        this.#profileModel.set({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          image: user.image ?? '',
          themePreference: (user.themePreference as ThemePreference) || 'system',
        });
      }
    });
  }

  setTheme(value: ThemePreference) {
    this.#profileModel.update((m) => ({ ...m, themePreference: value }));
    void this.themeService.setTheme(value);
  }

  onSubmit(event: Event) {
    event.preventDefault();

    this.profileForm.firstName().markAsTouched();
    this.profileForm.lastName().markAsTouched();

    submit(this.profileForm, async () => {
      const user = this.auth.user();
      if (!user?.id) return;

      this.isSaving.set(true);
      this.saved.set(false);
      this.errorMessage.set('');

      const formValue = this.profileForm().value();

      try {
        await firstValueFrom(
          this.http.patch('/api/v1/users', {
            id: user.id,
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            image: formValue.image || null,
            themePreference: formValue.themePreference,
          }),
        );
        await this.auth.reloadUser();
        this.saved.set(true);
        this.toasts.showSuccess('Perfil actualizado exitosamente');
      } catch (err: unknown) {
        const httpErr = err as { error?: { message?: string }; message?: string };
        const msg = httpErr?.error?.message ?? httpErr?.message ?? 'No se pudo actualizar el perfil';
        this.errorMessage.set(msg);
        this.toasts.showError(msg);
      } finally {
        this.isSaving.set(false);
      }
    });
  }
}
