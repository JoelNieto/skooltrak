import { Toast } from '@/ui';
import {
  afterRenderEffect,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Field, form, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-subjects-form',
  imports: [Field],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input
          type="text"
          id="name"
          [field]="form.name"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input
          type="text"
          id="shortName"
          [field]="form.shortName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="code">Código</label>
        <input
          type="text"
          id="code"
          [field]="form.code"
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
export default class SubjectsForm {
  public closeModal = output<void>();
  public data = input<{ subject?: Prisma.SubjectGetPayload<false> }>();
  private toast = inject(Toast);
  private apollo = inject(Apollo);
  #subject = signal<Omit<Prisma.SubjectUncheckedCreateInput, 'organizationId'>>(
    {
      name: '',
      shortName: '',
      code: '',
    }
  );
  public form = form(this.#subject, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto es requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      const subject = this.data()?.subject;
      if (subject) {
        this.#subject.set({
          name: subject.name,
          shortName: subject.shortName,
          code: subject.code,
        });
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Datos inválidos');
      this.form().markAsDirty();
      return;
    }

    const subject = this.form().value();

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
