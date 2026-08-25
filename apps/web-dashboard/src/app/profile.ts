import { Loader, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
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
  imports: [FormField, RouterLink, Loader, ImageCropperComponent],
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
                @if (avatarUrl()) {
                  <div class="avatar">
                    <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img [src]="avatarUrl()" [alt]="auth.userInitials()" />
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
                    <label for="avatarFileInput">Foto de perfil</label>
                    <div class="flex flex-col sm:flex-row gap-4 items-start">
                      <div class="flex flex-col items-center gap-3">
                        <div
                          class="w-24 h-24 rounded-full border-2 border-dashed border-base-300 flex items-center justify-center overflow-hidden bg-base-200"
                        >
                          @if (isUploadingAvatar()) {
                            <span class="loading loading-spinner loading-lg text-primary"></span>
                          } @else if (avatarUrl()) {
                            <img [src]="avatarUrl()" alt="Avatar" class="w-full h-full object-cover" />
                          } @else {
                            <span class="material-symbols-outlined text-4xl text-base-content/30">person</span>
                          }
                        </div>
                        @if (avatarUrl() && !isUploadingAvatar()) {
                          <button type="button" class="btn btn-ghost btn-xs text-error" (click)="removeAvatar()">
                            <span class="material-symbols-outlined text-sm">delete</span>
                            Eliminar
                          </button>
                        }
                      </div>
                      <div class="flex-1">
                        <input
                          type="file"
                          id="avatarFileInput"
                          #avatarFileInput
                          class="hidden"
                          accept="image/png,image/jpeg,image/webp"
                          (change)="onAvatarFileSelected($event)"
                        />
                        <button
                          type="button"
                          class="btn btn-outline btn-primary"
                          (click)="avatarFileInput.click()"
                          [disabled]="isUploadingAvatar()"
                        >
                          <span class="material-symbols-outlined">upload</span>
                          {{ avatarUrl() ? 'Cambiar foto' : 'Subir foto' }}
                        </button>
                        <p class="text-sm text-base-content/50 mt-2">PNG, JPG o WEBP. Proporción 1:1. Máximo 5MB.</p>
                      </div>
                    </div>

                    @if (showAvatarCropper()) {
                      <div class="mt-4 p-4 bg-base-200 rounded-lg">
                        <h3 class="font-medium mb-3">Recortar imagen</h3>
                        <p class="text-sm text-base-content/60 mb-4">
                          Ajusta el área de recorte. La imagen debe ser cuadrada (1:1).
                        </p>
                        <div class="flex flex-col lg:flex-row gap-6">
                          <div class="flex-1 min-w-0">
                            <image-cropper
                              [imageChangedEvent]="avatarChangedEvent()"
                              [aspectRatio]="1"
                              [resizeToWidth]="512"
                              [roundCropper]="false"
                              format="png"
                              (imageCropped)="onAvatarCropped($event)"
                              (loadImageFailed)="onAvatarLoadFailed()"
                            />
                          </div>
                          <div class="flex flex-col items-center gap-3 lg:w-48">
                            <span class="text-sm font-medium text-base-content/70">Vista previa</span>
                            <div
                              class="w-32 h-32 rounded-full border-2 border-base-300 flex items-center justify-center overflow-hidden bg-base-100"
                            >
                              @if (avatarCropPreviewUrl()) {
                                <img [src]="avatarCropPreviewUrl()" alt="Preview" class="w-full h-full object-cover" />
                              } @else {
                                <span class="material-symbols-outlined text-4xl text-base-content/20">crop</span>
                              }
                            </div>
                          </div>
                        </div>
                        <div class="flex justify-end gap-2 mt-4">
                          <button type="button" class="btn btn-ghost" (click)="cancelAvatarCrop()">Cancelar</button>
                          <button
                            type="button"
                            class="btn btn-primary"
                            (click)="applyAvatarCrop()"
                            [disabled]="!avatarCropPreviewUrl() || isUploadingAvatar()"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="fieldset">
                    <span class="label">Tema de la interfaz</span>
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

  // Avatar state
  public avatarUrl = signal<string | null>(null);
  public isUploadingAvatar = signal(false);
  public showAvatarCropper = signal(false);
  public avatarChangedEvent = signal<Event | null>(null);
  public avatarCropPreviewUrl = signal<string>('');
  private avatarCroppedBlob = signal<Blob | null>(null);
  private lastResolvedImage = signal<string | null>(null);

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
      this.resolveAvatar();
    });
  }

  private resolveAvatar() {
    const user = this.auth.user();
    const image = user?.image ?? '';

    if (this.lastResolvedImage() === image) {
      return;
    }
    this.lastResolvedImage.set(image);

    if (!image) {
      this.avatarUrl.set(null);
      return;
    }
    if (image.startsWith('http')) {
      this.avatarUrl.set(image);
      return;
    }

    const userId = user?.id;
    if (!userId) {
      this.avatarUrl.set(null);
      return;
    }

    firstValueFrom(this.http.get<{ url: string | null }>(`/api/v1/users/${userId}/presigned-avatar-url`))
      .then((r) => this.avatarUrl.set(r.url))
      .catch(() => this.avatarUrl.set(null));
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toasts.showError('La imagen no puede superar los 5MB');
        return;
      }
      this.avatarChangedEvent.set(event);
      this.showAvatarCropper.set(true);
    }
  }

  onAvatarCropped(event: ImageCroppedEvent): void {
    if (event.blob) {
      this.avatarCroppedBlob.set(event.blob);
      const previousUrl = this.avatarCropPreviewUrl();
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      this.avatarCropPreviewUrl.set(URL.createObjectURL(event.blob));
    }
  }

  onAvatarLoadFailed(): void {
    this.toasts.showError('Error al cargar la imagen');
    this.cancelAvatarCrop();
  }

  cancelAvatarCrop(): void {
    this.showAvatarCropper.set(false);
    this.avatarChangedEvent.set(null);
    this.avatarCroppedBlob.set(null);
    const previewUrl = this.avatarCropPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    this.avatarCropPreviewUrl.set('');
  }

  async applyAvatarCrop(): Promise<void> {
    const blob = this.avatarCroppedBlob();
    if (!blob) {
      this.toasts.showError('No se pudo procesar la imagen');
      return;
    }

    this.showAvatarCropper.set(false);
    this.avatarChangedEvent.set(null);
    const cropPreview = this.avatarCropPreviewUrl();
    if (cropPreview) {
      URL.revokeObjectURL(cropPreview);
    }
    this.avatarCropPreviewUrl.set('');

    await this.uploadAvatar(blob);
  }

  private async uploadAvatar(blob: Blob): Promise<void> {
    const user = this.auth.user();
    if (!user?.id) {
      return;
    }

    this.isUploadingAvatar.set(true);

    try {
      const { uploadUrl, storageKey } = await firstValueFrom(
        this.http.post<{ uploadUrl: string; storageKey: string }>('/api/v1/users/avatar-upload-url', {
          userId: user.id,
          mimeType: 'image/png',
        }),
      );

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      await firstValueFrom(this.http.patch(`/api/v1/users/${user.id}/avatar`, { image: storageKey }));

      this.#profileModel.update((m) => ({ ...m, image: storageKey }));
      await this.auth.reloadUser();
      this.toasts.showSuccess('Foto de perfil actualizada');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      this.toasts.showError('Error al subir la imagen');
    } finally {
      this.isUploadingAvatar.set(false);
      this.avatarCroppedBlob.set(null);
    }
  }

  async removeAvatar(): Promise<void> {
    const user = this.auth.user();
    if (!user?.id) {
      return;
    }

    this.isUploadingAvatar.set(true);
    try {
      await firstValueFrom(this.http.patch(`/api/v1/users/${user.id}/avatar`, { image: '' }));
      this.#profileModel.update((m) => ({ ...m, image: '' }));
      await this.auth.reloadUser();
      this.toasts.showSuccess('Foto de perfil eliminada');
    } catch (error) {
      console.error('Error removing avatar:', error);
      this.toasts.showError('Error al eliminar la imagen');
    } finally {
      this.isUploadingAvatar.set(false);
    }
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
