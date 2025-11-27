import { Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import Store from '../../core/store';

@Component({
  selector: 'app-teachers-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
      <div class="fieldset col-span-2">
        <label for="firstName">Nombre</label>
        <input
          type="text"
          formControlName="firstName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="middleName"
          >Segundo nombre
          <span class="text-neutral-400 text-xs">(opcional)</span></label
        >
        <input
          type="text"
          formControlName="middleName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="fatherName">Apellido Paterno</label>
        <input
          type="text"
          formControlName="fatherName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="motherName"
          >Apellido Materno
          <span class="text-neutral-400 text-xs">(opcional)</span></label
        >
        <input
          type="text"
          formControlName="motherName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset col-span-2">
        <label for="email">Correo</label>
        <input
          type="email"
          formControlName="email"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="documentId">Documento</label>
        <input
          type="text"
          formControlName="documentId"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="birthDate">Fec. nacimiento</label>
        <input
          type="date"
          formControlName="birthDate"
          class="input input-primary"
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
    </div>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="btn btn-ghost"
        (click)="closeModal.emit(false)"
      >
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
  </form>`,
})
export default class TeachersForm implements OnInit {
  public data = input<{ teacher?: Prisma.TeacherGetPayload<false> }>();
  public closeModal = output<boolean>();
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private store = inject(Store);
  public form = this.fb.group({
    firstName: ['', [Validators.required]],
    middleName: ['', []],
    fatherName: ['', [Validators.required]],
    motherName: ['', []],
    email: ['', [Validators.required, Validators.email]],
    documentId: ['', [Validators.required]],
    birthDate: [new Date(), [Validators.required]],
    gender: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.data()?.teacher) {
      this.form.patchValue(this.data()!.teacher!);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    const request = this.form.getRawValue();
    if (this.data()?.teacher) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateTeacher($updateTeacherInput: UpdateTeacherInput!) {
              updateTeacher(updateTeacherInput: $updateTeacherInput) {
                id
                firstName
                fatherName
              }
            }
          `,
          variables: {
            updateTeacherInput: {
              ...request,
              id: this.data()?.teacher?.id,
            },
          },
        })
        .subscribe(() => {
          this.toast.showSuccess('Profesor actualizado exitosamente');
          this.closeModal.emit(true);
        });
    } else {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateTeacher($createTeacherInput: CreateTeacherInput!) {
              createTeacher(createTeacherInput: $createTeacherInput) {
                id
                firstName
                fatherName
              }
            }
          `,
          variables: {
            createTeacherInput: {
              ...request,
              organizationId: this.store.currentOrganizationId(),
            },
          },
        })
        .subscribe(() => {
          this.toast.showSuccess('Profesor creado exitosamente');
          this.closeModal.emit(true);
        });
    }
  }
}
