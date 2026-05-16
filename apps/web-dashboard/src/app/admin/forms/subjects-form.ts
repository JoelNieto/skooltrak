import { Toast } from '@/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-subjects-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)" novalidate="novalidate">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input
          type="text"
          id="name"
          [formField]="form.name"
          class="input input-primary"
          [class.ng-dirty]="form.name().dirty()"
          [class.ng-invalid]="form.name().invalid()"
        />
        @if (form.name().invalid() && form.name().dirty()) {
          <ul>
            @for (error of form.name().errors(); track error) {
              <li class="text-error">{{ error.message }}</li>
            }
          </ul>
        }
      </div>
      <div class="fieldset">
        <label for="code">Código</label>
        <input
          type="text"
          id="code"
          [formField]="form.code"
          class="input input-primary"
          [class.ng-dirty]="form.code().dirty()"
          [class.ng-invalid]="form.code().invalid()"
        />
        @if (form.code().invalid() && form.code().dirty()) {
          <ul>
            @for (error of form.code().errors(); track error) {
              <li class="text-error">{{ error.message }}</li>
            }
          </ul>
        }
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" (click)="closeModal.emit()" type="button">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class SubjectsForm {
  public closeModal = output<void>();
  public data = input<{ subject?: Prisma.SubjectGetPayload<false> }>();
  private toast = inject(Toast);
  #http = inject(HttpClient);
  #subject = signal<Omit<Prisma.SubjectUncheckedCreateInput, 'organizationId'>>({
    name: '',
    code: '',
  });
  public form = form(this.#subject, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      const subject = this.data()?.subject;
      if (subject) {
        this.#subject.set({
          name: subject.name,
          code: subject.code,
        });
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Datos inválidos');
    }
    this.form.name().markAsDirty();
    this.form.code().markAsDirty();
    submit(this.form, async () => {
      const subject = this.form().value();
      const subjectId = this.data()?.subject?.id ?? '';

      if (this.data()?.subject) {
        this.#http
          .patch('/api/v1/subjects', {
            ...subject,
            id: subjectId,
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
        this.#http.post('/api/v1/subjects', subject).subscribe({
          next: () => {
            this.toast.showSuccess('Asignatura creada');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toast.showError(error.message);
          },
        });
      }
    });
  }
}
