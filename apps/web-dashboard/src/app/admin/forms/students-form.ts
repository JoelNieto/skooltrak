import { markGroupDirty, Toast } from '@/ui';
import {
  afterRenderEffect,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
@Component({
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
      <div class="fieldset col-span-2">
        <label for="firstName">Primer nombre</label>
        <input
          type="text"
          formControlName="firstName"
          class="input input-primary"
          id="firstName"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="middleName">Segundo nombre</label>
        <input
          type="text"
          formControlName="middleName"
          class="input input-primary"
          id="middleName"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="fatherName">Apellido Paterno</label>
        <input
          type="text"
          formControlName="fatherName"
          class="input input-primary"
          id="fatherName"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="motherName">Apellido Materno</label>
        <input
          type="text"
          formControlName="motherName"
          class="input input-primary"
          id="motherName"
        />
      </div>
      <div class="fieldset">
        <label for="documentId">Documento</label>
        <input
          type="text"
          formControlName="documentId"
          class="input input-primary"
          id="documentId"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="email">Correo</label>
        <input
          type="email"
          formControlName="email"
          class="input input-primary"
          id="email"
        />
      </div>
      <div class="fieldset">
        <label for="classGroupId">Grupo</label>
        <select formControlName="classGroupId" class="select select-primary">
          <option value="" disabled>---Seleccionar---</option>
          @for (group of groups.value(); track group.id) {
          <option [value]="group.id">{{ group.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="birthDate">Fecha de nacimiento</label>
        <input
          type="date"
          formControlName="birthDate"
          class="input input-primary"
          id="birthDate"
        />
      </div>
      <div class="fieldset">
        <label for="gender">Genero</label>
        <select formControlName="gender" class="select select-primary">
          <option value="" disabled>---Seleccionar---</option>
          <option value="MALE">Masculino</option>
          <option value="FEMALE">Femenino</option>
        </select>
      </div>
      <div class="fieldset">
        <label for="phone">Telefono</label>
        <input
          type="text"
          formControlName="phone"
          class="input input-primary"
          id="phone"
        />
      </div>
      <div class="fieldset col-span-3">
        <label for="address">Direccion</label>
        <input
          type="text"
          formControlName="address"
          class="input input-primary"
          id="address"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
  </form>`,
})
export default class StudentsForm {
  public data = input<{
    student?: Prisma.StudentGetPayload<{ include: undefined }>;
  }>();
  private apollo = inject(Apollo);
  private store = inject(Store);
  public closeModal = output<void>();
  private toasts = inject(Toast);
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
        .watchQuery<{
          classGroupsBySchoolId: { id: string; name: string }[];
        }>({
          query: gql`
            query ClassGroupsBySchoolId($schoolId: String!) {
              classGroupsBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.classGroupsBySchoolId));
    },
  });

  private fb = inject(NonNullableFormBuilder);

  public form = this.fb.group({
    firstName: ['', [Validators.required]],
    middleName: ['', []],
    fatherName: ['', [Validators.required]],
    motherName: ['', []],
    email: ['', [Validators.required, Validators.email]],
    documentId: ['', [Validators.required]],
    classGroupId: ['', [Validators.required]],
    birthDate: [new Date(), [Validators.required]],
    gender: ['', [Validators.required]],
    address: ['', [Validators.required]],
    phone: ['', [Validators.required]],
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.student) {
        this.form.patchValue(this.data()!.student!);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toasts.showError('Por favor, completa todos los campos');
      markGroupDirty(this.form);
      return;
    }
    const request = this.form.getRawValue();
    if (this.data()?.student) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateStudent($updateStudentInput: UpdateStudentInput!) {
              updateStudent(updateStudentInput: $updateStudentInput) {
                id
                firstName
                fatherName
              }
            }
          `,
          variables: {
            updateStudentInput: {
              ...request,
              id: this.data()?.student?.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toasts.showSuccess('Alumno actualizado exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            console.error(error);
            this.toasts.showError('Error al actualizar el alumno');
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateStudent($createStudentInput: CreateStudentInput!) {
              createStudent(createStudentInput: $createStudentInput) {
                id
                firstName
                fatherName
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
          next: () => {
            this.toasts.showSuccess('Alumno creado exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            console.error(error);
            this.toasts.showError('Error al crear el alumno');
          },
        });
    }
  }
}
