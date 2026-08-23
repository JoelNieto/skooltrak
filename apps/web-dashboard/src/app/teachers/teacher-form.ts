import { Loader, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { disabled, email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Store from '../core/store';
import { isValidId } from '../core/validators';

type TeacherDetail = {
  firstName?: string;
  middleName?: string;
  fatherName?: string;
  motherName?: string;
  documentId?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  personalEmail?: string;
  about?: string;
  teacherSince?: number | null;
  memberSince?: string;
  user?: { email?: string };
};

interface TeacherFormData {
  firstName: string;
  middleName: string;
  fatherName: string;
  motherName: string;
  documentId: string;
  email: string;
  birthDate: string;
  gender: string;
  address: string;
  phoneNumber: string;
  personalEmail: string;
  about: string;
  teacherSince: string;
  memberSince: string;
}

@Component({
  selector: 'app-teacher-form',
  imports: [FormField, RouterLink, Loader],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/teachers">Docentes</a></li>
        @if (isEditMode()) {
          <li>Editar</li>
        } @else {
          <li>Nuevo</li>
        }
      </ul>
    </div>

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode() ? 'Editar Docente' : 'Nuevo Docente' }}
      </h1>
    </div>

    @if (isEditMode() && teacherResource.isLoading()) {
      <lib-loader />
    } @else {
      <form (submit)="onSubmit($event)" novalidate="novalidate">
        <div class="flex flex-col gap-6 divide-y divide-base-300">
          <!-- Personal Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Datos Personales</h2>
              <p class="mt-1 text-sm text-base-content/70">Información personal del docente.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-3">
                      <label for="firstName">Primer nombre</label>
                      <input
                        id="firstName"
                        type="text"
                        [formField]="teacherForm.firstName"
                        class="input input-primary w-full"
                        [class.ng-invalid]="teacherForm.firstName().touched() && teacherForm.firstName().invalid()"
                      />
                      @if (teacherForm.firstName().touched() && teacherForm.firstName().invalid()) {
                        @for (error of teacherForm.firstName().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
                      }
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="middleName">
                        Segundo nombre
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="middleName"
                        type="text"
                        [formField]="teacherForm.middleName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="fatherName">Apellido paterno</label>
                      <input
                        id="fatherName"
                        type="text"
                        [formField]="teacherForm.fatherName"
                        class="input input-primary w-full"
                        [class.ng-invalid]="teacherForm.fatherName().touched() && teacherForm.fatherName().invalid()"
                      />
                      @if (teacherForm.fatherName().touched() && teacherForm.fatherName().invalid()) {
                        @for (error of teacherForm.fatherName().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
                      }
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="motherName">
                        Apellido materno
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="motherName"
                        type="text"
                        [formField]="teacherForm.motherName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="documentId">Nro. documento</label>
                      <input
                        id="documentId"
                        type="text"
                        [formField]="teacherForm.documentId"
                        class="input input-primary w-full"
                        [class.ng-invalid]="teacherForm.documentId().touched() && teacherForm.documentId().invalid()"
                      />
                      @if (teacherForm.documentId().touched() && teacherForm.documentId().invalid()) {
                        @for (error of teacherForm.documentId().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
                      }
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="birthDate">Fecha de nacimiento</label>
                      <input
                        id="birthDate"
                        type="date"
                        [formField]="teacherForm.birthDate"
                        class="input input-primary w-full"
                        [class.ng-invalid]="teacherForm.birthDate().touched() && teacherForm.birthDate().invalid()"
                      />
                      @if (teacherForm.birthDate().touched() && teacherForm.birthDate().invalid()) {
                        <ul>
                          @for (error of teacherForm.birthDate().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="gender">Género</label>
                      <select
                        id="gender"
                        [formField]="teacherForm.gender"
                        class="select select-primary w-full"
                        [class.ng-invalid]="teacherForm.gender().touched() && teacherForm.gender().invalid()"
                      >
                        <option value="" disabled>---Seleccionar---</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                      </select>
                      @if (teacherForm.gender().touched() && teacherForm.gender().invalid()) {
                        @for (error of teacherForm.gender().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
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
              <p class="mt-1 text-sm text-base-content/70">Información de contacto del docente.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-3">
                      <label for="email">Correo institucional</label>
                      <input
                        id="email"
                        type="email"
                        [formField]="teacherForm.email"
                        class="input input-primary w-full"
                        [class.ng-invalid]="teacherForm.email().touched() && teacherForm.email().invalid()"
                      />
                      @if (teacherForm.email().touched() && teacherForm.email().invalid()) {
                        @for (error of teacherForm.email().errors(); track error) {
                          <p class="text-error text-sm">{{ error.message }}</p>
                        }
                      }
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="personalEmail">
                        Correo personal
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="personalEmail"
                        type="email"
                        [formField]="teacherForm.personalEmail"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="phoneNumber">
                        Teléfono
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="phoneNumber"
                        type="text"
                        [formField]="teacherForm.phoneNumber"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="address">
                        Dirección
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="address"
                        type="text"
                        [formField]="teacherForm.address"
                        class="input input-primary w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Professional Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Información Profesional</h2>
              <p class="mt-1 text-sm text-base-content/70">Datos profesionales y de trayectoria.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-3">
                      <label for="teacherSince">
                        Docente desde (año)
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="teacherSince"
                        type="number"
                        [formField]="teacherForm.teacherSince"
                        class="input input-primary w-full"
                        placeholder="Ej: 2015"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="memberSince">
                        Miembro desde
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="memberSince"
                        type="date"
                        [formField]="teacherForm.memberSince"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-6">
                      <label for="about">
                        Acerca de
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <textarea
                        id="about"
                        [formField]="teacherForm.about"
                        class="textarea textarea-primary w-full"
                        rows="4"
                        placeholder="Biografía breve, especialidades, intereses..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 my-6 pt-6 border-t border-base-300">
          <a routerLink="/teachers" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
            @if (isSaving()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            {{ isEditMode() ? 'Guardar cambios' : 'Crear docente' }}
          </button>
        </div>
      </form>
    }
  `,
})
export default class TeacherForm {
  public id = input<string>();

  private http = inject(HttpClient);
  private store = inject(Store);
  private router = inject(Router);
  private toasts = inject(Toast);

  public isEditMode = computed(() => !!this.id());
  public isSaving = signal(false);

  #teacherModel = signal<TeacherFormData>({
    firstName: '',
    middleName: '',
    fatherName: '',
    motherName: '',
    documentId: '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    phoneNumber: '',
    personalEmail: '',
    about: '',
    teacherSince: '',
    memberSince: '',
  });

  public teacherForm = form(this.#teacherModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Primer nombre es requerido' });
    required(schemaPath.fatherName, { message: 'Apellido paterno es requerido' });
    required(schemaPath.documentId, { message: 'Nro. documento es requerido' });
    required(schemaPath.email, { message: 'Correo electrónico es requerido' });
    email(schemaPath.email, { message: 'Ingrese un correo válido' });
    required(schemaPath.birthDate, { message: 'Fecha de nacimiento es requerida' });
    required(schemaPath.gender, { message: 'Género es requerido' });
    disabled(schemaPath.email, { when: () => this.isEditMode() });
  });

  public teacherResource = httpResource<TeacherDetail | null>(() =>
    isValidId(this.id() ?? '') ? `/api/v1/teachers/${this.id()}` : undefined,
  );

  constructor() {
    afterRenderEffect(() => {
      const teacher = this.teacherResource.value();
      if (teacher) {
        this.#teacherModel.set({
          firstName: teacher.firstName ?? '',
          middleName: teacher.middleName ?? '',
          fatherName: teacher.fatherName ?? '',
          motherName: teacher.motherName ?? '',
          documentId: teacher.documentId ?? '',
          email: teacher.user?.email ?? '',
          birthDate: teacher.birthDate ? new Date(teacher.birthDate).toISOString().split('T')[0] : '',
          gender: teacher.gender ?? '',
          address: teacher.address ?? '',
          phoneNumber: teacher.phoneNumber ?? '',
          personalEmail: teacher.personalEmail ?? '',
          about: teacher.about ?? '',
          teacherSince: teacher.teacherSince?.toString() ?? '',
          memberSince: teacher.memberSince ? new Date(teacher.memberSince).toISOString().split('T')[0] : '',
        });
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Mark all required fields as touched for validation display
    this.teacherForm.firstName().markAsTouched();
    this.teacherForm.fatherName().markAsTouched();
    this.teacherForm.documentId().markAsTouched();
    this.teacherForm.email().markAsTouched();
    this.teacherForm.birthDate().markAsTouched();
    this.teacherForm.gender().markAsTouched();

    submit(this.teacherForm, async () => {
      this.isSaving.set(true);
      const formValue = this.teacherForm().value();

      // Convert dates and numbers to proper format
      const request = {
        ...formValue,
        birthDate: formValue.birthDate ? new Date(formValue.birthDate) : null,
        teacherSince: formValue.teacherSince ? parseInt(formValue.teacherSince, 10) : null,
        memberSince: formValue.memberSince ? new Date(formValue.memberSince) : null,
      };

      if (this.isEditMode()) {
        await firstValueFrom(
          this.http.patch('/api/v1/teachers', {
            ...request,
            id: this.id()!,
          }),
        );
        this.isSaving.set(false);
        this.toasts.showSuccess('Docente actualizado exitosamente');
        this.router.navigate(['/teachers', this.id()!]);
      } else {
        const created = await firstValueFrom(
          this.http.post<{ id: string }>('/api/v1/teachers', {
            ...request,
            organizationId: this.store.currentOrganizationId()!,
          }),
        );
        this.isSaving.set(false);
        this.toasts.showSuccess('Docente creado exitosamente');
        const id = created?.id;
        if (id) {
          this.router.navigate(['/teachers', id]);
        }
      }
    });
  }
}
