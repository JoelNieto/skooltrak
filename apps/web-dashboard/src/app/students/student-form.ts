import { Button, Loader, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { disabled, email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
import Store from '../core/store';
import { isValidId } from '../core/validators';

type StudentType = Prisma.StudentGetPayload<{
  include: { classGroup: true; user: true; parents: true };
}> & {
  name: string;
  email: string;
};

interface StudentFormData {
  firstName: string;
  middleName: string;
  fatherName: string;
  motherName: string;
  documentId: string;
  email: string;
  classGroupId: string;
  birthDate: string;
  gender: string;
  address: string;
  phone: string;
  enrollmentStatus: string;
  bloodType: string;
  allergies: string;
  medicalNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

@Component({
  selector: 'app-student-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField, RouterLink, Loader],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/students">Alumnos</a></li>
        @if (isEditMode()) {
          <li>Editar</li>
        } @else {
          <li>Nuevo</li>
        }
      </ul>
    </div>

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode() ? 'Editar Alumno' : 'Nuevo Alumno' }}
      </h1>
    </div>

    @if (isEditMode() && studentResource.isLoading()) {
      <lib-loader />
    } @else {
      <form (submit)="onSubmit($event)">
        <div class="flex flex-col gap-6 divide-y divide-base-300">
          <!-- Personal Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Datos Personales</h2>
              <p class="mt-1 text-sm text-base-content/70">Información personal del estudiante.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Primer nombre" [field]="studentForm.firstName" class="col-span-3">
                      <input uiInput id="firstName" type="text" [formField]="studentForm.firstName" />
                    </ui-field>
                    <ui-field label="Segundo nombre" [field]="studentForm.middleName" optional class="col-span-3">
                      <input uiInput id="middleName" type="text" [formField]="studentForm.middleName" />
                    </ui-field>
                    <ui-field label="Apellido paterno" [field]="studentForm.fatherName" class="col-span-3">
                      <input uiInput id="fatherName" type="text" [formField]="studentForm.fatherName" />
                    </ui-field>
                    <ui-field label="Apellido materno" [field]="studentForm.motherName" optional class="col-span-3">
                      <input uiInput id="motherName" type="text" [formField]="studentForm.motherName" />
                    </ui-field>
                    <ui-field label="Nro. documento" [field]="studentForm.documentId" class="col-span-2">
                      <input uiInput id="documentId" type="text" [formField]="studentForm.documentId" />
                    </ui-field>
                    <ui-field label="Fecha de nacimiento" [field]="studentForm.birthDate" class="col-span-2">
                      <input uiInput id="birthDate" type="date" [formField]="studentForm.birthDate" />
                    </ui-field>
                    <ui-field label="Género" [field]="studentForm.gender" class="col-span-2">
                      <select uiSelect id="gender" [formField]="studentForm.gender">
                        <option value="" disabled>---Seleccionar---</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                      </select>
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Datos Académicos</h2>
              <p class="mt-1 text-sm text-base-content/70">Información académica y estado de matrícula.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Grupo" [field]="studentForm.classGroupId" optional class="col-span-3">
                      <select uiSelect id="classGroupId" [formField]="studentForm.classGroupId">
                        <option value="">---Sin grupo---</option>
                        @for (group of groups.value(); track group.id) {
                          <option [value]="group.id">{{ group.name }}</option>
                        }
                      </select>
                    </ui-field>
                    <ui-field label="Estado de matrícula" [field]="studentForm.enrollmentStatus" class="col-span-3">
                      <select uiSelect id="enrollmentStatus" [formField]="studentForm.enrollmentStatus">
                        <option value="ACTIVE">Activo</option>
                        <option value="CANDIDATE">Candidato</option>
                        <option value="RETIRED">Retirado</option>
                      </select>
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
              <p class="mt-1 text-sm text-base-content/70">Información de contacto del estudiante.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Correo electrónico" [field]="studentForm.email" class="col-span-3">
                      <input uiInput id="email" type="email" [formField]="studentForm.email" />
                    </ui-field>
                    <ui-field label="Teléfono" [field]="studentForm.phone" class="col-span-3">
                      <input uiInput id="phone" type="text" [formField]="studentForm.phone" />
                    </ui-field>
                    <ui-field label="Dirección" [field]="studentForm.address" class="col-span-6">
                      <input uiInput id="address" type="text" [formField]="studentForm.address" />
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Medical Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Información Médica</h2>
              <p class="mt-1 text-sm text-base-content/70">Datos médicos relevantes del estudiante.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Tipo de sangre" [field]="studentForm.bloodType" optional class="col-span-2">
                      <select uiSelect id="bloodType" [formField]="studentForm.bloodType">
                        <option value="">---Seleccionar---</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </ui-field>
                    <ui-field label="Alergias" [field]="studentForm.allergies" optional class="col-span-4">
                      <input
                        uiInput
                        id="allergies"
                        type="text"
                        [formField]="studentForm.allergies"
                        placeholder="Ej: Penicilina, maní, etc."
                      />
                    </ui-field>
                    <ui-field label="Notas médicas" [field]="studentForm.medicalNotes" optional class="col-span-6">
                      <textarea
                        uiInput
                        id="medicalNotes"
                        [formField]="studentForm.medicalNotes"
                        rows="3"
                        placeholder="Condiciones médicas, medicamentos, etc."
                      ></textarea>
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Emergency Contact Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-base-content">Contacto de Emergencia</h2>
              <p class="mt-1 text-sm text-base-content/70">Persona a contactar en caso de emergencia.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field
                      label="Nombre del contacto"
                      [field]="studentForm.emergencyContactName"
                      optional
                      class="col-span-3"
                    >
                      <input
                        uiInput
                        id="emergencyContactName"
                        type="text"
                        [formField]="studentForm.emergencyContactName"
                      />
                    </ui-field>
                    <ui-field
                      label="Teléfono de emergencia"
                      [field]="studentForm.emergencyContactPhone"
                      optional
                      class="col-span-3"
                    >
                      <input
                        uiInput
                        id="emergencyContactPhone"
                        type="text"
                        [formField]="studentForm.emergencyContactPhone"
                      />
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 my-6 pt-6 border-t border-base-300">
          <a uiButton variant="ghost" routerLink="/students">Cancelar</a>
          <button uiButton variant="primary" type="submit" [disabled]="isSaving()">
            @if (isSaving()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            {{ isEditMode() ? 'Guardar cambios' : 'Crear alumno' }}
          </button>
        </div>
      </form>
    }
  `,
})
export default class StudentForm {
  public id = input<string>();

  private http = inject(HttpClient);
  private store = inject(Store);
  private router = inject(Router);
  private toasts = inject(Toast);

  public isEditMode = computed(() => !!this.id());
  public isSaving = signal(false);

  #studentModel = signal<StudentFormData>({
    firstName: '',
    middleName: '',
    fatherName: '',
    motherName: '',
    documentId: '',
    email: '',
    classGroupId: '',
    birthDate: '',
    gender: '',
    address: '',
    phone: '',
    enrollmentStatus: 'ACTIVE',
    bloodType: '',
    allergies: '',
    medicalNotes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  public studentForm = form(this.#studentModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Primer nombre es requerido' });
    required(schemaPath.fatherName, { message: 'Apellido paterno es requerido' });
    required(schemaPath.documentId, { message: 'Nro. documento es requerido' });
    required(schemaPath.email, { message: 'Correo electrónico es requerido' });
    email(schemaPath.email, { message: 'Ingrese un correo válido' });
    required(schemaPath.birthDate, { message: 'Fecha de nacimiento es requerida' });
    required(schemaPath.gender, { message: 'Género es requerido' });
    required(schemaPath.address, { message: 'Dirección es requerida' });
    required(schemaPath.phone, { message: 'Teléfono es requerido' });
    disabled(schemaPath.email, { when: () => this.isEditMode() });
  });

  public groups = httpResource<Array<{ id: string; name: string }>>(
    () => {
      const schoolId = this.store.currentSchoolId();
      return schoolId ? `/api/v1/class-groups/by-school/${schoolId}` : undefined;
    },
    { defaultValue: [] },
  );

  public studentResource = httpResource<StudentType | null>(() =>
    isValidId(this.id() ?? '') ? `/api/v1/students/${this.id()}` : undefined,
  );

  constructor() {
    afterRenderEffect(() => {
      const student = this.studentResource.value();
      if (student) {
        this.#studentModel.set({
          firstName: student.firstName ?? '',
          middleName: student.middleName ?? '',
          fatherName: student.fatherName ?? '',
          motherName: student.motherName ?? '',
          documentId: student.documentId ?? '',
          email: student.email ?? '',
          classGroupId: student.classGroupId ?? '',
          birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
          gender: student.gender ?? '',
          address: student.address ?? '',
          phone: student.phone ?? '',
          enrollmentStatus: student.enrollmentStatus ?? 'ACTIVE',
          bloodType: student.bloodType ?? '',
          allergies: student.allergies ?? '',
          medicalNotes: student.medicalNotes ?? '',
          emergencyContactName: student.emergencyContactName ?? '',
          emergencyContactPhone: student.emergencyContactPhone ?? '',
        });
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Mark all required fields as dirty for validation display
    this.studentForm.firstName().markAsDirty();
    this.studentForm.fatherName().markAsDirty();
    this.studentForm.documentId().markAsDirty();
    this.studentForm.email().markAsDirty();
    this.studentForm.birthDate().markAsDirty();
    this.studentForm.gender().markAsDirty();
    this.studentForm.address().markAsDirty();
    this.studentForm.phone().markAsDirty();

    submit(this.studentForm, async () => {
      this.isSaving.set(true);
      try {
        const formValue = this.studentForm().value();

        // Clean up empty classGroupId and convert birthDate to proper format
        const request = {
          ...formValue,
          classGroupId: formValue.classGroupId || null,
          birthDate: formValue.birthDate ? new Date(formValue.birthDate) : null,
        };

        if (this.isEditMode()) {
          await firstValueFrom(
            this.http.patch('/api/v1/students', {
              ...request,
              id: this.id()!,
            }),
          );
          this.toasts.showSuccess('Alumno actualizado exitosamente');
          this.router.navigate(['/students', this.id()]);
        } else {
          const created = await firstValueFrom(
            this.http.post<{ id: string }>('/api/v1/students', {
              ...request,
              organizationId: this.store.currentOrganizationId()!,
              schoolId: this.store.currentSchoolId()!,
            }),
          );
          this.toasts.showSuccess('Alumno creado exitosamente');
          const newId = created?.id;
          if (newId) this.router.navigate(['/students', newId]);
        }
      } catch (error: unknown) {
        console.error('Student save error:', error);
        const message =
          error && typeof error === 'object' && 'error' in error
            ? String((error as { error?: { message?: string } }).error?.message)
            : error instanceof Error
              ? error.message
              : 'Error al guardar el alumno';
        this.toasts.showError(message || 'Error al guardar el alumno');
      } finally {
        this.isSaving.set(false);
      }
    });
  }
}
