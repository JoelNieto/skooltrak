import { Loader, Toast } from '@/ui';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
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
  imports: [FormField, RouterLink, Loader],
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
      <form (submit)="onSubmit($event)" novalidate="novalidate">
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
                        [formField]="studentForm.firstName"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.firstName().dirty()"
                        [class.ng-invalid]="studentForm.firstName().invalid()"
                      />
                      @if (studentForm.firstName().dirty() && studentForm.firstName().invalid()) {
                        <ul>
                          @for (error of studentForm.firstName().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
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
                        [formField]="studentForm.middleName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="fatherName">Apellido paterno</label>
                      <input
                        id="fatherName"
                        type="text"
                        [formField]="studentForm.fatherName"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.fatherName().dirty()"
                        [class.ng-invalid]="studentForm.fatherName().invalid()"
                      />
                      @if (studentForm.fatherName().dirty() && studentForm.fatherName().invalid()) {
                        <ul>
                          @for (error of studentForm.fatherName().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
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
                        [formField]="studentForm.motherName"
                        class="input input-primary w-full"
                      />
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="documentId">Nro. documento</label>
                      <input
                        id="documentId"
                        type="text"
                        [formField]="studentForm.documentId"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.documentId().dirty()"
                        [class.ng-invalid]="studentForm.documentId().invalid()"
                      />
                      @if (studentForm.documentId().dirty() && studentForm.documentId().invalid()) {
                        <ul>
                          @for (error of studentForm.documentId().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="birthDate">Fecha de nacimiento</label>
                      <input
                        id="birthDate"
                        type="date"
                        [formField]="studentForm.birthDate"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.birthDate().dirty()"
                        [class.ng-invalid]="studentForm.birthDate().invalid()"
                      />
                      @if (studentForm.birthDate().dirty() && studentForm.birthDate().invalid()) {
                        <ul>
                          @for (error of studentForm.birthDate().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                    <div class="fieldset col-span-2">
                      <label for="gender">Género</label>
                      <select
                        id="gender"
                        [formField]="studentForm.gender"
                        class="select select-primary w-full"
                        [class.ng-dirty]="studentForm.gender().dirty()"
                        [class.ng-invalid]="studentForm.gender().invalid()"
                      >
                        <option value="" disabled>---Seleccionar---</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                      </select>
                      @if (studentForm.gender().dirty() && studentForm.gender().invalid()) {
                        <ul>
                          @for (error of studentForm.gender().errors(); track error) {
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
                      <select
                        id="classGroupId"
                        [formField]="studentForm.classGroupId"
                        class="select select-primary w-full"
                      >
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
                        [formField]="studentForm.enrollmentStatus"
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
                      <input
                        id="email"
                        type="email"
                        [formField]="studentForm.email"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.email().dirty()"
                        [class.ng-invalid]="studentForm.email().invalid()"
                      />
                      @if (studentForm.email().dirty() && studentForm.email().invalid()) {
                        <ul>
                          @for (error of studentForm.email().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                    <div class="fieldset col-span-3">
                      <label for="phone">Teléfono</label>
                      <input
                        id="phone"
                        type="text"
                        [formField]="studentForm.phone"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.phone().dirty()"
                        [class.ng-invalid]="studentForm.phone().invalid()"
                      />
                      @if (studentForm.phone().dirty() && studentForm.phone().invalid()) {
                        <ul>
                          @for (error of studentForm.phone().errors(); track error) {
                            <li class="text-error text-sm">{{ error.message }}</li>
                          }
                        </ul>
                      }
                    </div>
                    <div class="fieldset col-span-6">
                      <label for="address">Dirección</label>
                      <input
                        id="address"
                        type="text"
                        [formField]="studentForm.address"
                        class="input input-primary w-full"
                        [class.ng-dirty]="studentForm.address().dirty()"
                        [class.ng-invalid]="studentForm.address().invalid()"
                      />
                      @if (studentForm.address().dirty() && studentForm.address().invalid()) {
                        <ul>
                          @for (error of studentForm.address().errors(); track error) {
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
                      <select
                        id="bloodType"
                        [formField]="studentForm.bloodType"
                        class="select select-primary w-full"
                      >
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
                        [formField]="studentForm.allergies"
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
                        [formField]="studentForm.medicalNotes"
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
                        [formField]="studentForm.emergencyContactName"
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
                        [formField]="studentForm.emergencyContactPhone"
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
        .valueChanges.pipe(map((result) => result.data.student));
    },
  });

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
      const formValue = this.studentForm().value();

      // Clean up empty classGroupId and convert birthDate to proper format
      const request = {
        ...formValue,
        classGroupId: formValue.classGroupId || null,
        birthDate: formValue.birthDate ? new Date(formValue.birthDate) : null,
      };

      if (this.isEditMode()) {
        await new Promise<void>((resolve, reject) => {
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
                resolve();
              },
              error: (error) => {
                this.isSaving.set(false);
                console.error('Update student error:', error);
                const message =
                  error?.graphQLErrors?.[0]?.message || error?.message || 'Error al actualizar el alumno';
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
              next: (result) => {
                this.isSaving.set(false);
                this.toasts.showSuccess('Alumno creado exitosamente');
                const data = result.data as { createStudent: { id: string } };
                this.router.navigate(['/students', data.createStudent.id]);
                resolve();
              },
              error: (error) => {
                this.isSaving.set(false);
                console.error('Create student error:', error);
                const message = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al crear el alumno';
                this.toasts.showError(message);
                reject(error);
              },
            });
        });
      }
    });
  }
}
