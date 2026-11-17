import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  Loader,
  Spinner,
  Toast,
  UiField,
  UiInput,
  UiSelect,
} from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { firstValueFrom, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import { isValidId } from '../../core/validators';

interface SchoolFromApi {
  name: string | null;
  shortName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  website: string | null;
  logo: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  tertiaryColor?: string | null;
  schoolYearStartMonth?: number | null;
}

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
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  schoolYearStartMonth: number;
}

@Component({
  selector: 'app-school-form',
  imports: [
    Spinner,
    Breadcrumbs,
    Card,
    CardBody,
    UiField,
    UiInput,
    UiSelect,
    Button,
    FormField,
    RouterLink,
    Loader,
    ImageCropperComponent,
    FormsModule,
  ],
  template: `
    <ui-breadcrumbs [items]="breadcrumbs()" />

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
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="flex flex-col sm:flex-row gap-6 items-start">
                    <!-- Logo Preview -->
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="w-32 min-h-16 max-h-48 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center overflow-hidden bg-base-200"
                      >
                        @if (isUploadingLogo()) {
                          <span uiSpinner size="lg" class="text-primary"></span>
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
                        <button
                          uiButton
                          variant="ghost"
                          size="sm"
                          type="button"
                          class="text-error"
                          (click)="removeLogo()"
                        >
                          <span class="material-symbols-outlined text-sm">delete</span>
                          Eliminar
                        </button>
                      }
                    </div>

                    <!-- Upload Controls -->
                    <div class="flex-1">
                      <input type="file" #fileInput class="hidden" accept="image/*" (change)="onFileSelected($event)" />
                      <button uiButton type="button" (click)="fileInput.click()" [disabled]="isUploadingLogo()">
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
                        <button uiButton variant="ghost" type="button" (click)="cancelCrop()">Cancelar</button>
                        <button
                          uiButton
                          variant="primary"
                          type="button"
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
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Nombre del colegio" [field]="schoolForm.name" class="col-span-4">
                      <input uiInput id="name" type="text" [formField]="schoolForm.name" />
                    </ui-field>
                    <ui-field label="Abreviatura" [field]="schoolForm.shortName" class="col-span-2">
                      <input uiInput id="shortName" type="text" [formField]="schoolForm.shortName" />
                    </ui-field>
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
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Correo electrónico" [field]="schoolForm.email" optional class="col-span-3">
                      <input uiInput id="email" type="email" [formField]="schoolForm.email" />
                    </ui-field>
                    <ui-field label="Teléfono" [field]="schoolForm.phone" optional class="col-span-3">
                      <input uiInput id="phone" type="tel" [formField]="schoolForm.phone" />
                    </ui-field>
                    <ui-field label="Sitio Web" [field]="schoolForm.website" optional class="col-span-6">
                      <input uiInput id="website" type="url" [formField]="schoolForm.website" placeholder="https://" />
                    </ui-field>
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
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Dirección" [field]="schoolForm.address" optional class="col-span-6">
                      <input uiInput id="address" type="text" [formField]="schoolForm.address" />
                    </ui-field>
                    <ui-field label="Ciudad" [field]="schoolForm.city" optional class="col-span-3">
                      <input uiInput id="city" type="text" [formField]="schoolForm.city" />
                    </ui-field>
                    <ui-field label="Estado/Provincia" [field]="schoolForm.state" optional class="col-span-3">
                      <input uiInput id="state" type="text" [formField]="schoolForm.state" />
                    </ui-field>
                    <ui-field label="Código Postal" [field]="schoolForm.zip" optional class="col-span-3">
                      <input uiInput id="zip" type="text" [formField]="schoolForm.zip" />
                    </ui-field>
                    <ui-field label="País" [field]="schoolForm.country" optional class="col-span-3">
                      <input uiInput id="country" type="text" [formField]="schoolForm.country" />
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Configuration Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Configuración académica</h2>
              <p class="mt-1 text-sm text-base-content/70">
                Mes en que inicia el año escolar. Se usa para generar los cargos de colegiatura.
              </p>
            </div>
            <div class="sm:col-span-3">
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Inicio del año escolar" class="col-span-3">
                      <select
                        uiSelect
                        id="schoolYearStartMonth"
                        [ngModelOptions]="{ standalone: true }"
                        [ngModel]="schoolForm.schoolYearStartMonth().value()"
                        (ngModelChange)="onSchoolYearStartMonthChange($event)"
                      >
                        @for (m of schoolYearMonths; track m.value) {
                          <option [value]="m.value">{{ m.label }}</option>
                        }
                      </select>
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Theme / Colors Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Tema / Colores</h2>
              <p class="mt-1 text-sm text-base-content/70">
                Colores de marca del colegio. Se aplican en toda la aplicación cuando este colegio está seleccionado.
              </p>
            </div>
            <div class="sm:col-span-3">
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-2">
                      <label for="primaryColor">
                        Color primario
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <div class="flex gap-2 items-center">
                        <input
                          type="color"
                          [value]="schoolForm.primaryColor().value() || '#3b82f6'"
                          (input)="onThemeColorChange('primaryColor', $any($event.target).value)"
                          class="w-12 h-10 rounded cursor-pointer border border-base-300 p-1 bg-base-200 shrink-0"
                        />
                        <input
                          uiInput
                          id="primaryColor"
                          type="text"
                          [formField]="schoolForm.primaryColor"
                          class="flex-1 font-mono text-sm"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="secondaryColor">
                        Color secundario
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <div class="flex gap-2 items-center">
                        <input
                          type="color"
                          [value]="schoolForm.secondaryColor().value() || '#10b981'"
                          (input)="onThemeColorChange('secondaryColor', $any($event.target).value)"
                          class="w-12 h-10 rounded cursor-pointer border border-base-300 p-1 bg-base-200 shrink-0"
                        />
                        <input
                          uiInput
                          id="secondaryColor"
                          type="text"
                          [formField]="schoolForm.secondaryColor"
                          class="flex-1 font-mono text-sm"
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="tertiaryColor">
                        Color terciario
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <div class="flex gap-2 items-center">
                        <input
                          type="color"
                          [value]="schoolForm.tertiaryColor().value() || '#8b5cf6'"
                          (input)="onThemeColorChange('tertiaryColor', $any($event.target).value)"
                          class="w-12 h-10 rounded cursor-pointer border border-base-300 p-1 bg-base-200 shrink-0"
                        />
                        <input
                          uiInput
                          id="tertiaryColor"
                          type="text"
                          [formField]="schoolForm.tertiaryColor"
                          class="flex-1 font-mono text-sm"
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 my-6 pt-6 border-t border-base-300">
          <a uiButton variant="ghost" [routerLink]="isEditMode() ? ['/schools', id()] : ['/admin/schools']">Cancelar</a>
          <button
            uiButton
            [loading]="isSaving()"
            variant="primary"
            type="submit"
            [disabled]="isSaving() || isUploadingLogo()"
          >
            {{ isEditMode() ? 'Guardar cambios' : 'Crear colegio' }}
          </button>
        </div>
      </form>
    }
  `,
})
export default class SchoolForm {
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Inicio', link: '/' },
    { label: 'Admin', link: '/admin' },
    { label: 'Colegios', link: '/admin/schools' },
    ...(this.isEditMode()
      ? [{ label: this.schoolResource.value()?.name ?? '', link: ['/schools', this.id()] }, { label: 'Editar' }]
      : [{ label: 'Nuevo' }]),
  ]);

  public id = input<string>();

  private http = inject(HttpClient);
  private router = inject(Router);
  private toasts = inject(Toast);
  private store = inject(Store);

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
    primaryColor: '',
    secondaryColor: '',
    tertiaryColor: '',
    schoolYearStartMonth: 8,
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
      if (!isValidId(params.id)) {
        return of(null);
      }
      return this.http.get<SchoolFromApi>(`/api/v1/schools/${params.id}`).pipe(
        switchMap((school) => {
          if (!school.logo) {
            return of(school);
          }
          return this.http
            .get<{ downloadUrl: string }>('/api/v1/schools/logo-download-url', { params: { schoolId: params.id! } })
            .pipe(map((r) => ({ ...school, logoUrl: r.downloadUrl || undefined })));
        }),
      );
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
          primaryColor: (school as { primaryColor?: string | null }).primaryColor ?? '',
          secondaryColor: (school as { secondaryColor?: string | null }).secondaryColor ?? '',
          tertiaryColor: (school as { tertiaryColor?: string | null }).tertiaryColor ?? '',
          schoolYearStartMonth: school.schoolYearStartMonth ?? 8,
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
      const { uploadUrl, storageKey } = await firstValueFrom(
        this.http.post<{ uploadUrl: string; storageKey: string }>('/api/v1/schools/logo-upload-url', {
          schoolId,
          mimeType: 'image/png',
        }),
      );

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
      await firstValueFrom(this.http.patch(`/api/v1/schools/${schoolId}/logo`, { logo: storageKey }));

      // Update form model
      this.#schoolModel.update((model) => ({ ...model, logo: storageKey }));
      this.pendingStorageKey.set(storageKey);

      // Fetch the new download URL
      const result = await firstValueFrom(
        this.http.get<{ downloadUrl: string }>('/api/v1/schools/logo-download-url', {
          params: { schoolId },
        }),
      );
      this.logoDownloadUrl.set(result.downloadUrl ?? '');

      this.toasts.showSuccess('Logo actualizado correctamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.toasts.showError('Error al subir el logo');
    } finally {
      this.isUploadingLogo.set(false);
      this.tempCroppedBlob.set(null);
    }
  }

  onThemeColorChange(field: 'primaryColor' | 'secondaryColor' | 'tertiaryColor', value: string): void {
    this.#schoolModel.update((m) => ({ ...m, [field]: value }));
  }

  public schoolYearMonths = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  onSchoolYearStartMonthChange(value: string): void {
    this.#schoolModel.update((m) => ({ ...m, schoolYearStartMonth: Number(value) }));
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
      const raw = this.schoolForm().value();
      const formValue = {
        ...raw,
        primaryColor: raw.primaryColor?.trim() || null,
        secondaryColor: raw.secondaryColor?.trim() || null,
        tertiaryColor: raw.tertiaryColor?.trim() || null,
      };

      try {
        if (this.isEditMode()) {
          await firstValueFrom(this.http.patch('/api/v1/schools', { ...formValue, id: this.id()! }));
          this.toasts.showSuccess('Colegio actualizado exitosamente');
          if (this.store.currentSchool()?.id === this.id()) {
            this.store.currentSchool.update((s) =>
              s
                ? {
                    ...s,
                    primaryColor: formValue.primaryColor ?? null,
                    secondaryColor: formValue.secondaryColor ?? null,
                    tertiaryColor: formValue.tertiaryColor ?? null,
                  }
                : s,
            );
          }
          this.router.navigate(['/schools', this.id()]);
        } else {
          // Create the school first
          const created = await firstValueFrom(
            this.http.post<{ id: string }>('/api/v1/schools', {
              ...formValue,
              logo: '',
              currentYear: new Date().getFullYear(),
              organizationId: this.store.currentOrganizationId(),
            }),
          );

          const newSchoolId = created.id;
          if (!newSchoolId) throw new Error('Failed to create school');

          // If there's a pending logo to upload, do it now
          const pendingBlob = this.tempCroppedBlob();
          if (pendingBlob) {
            const { uploadUrl, storageKey } = await firstValueFrom(
              this.http.post<{ uploadUrl: string; storageKey: string }>('/api/v1/schools/logo-upload-url', {
                schoolId: newSchoolId,
                mimeType: 'image/png',
              }),
            );

            const response = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'image/png',
              },
              body: pendingBlob,
            });

            if (response.ok) {
              await firstValueFrom(this.http.patch(`/api/v1/schools/${newSchoolId}/logo`, { logo: storageKey }));
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
