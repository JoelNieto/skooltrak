import { Loader, Toast } from '@/ui';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';

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
  imports: [FormField, RouterLink, Loader],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/admin">Admin</a></li>
        <li><a routerLink="/admin/schools">Colegios</a></li>
        @if (isEditMode()) {
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
          <!-- Basic Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
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
          <a routerLink="/admin/schools" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
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
              }
            }
          `,
          variables: { id: params.id },
        })
        .valueChanges.pipe(map((result) => result.data.school));
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
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Mark required fields as dirty for validation display
    this.schoolForm.name().markAsDirty();
    this.schoolForm.shortName().markAsDirty();

    submit(this.schoolForm, async () => {
      this.isSaving.set(true);
      const formValue = this.schoolForm().value();

      if (this.isEditMode()) {
        await new Promise<void>((resolve, reject) => {
          this.apollo
            .mutate({
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
            })
            .subscribe({
              next: () => {
                this.isSaving.set(false);
                this.toasts.showSuccess('Colegio actualizado exitosamente');
                this.router.navigate(['/admin/schools']);
                resolve();
              },
              error: (error) => {
                this.isSaving.set(false);
                console.error('Update school error:', error);
                const message =
                  error?.graphQLErrors?.[0]?.message || error?.message || 'Error al actualizar el colegio';
                this.toasts.showError(message);
                reject(error);
              },
            });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          this.apollo
            .mutate({
              mutation: gql`
                mutation CreateSchool($createSchoolInput: CreateSchoolInput!) {
                  createSchool(createSchoolInput: $createSchoolInput) {
                    id
                  }
                }
              `,
              variables: {
                createSchoolInput: formValue,
              },
            })
            .subscribe({
              next: () => {
                this.isSaving.set(false);
                this.toasts.showSuccess('Colegio creado exitosamente');
                this.router.navigate(['/admin/schools']);
                resolve();
              },
              error: (error) => {
                this.isSaving.set(false);
                console.error('Create school error:', error);
                const message = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al crear el colegio';
                this.toasts.showError(message);
                reject(error);
              },
            });
        });
      }
    });
  }
}
