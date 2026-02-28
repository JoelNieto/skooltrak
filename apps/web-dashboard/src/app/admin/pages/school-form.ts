import { Loader, Toast } from '@/ui';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { firstValueFrom, map, of } from 'rxjs';

interface SchoolFormData {
  name: string;
  shortName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  logo: string;
}

@Component({
  selector: 'app-school-form',
  imports: [FormField, RouterLink, Loader, ImageCropperComponent],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/admin">Admin</a></li>
        <li><a routerLink="/admin/schools">Colegios</a></li>
        @if (isEditMode()) {
          <li>
            <a [routerLink]="['/schools', id()]">{{ schoolResource.value()?.name }}</a>
          </li>
          <li>Editar</li>
        } @else {
          <li>Nuevo</li>
        }
      </ul>
    </div>

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode() ? 'Editar Colegio' : 'Nuevo Colegio' }}
      </h1>
    </div>

    @if (isEditMode() && schoolResource.isLoading()) {
      <lib-loader />
    } @else {
      <form (submit)="onSubmit($event)" novalidate="novalidate">
        <div class="flex flex-col gap-6 divide-y divide-base-300">
          <!-- Logo Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Logo</h2>
              <p class="mt-1 text-sm text-base-content/70">Logo del colegio.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="flex flex-col sm:flex-row gap-6 items-start">
                    <!-- Logo Preview -->
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="w-32 min-h-16 max-h-48 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center overflow-hidden bg-base-200"
                      >
                        @if (isUploadingLogo()) {
                          <span class="loading loading-spinner loading-lg text-primary"></span>
                        } @else if (logoPreviewUrl() || logoDownloadUrl()) {
                          <img
                            [src]="logoPreviewUrl() || logoDownloadUrl()"
                            alt="Logo preview"
                            class="w-full h-auto object-contain"
                          />
                        } @else {
                          <span class="material-symbols-outlined text-5xl text-base-content/30">school</span>
                        }
                      </div>
                      @if ((logoPreviewUrl() || logoDownloadUrl() || schoolForm.logo().value()) && !isUploadingLogo()) {
                        <button type="button" class="btn btn-ghost btn-xs text-error" (click)="removeLogo()">
                          <span class="material-symbols-outlined text-sm">delete</span>
                          Eliminar
                        </button>
                      }
                    </div>

                    <!-- Upload Controls -->
                    <div class="flex-1">
                      <input type="file" #fileInput class="hidden" accept="image/*" (change)="onFileSelected($event)" />
                      <button
                        type="button"
                        class="btn btn-outline btn-primary"
                        (click)="fileInput.click()"
                        [disabled]="isUploadingLogo()"
                      >
                        <span class="material-symbols-outlined">upload</span>
                        {{ schoolForm.logo().value() || logoPreviewUrl() ? 'Cambiar imagen' : 'Subir imagen' }}
                      </button>
                      <p class="text-sm text-base-content/50 mt-2">PNG, JPG o GIF. Máximo 5MB.</p>
                    </div>
                  </div>

                  <!-- Image Cropper Modal -->
                  @if (showCropper()) {
                    <div class="mt-4 p-4 bg-base-200 rounded-lg">
                      <h3 class="font-medium mb-3">Recortar imagen</h3>
                      <p class="text-sm text-base-content/60 mb-4">
                        Arrastra las esquinas para ajustar el área de recorte.
                      </p>
                      <div class="flex flex-col lg:flex-row gap-6">
                        <!-- Cropper Area -->
                        <div class="flex-1 min-w-0">
                          <image-cropper
                            [imageChangedEvent]="imageChangedEvent()"
                            [maintainAspectRatio]="false"
                            [resizeToWidth]="512"
                            [roundCropper]="false"
                            format="png"
                            (imageCropped)="onImageCropped($event)"
                            (loadImageFailed)="onLoadImageFailed()"
                          />
                        </div>
                        <!-- Preview Area -->
                        <div class="flex flex-col items-center gap-3 lg:w-48">
                          <span class="text-sm font-medium text-base-content/70">Vista previa</span>
                          <div
                            class="w-32 min-h-16 max-h-48 rounded-lg border-2 border-base-300 flex items-center justify-center overflow-hidden bg-base-100"
                          >
                            @if (cropPreviewUrl()) {
                              <img [src]="cropPreviewUrl()" alt="Preview" class="w-full h-auto object-contain" />
                            } @else {
                              <span class="material-symbols-outlined text-4xl text-base-content/20">crop</span>
                            }
                          </div>
                        </div>
                      </div>
                      <div class="flex justify-end gap-2 mt-4">
                        <button type="button" class="btn btn-ghost" (click)="cancelCrop()">Cancelar</button>
                        <button
                          type="button"
                          class="btn btn-primary"
                          (click)="applyCrop()"
                          [disabled]="!cropPreviewUrl()"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Basic Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Información Básica</h2>
              <p class="mt-1 text-sm text-base-content/70">Datos principales del colegio.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-4">
                      <label for="name">Nombre del colegio</label>
                      <input
                        id="name"
                        type="text"
                        [formField]="schoolForm.name"
                        class="input input-primary w-full"
                        [class.ng-dirty]="schoolForm.name().dirty()"
                        [class.ng-invalid]="schoolForm.name().invalid()"
                      />
                      @if (schoolForm.name().dirty() && schoolForm.name().invalid()) {
                        <ul>
                          @for (error of schoolForm.name().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="shortName">Abreviatura</label>
                      <input
                        id="shortName"
                        type="text"
                        [formField]="schoolForm.shortName"
                        class="input input-primary w-full"
                        [class.ng-dirty]="schoolForm.shortName().dirty()"
                        [class.ng-invalid]="schoolForm.shortName().invalid()"
                      />
                      @if (schoolForm.shortName().dirty() && schoolForm.shortName().invalid()) {
                        <ul>
                          @for (error of schoolForm.shortName().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Contacto</h2>
              <p class="mt-1 text-sm text-base-content/70">Información de contacto del colegio.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-3">
                      <label for="email">
                        Correo electrónico
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        [formField]="schoolForm.email"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="phone">
                        Teléfono
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input id="phone" type="tel" [formField]="schoolForm.phone" class="input input-primary w-full" />
                    </div>
                    <div class="fieldset col-span-6">
                      <label for="website">
                        Sitio Web
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="website"
                        type="url"
                        [formField]="schoolForm.website"
                        class="input input-primary w-full"
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Address Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Ubicación</h2>
              <p class="mt-1 text-sm text-base-content/70">Dirección física del colegio.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-6">
                      <label for="address">
                        Dirección
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="address"
                        type="text"
                        [formField]="schoolForm.address"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="city">
                        Ciudad
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input id="city" type="text" [formField]="schoolForm.city" class="input input-primary w-full" />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="state">
                        Estado/Provincia
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input id="state" type="text" [formField]="schoolForm.state" class="input input-primary w-full" />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="zip">
                        Código Postal
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input id="zip" type="text" [formField]="schoolForm.zip" class="input input-primary w-full" />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="country">
                        País
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="country"
                        type="text"
                        [formField]="schoolForm.country"
                        class="input input-primary w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 my-6 pt-6 border-t border-base-300">
          <a [routerLink]="isEditMode() ? ['/schools', id()] : ['/admin/schools']" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="isSaving() || isUploadingLogo()">
            @if (isSaving()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            {{ isEditMode() ? 'Guardar cambios' : 'Crear colegio' }}
          </button>
        </div>
      </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SchoolForm {
  public id = input<string>();

  private apollo = inject(Apollo);
  private router = inject(Router);
  private toasts = inject(Toast);

  public isEditMode = computed(() => !!this.id());
  public isSaving = signal(false);

  // Image cropper state
  public imageChangedEvent = signal<Event | null>(null);
  public showCropper = signal(false);
  public isUploadingLogo = signal(false);
  public logoPreviewUrl = signal<string>('');
  public logoDownloadUrl = signal<string>('');
  public cropPreviewUrl = signal<string>('');
  private tempCroppedBlob = signal<Blob | null>(null);
  private pendingStorageKey = signal<string>('');

  fileInput = viewChild<HTMLInputElement>('fileInput');

  #schoolModel = signal<SchoolFormData>({
    name: '',
    shortName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    website: '',
    logo: '',
  });

  public schoolForm = form(this.#schoolModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es requerido' });
    required(schemaPath.shortName, { message: 'Abreviatura es requerida' });
  });

  public schoolResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      if (!params.id) {
        return of(null);
      }
      return this.apollo
        .watchQuery<{ school: Prisma.SchoolGetPayload<false> }>({
          query: gql`
            query School($id: String!) {
              school(id: $id) {
                id
                name
                shortName
                email
                phone
                address
                city
                state
                zip
                country
                website
                logo
                logoUrl
              }
            }
          `,
          variables: { id: params.id },
        })
        .valueChanges.pipe(map((result) => result.data?.school));
    },
  });

  constructor() {
    afterRenderEffect(() => {
      const school = this.schoolResource.value();
      if (school) {
        this.#schoolModel.set({
          name: school.name ?? '',
          shortName: school.shortName ?? '',
          email: school.email ?? '',
          phone: school.phone ?? '',
          address: school.address ?? '',
          city: school.city ?? '',
          state: school.state ?? '',
          zip: school.zip ?? '',
          country: school.country ?? '',
          website: school.website ?? '',
          logo: school.logo ?? '',
        });

        // Set logo download URL if available
        if ((school as any).logoUrl) {
          this.logoDownloadUrl.set((school as any).logoUrl);
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.toasts.showError('La imagen no puede superar los 5MB');
        return;
      }
      this.imageChangedEvent.set(event);
      this.showCropper.set(true);
    }
  }

  onImageCropped(event: ImageCroppedEvent): void {
    if (event.blob) {
      this.tempCroppedBlob.set(event.blob);
      // Create a preview URL for the live preview
      const previousUrl = this.cropPreviewUrl();
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      this.cropPreviewUrl.set(URL.createObjectURL(event.blob));
    }
  }

  onLoadImageFailed(): void {
    this.toasts.showError('Error al cargar la imagen');
    this.cancelCrop();
  }

  async applyCrop(): Promise<void> {
    const blob = this.tempCroppedBlob();
    if (!blob) {
      this.toasts.showError('No se pudo procesar la imagen');
      return;
    }

    this.showCropper.set(false);
    this.imageChangedEvent.set(null);

    // Clean up crop preview URL
    const cropPreview = this.cropPreviewUrl();
    if (cropPreview) {
      URL.revokeObjectURL(cropPreview);
    }
    this.cropPreviewUrl.set('');

    // For new schools, we need to save the school first before uploading
    // For existing schools, upload immediately
    if (this.isEditMode()) {
      await this.uploadLogo(blob);
    } else {
      // For new schools, create a local preview and store the blob
      const previewUrl = URL.createObjectURL(blob);
      this.logoPreviewUrl.set(previewUrl);
      // Store the blob for later upload after school creation
      this.tempCroppedBlob.set(blob);
    }
  }

  private async uploadLogo(blob: Blob): Promise<void> {
    const schoolId = this.id();
    if (!schoolId) {
      return;
    }

    this.isUploadingLogo.set(true);

    try {
      // Step 1: Get presigned upload URL
      const uploadResult = await firstValueFrom(
        this.apollo.mutate<{
          createSchoolLogoUploadUrl: { uploadUrl: string; storageKey: string };
        }>({
          mutation: gql`
            mutation CreateSchoolLogoUploadUrl($input: SchoolLogoUploadInput!) {
              createSchoolLogoUploadUrl(input: $input) {
                uploadUrl
                storageKey
              }
            }
          `,
          variables: {
            input: {
              schoolId,
              mimeType: 'image/png',
            },
          },
        }),
      );

      const { uploadUrl, storageKey } = uploadResult.data!.createSchoolLogoUploadUrl;

      // Step 2: Upload to S3
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
        },
        body: blob,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo to storage');
      }

      // Step 3: Update school with storage key
      await firstValueFrom(
        this.apollo.mutate({
          mutation: gql`
            mutation UpdateSchoolLogo($id: String!, $logo: String!) {
              updateSchoolLogo(id: $id, logo: $logo) {
                id
                logo
              }
            }
          `,
          variables: {
            id: schoolId,
            logo: storageKey,
          },
        }),
      );

      // Update form model
      this.#schoolModel.update((model) => ({ ...model, logo: storageKey }));
      this.pendingStorageKey.set(storageKey);

      // Fetch the new download URL
      const result = await firstValueFrom(
        this.apollo.query<{ schoolLogoDownloadUrl: { downloadUrl: string } }>({
          query: gql`
            query SchoolLogoDownloadUrl($schoolId: String!) {
              schoolLogoDownloadUrl(schoolId: $schoolId) {
                downloadUrl
              }
            }
          `,
          variables: { schoolId },
          fetchPolicy: 'network-only',
        }),
      );
      this.logoDownloadUrl.set(result.data?.schoolLogoDownloadUrl?.downloadUrl ?? '');

      this.toasts.showSuccess('Logo actualizado correctamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.toasts.showError('Error al subir el logo');
    } finally {
      this.isUploadingLogo.set(false);
      this.tempCroppedBlob.set(null);
    }
  }

  cancelCrop(): void {
    this.showCropper.set(false);
    this.imageChangedEvent.set(null);
    this.tempCroppedBlob.set(null);
    // Clean up preview URL
    const previewUrl = this.cropPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    this.cropPreviewUrl.set('');
  }

  removeLogo(): void {
    this.logoPreviewUrl.set('');
    this.logoDownloadUrl.set('');
    this.pendingStorageKey.set('');
    this.tempCroppedBlob.set(null);
    this.#schoolModel.update((model) => ({ ...model, logo: '' }));
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Mark required fields as dirty for validation display
    this.schoolForm.name().markAsDirty();
    this.schoolForm.shortName().markAsDirty();

    submit(this.schoolForm, async () => {
      this.isSaving.set(true);
      const formValue = this.schoolForm().value();

      try {
        if (this.isEditMode()) {
          await firstValueFrom(
            this.apollo.mutate({
              mutation: gql`
                mutation UpdateSchool($updateSchoolInput: UpdateSchoolInput!) {
                  updateSchool(updateSchoolInput: $updateSchoolInput) {
                    id
                  }
                }
              `,
              variables: {
                updateSchoolInput: {
                  ...formValue,
                  id: this.id(),
                },
              },
            }),
          );
          this.toasts.showSuccess('Colegio actualizado exitosamente');
          this.router.navigate(['/schools', this.id()]);
        } else {
          // Create the school first
          const createResult = await firstValueFrom(
            this.apollo.mutate<{ createSchool: { id: string } }>({
              mutation: gql`
                mutation CreateSchool($createSchoolInput: CreateSchoolInput!) {
                  createSchool(createSchoolInput: $createSchoolInput) {
                    id
                  }
                }
              `,
              variables: {
                createSchoolInput: {
                  ...formValue,
                  logo: '', // Start with empty logo
                },
              },
            }),
          );

          const newSchoolId = createResult.data!.createSchool.id;

          // If there's a pending logo to upload, do it now
          const pendingBlob = this.tempCroppedBlob();
          if (pendingBlob) {
            // Get presigned URL and upload
            const uploadResult = await firstValueFrom(
              this.apollo.mutate<{
                createSchoolLogoUploadUrl: { uploadUrl: string; storageKey: string };
              }>({
                mutation: gql`
                  mutation CreateSchoolLogoUploadUrl($input: SchoolLogoUploadInput!) {
                    createSchoolLogoUploadUrl(input: $input) {
                      uploadUrl
                      storageKey
                    }
                  }
                `,
                variables: {
                  input: {
                    schoolId: newSchoolId,
                    mimeType: 'image/png',
                  },
                },
              }),
            );

            const { uploadUrl, storageKey } = uploadResult.data!.createSchoolLogoUploadUrl;

            // Upload to S3
            const response = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'image/png',
              },
              body: pendingBlob,
            });

            if (response.ok) {
              // Update school with storage key
              await firstValueFrom(
                this.apollo.mutate({
                  mutation: gql`
                    mutation UpdateSchoolLogo($id: String!, $logo: String!) {
                      updateSchoolLogo(id: $id, logo: $logo) {
                        id
                        logo
                      }
                    }
                  `,
                  variables: {
                    id: newSchoolId,
                    logo: storageKey,
                  },
                }),
              );
            }
          }

          this.toasts.showSuccess('Colegio creado exitosamente');
          this.router.navigate(['/schools', newSchoolId]);
        }
      } catch (error: any) {
        console.error('Save school error:', error);
        const message = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al guardar el colegio';
        this.toasts.showError(message);
      } finally {
        this.isSaving.set(false);
      }
    });
  }
}
