import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-subjects-form',
  imports: [UiField, UiInput, Button, FormField],
  template: `<form (submit)="onSubmit($event)" novalidate="novalidate">
    <div class="flex flex-col gap-2">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Código" [field]="form.code">
        <input uiInput type="text" id="code" [formField]="form.code" />
      </ui-field>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" (click)="closeModal.emit()" type="button">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
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
