import { markGroupDirty, Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import Store from '../../core/store';
@Component({
  selector: 'app-subjects-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input
          type="text"
          id="name"
          formControlName="name"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input
          type="text"
          id="shortName"
          formControlName="shortName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="code">Código</label>
        <input
          type="text"
          id="code"
          formControlName="code"
          class="input input-primary"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" (click)="closeModal.emit()" type="button">
        Cancelar
      </button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class SubjectsForm implements OnInit {
  public closeModal = output<void>();
  public data = input<{ subject?: Prisma.SubjectGetPayload<false> }>();
  private toast = inject(Toast);
  private store = inject(Store);
  private apollo = inject(Apollo);
  private fb = inject(NonNullableFormBuilder);
  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    code: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const subject = this.data()?.subject;
    if (subject) {
      this.form.patchValue(subject);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.toast.showError('Datos inválidos');
      markGroupDirty(this.form);
      return;
    }

    const subject = {
      ...this.form.getRawValue(),
      organizationId: this.store.currentOrganizationId(),
    };

    if (this.data()?.subject) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateSubject($updateSubjectInput: UpdateSubjectInput!) {
              updateSubject(updateSubjectInput: $updateSubjectInput) {
                id
              }
            }
          `,
          variables: {
            updateSubjectInput: {
              ...subject,
              id: this.data()?.subject?.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Asignatura actualizada');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toast.showError(error.message);
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateSubject($createSubjectInput: CreateSubjectInput!) {
              createSubject(createSubjectInput: $createSubjectInput) {
                id
              }
            }
          `,
          variables: {
            createSubjectInput: subject,
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Asignatura creada');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toast.showError(error.message);
          },
        });
    }
  }
}
