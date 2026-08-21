import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, max, min } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-student-grade-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-3">
      <div class="fieldset">
        <label for="score">Calificacion</label>
        <input
          type="number"
          [formField]="form.score"
          id="score"
          class="input input-primary"
          [class.ng-invalid]="form.score().touched() && form.score().invalid"
        />
        @if (form.score().touched() && form.score().invalid()) {
          @for (error of form.score().errors(); track error) {
            <p class="text-error text-sm">{{ error.message }}</p>
          }
        }
      </div>
      <div class="fieldset">
        <label for="comments">Comentarios</label>
        <textarea [formField]="form.comments" id="comments" class="textarea textarea-primary"></textarea>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-2">
      <button type="button" class="btn btn-ghost" (click)="closeModal.emit(false)">Cancelar</button>
      <button type="submit" class="btn btn-primary">Guardar</button>
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
