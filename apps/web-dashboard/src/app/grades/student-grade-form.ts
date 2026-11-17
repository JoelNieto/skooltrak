import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, max, min } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-student-grade-form',
  imports: [UiField, UiInput, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-3">
      <ui-field label="Calificacion" [field]="form.score">
        <input uiInput type="number" [formField]="form.score" id="score" />
      </ui-field>
      <ui-field label="Comentarios" [field]="form.comments">
        <textarea uiInput [formField]="form.comments" id="comments"></textarea>
      </ui-field>
    </div>
    <div class="flex justify-end gap-2 mt-2">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class StudentGradeForm {
  public data = input.required<{
    studentGrade: Prisma.StudentGradeGetPayload<{ include: { student: true } }>;
    metric: Prisma.GradeMetricGetPayload<{ include: undefined }>;
  }>();
  #toast = inject(Toast);
  public closeModal = output<boolean>();
  #http = inject(HttpClient);

  formModel = signal<{ score: number | null; comments: string }>({ score: 0, comments: '' });

  public form = form(this.formModel, (schemaPath) => {
    const minimum = this.data().metric.minimum as unknown as number;
    const maximum = this.data().metric.maximum as unknown as number;
    min(schemaPath.score, minimum, { message: `Valor debe ser mayor o igual a ${minimum}` });
    max(schemaPath.score, maximum, { message: `Valor debe ser menor o igual a ${maximum}` });
  });

  constructor() {
    afterRenderEffect(() => {
      const { score, comments } = this.data().studentGrade;
      this.form.score().value.set(score as unknown as number);
      this.form.comments().value.set(comments ?? '');
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.#toast.showError('Formulario invalido');
      return;
    }

    const { score, comments } = this.formModel();

    this.#http
      .patch('/api/v1/student-grades', {
        score: Number(score),
        comments,
        id: this.data().studentGrade.id,
      })
      .subscribe({
        next: () => {
          this.closeModal.emit(true);
          this.#toast.showSuccess('Calificacion actualizada correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al actualizar la calificacion');
        },
      });
  }
}
