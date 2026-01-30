import { Loader, markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';

type StudentType = Prisma.StudentGetPayload<{
  include: { classGroup: true; user: true; parents: true };
}> & {
  name: string;
  email: string;
};

@Component({
  selector: 'app-student-form',
  imports: [ReactiveFormsModule, RouterLink, Loader],
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
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
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
                    <div class="fieldset col-span-3">
                      <label for="firstName">Primer nombre</label>
                      <input
                        id="firstName"
                        type="text"
                        formControlName="firstName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="middleName">
                        Segundo nombre
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="middleName"
                        type="text"
                        formControlName="middleName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="fatherName">Apellido paterno</label>
                      <input
                        id="fatherName"
                        type="text"
                        formControlName="fatherName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="motherName">
                        Apellido materno
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="motherName"
                        type="text"
                        formControlName="motherName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="documentId">Nro. documento</label>
                      <input
                        id="documentId"
                        type="text"
                        formControlName="documentId"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="birthDate">Fecha de nacimiento</label>
                      <input
                        id="birthDate"
                        type="date"
                        formControlName="birthDate"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="gender">Género</label>
                      <select id="gender" formControlName="gender" class="select select-primary w-full">
                        <option value="" disabled>---Seleccionar---</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                      </select>
                    </div>
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
                    <div class="fieldset col-span-3">
                      <label for="classGroupId">
                        Grupo
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <select id="classGroupId" formControlName="classGroupId" class="select select-primary w-full">
                        <option value="">---Sin grupo---</option>
                        @for (group of groups.value(); track group.id) {
                          <option [value]="group.id">{{ group.name }}</option>
                        }
                      </select>
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="enrollmentStatus">Estado de matrícula</label>
                      <select
                        id="enrollmentStatus"
                        formControlName="enrollmentStatus"
                        class="select select-primary w-full"
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="CANDIDATE">Candidato</option>
                        <option value="RETIRED">Retirado</option>
                      </select>
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
              <p class="mt-1 text-sm text-base-content/70">Información de contacto del estudiante.</p>
            </div>
            <div class="sm:col-span-3">
              <div class="card card-border border-base-300 bg-base-100">
                <div class="card-body gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <div class="fieldset col-span-3">
                      <label for="email">Correo electrónico</label>
                      <input id="email" type="email" formControlName="email" class="input input-primary w-full" />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="phone">Teléfono</label>
                      <input id="phone" type="text" formControlName="phone" class="input input-primary w-full" />
                    </div>
                    <div class="fieldset col-span-6">
                      <label for="address">Dirección</label>
                      <input id="address" type="text" formControlName="address" class="input input-primary w-full" />
                    </div>
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
                    <div class="fieldset col-span-2">
                      <label for="bloodType">
                        Tipo de sangre
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <select id="bloodType" formControlName="bloodType" class="select select-primary w-full">
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
                    </div>
                    <div class="fieldset col-span-4">
                      <label for="allergies">
                        Alergias
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="allergies"
                        type="text"
                        formControlName="allergies"
                        class="input input-primary w-full"
                        placeholder="Ej: Penicilina, maní, etc."
                      />
                    </div>
                    <div class="fieldset col-span-6">
                      <label for="medicalNotes">
                        Notas médicas
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <textarea
                        id="medicalNotes"
                        formControlName="medicalNotes"
                        class="textarea textarea-primary w-full"
                        rows="3"
                        placeholder="Condiciones médicas, medicamentos, etc."
                      ></textarea>
                    </div>
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
                    <div class="fieldset col-span-3">
                      <label for="emergencyContactName">
                        Nombre del contacto
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="emergencyContactName"
                        type="text"
                        formControlName="emergencyContactName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="emergencyContactPhone">
                        Teléfono de emergencia
                        <span class="text-base-content/50 text-xs">(opcional)</span>
                      </label>
                      <input
                        id="emergencyContactPhone"
                        type="text"
                        formControlName="emergencyContactPhone"
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
          <a routerLink="/students" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
            @if (isSaving()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            {{ isEditMode() ? 'Guardar cambios' : 'Crear alumno' }}
          </button>
        </div>
      </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentForm {
  public id = input<string>();

  private apollo = inject(Apollo);
  private store = inject(Store);
  private router = inject(Router);
  private toasts = inject(Toast);
  private fb = inject(NonNullableFormBuilder);

  public isEditMode = computed(() => !!this.id());
  public isSaving = signal(false);

  public form = this.fb.group({
    firstName: ['', [Validators.required]],
    middleName: [''],
    fatherName: ['', [Validators.required]],
    motherName: [''],
    documentId: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    classGroupId: [''],
    birthDate: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    address: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    enrollmentStatus: ['ACTIVE'],
    bloodType: [''],
    allergies: [''],
    medicalNotes: [''],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
  });

  public groups = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ classGroupsBySchoolId: { id: string; name: string }[] }>({
          query: gql`
            query ClassGroupsBySchoolId($schoolId: String!) {
              classGroupsBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: { schoolId },
        })
        .valueChanges.pipe(map((result) => result.data.classGroupsBySchoolId));
    },
  });

  public studentResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      if (!params.id) {
        return of(null);
      }
      return this.apollo
        .watchQuery<{ student: StudentType }>({
          query: gql`
            query Student($id: String!) {
              student(id: $id) {
                id
                firstName
                middleName
                fatherName
                motherName
                documentId
                email
                classGroupId
                birthDate
                gender
                address
                phone
                enrollmentStatus
                bloodType
                allergies
                medicalNotes
                emergencyContactName
                emergencyContactPhone
              }
            }
          `,
          variables: { id: params.id },
        })
        .valueChanges.pipe(
          map((result) => {
            const student = result.data.student;
            // Patch form with student data
            this.form.patchValue({
              firstName: student.firstName,
              middleName: student.middleName,
              fatherName: student.fatherName,
              motherName: student.motherName,
              documentId: student.documentId,
              email: student.email,
              classGroupId: student.classGroupId || '',
              birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
              gender: student.gender,
              address: student.address,
              phone: student.phone,
              enrollmentStatus: student.enrollmentStatus,
              bloodType: student.bloodType,
              allergies: student.allergies,
              medicalNotes: student.medicalNotes,
              emergencyContactName: student.emergencyContactName,
              emergencyContactPhone: student.emergencyContactPhone,
            });
            return student;
          }),
        );
    },
  });

  onSubmit() {
    if (this.form.invalid) {
      this.toasts.showError('Por favor, completa todos los campos requeridos');
      markGroupDirty(this.form);
      return;
    }

    this.isSaving.set(true);
    const formValue = this.form.getRawValue();

    // Clean up empty classGroupId and convert birthDate to proper format
    const request = {
      ...formValue,
      classGroupId: formValue.classGroupId || null,
      birthDate: formValue.birthDate ? new Date(formValue.birthDate) : null,
    };

    if (this.isEditMode()) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateStudent($updateStudentInput: UpdateStudentInput!) {
              updateStudent(updateStudentInput: $updateStudentInput) {
                id
              }
            }
          `,
          variables: {
            updateStudentInput: {
              ...request,
              id: this.id(),
            },
          },
        })
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toasts.showSuccess('Alumno actualizado exitosamente');
            this.router.navigate(['/students', this.id()]);
          },
          error: (error) => {
            this.isSaving.set(false);
            console.error('Update student error:', error);
            const message = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al actualizar el alumno';
            this.toasts.showError(message);
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateStudent($createStudentInput: CreateStudentInput!) {
              createStudent(createStudentInput: $createStudentInput) {
                id
              }
            }
          `,
          variables: {
            createStudentInput: {
              ...request,
              organizationId: this.store.currentOrganizationId(),
              schoolId: this.store.currentSchoolId(),
            },
          },
        })
        .subscribe({
          next: (result: any) => {
            this.isSaving.set(false);
            this.toasts.showSuccess('Alumno creado exitosamente');
            this.router.navigate(['/students', result.data.createStudent.id]);
          },
          error: (error) => {
            this.isSaving.set(false);
            console.error('Create student error:', error);
            const message = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al crear el alumno';
            this.toasts.showError(message);
          },
        });
    }
  }
}
