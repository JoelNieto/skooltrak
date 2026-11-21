import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
      @if (data().published) {
        <ui-field
          label="Motivo del cambio"
          [field]="form.reason"
          hint="La calificación está publicada: indica por qué cambias la nota (3 a 300 caracteres)."
        >
          <textarea uiInput [formField]="form.reason" id="reason"></textarea>
        </ui-field>
      }
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
    /** The grade is published: a score change needs a reason (BR-ASM-001.8). */
    published?: boolean;
  }>();
  #toast = inject(Toast);
  public closeModal = output<boolean>();
  #http = inject(HttpClient);

  formModel = signal<{ score: number | null; comments: string; reason: string }>({ score: 0, comments: '', reason: '' });

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

    const { score, comments, reason } = this.formModel();
    const previous = this.data().studentGrade.score;
    const scoreChanged = Number(score) !== (previous === null || previous === undefined ? null : Number(previous));
    if (this.data().published && scoreChanged && (reason.trim().length < 3 || reason.trim().length > 300)) {
      this.#toast.showError('Indica el motivo del cambio');
      return;
    }

    this.#http
      .patch('/api/v1/student-grades', {
        score: Number(score),
        comments,
        id: this.data().studentGrade.id,
        ...(this.data().published && scoreChanged ? { reason: reason.trim() } : {}),
      })
      .subscribe({
        next: () => {
          this.closeModal.emit(true);
          this.#toast.showSuccess('Calificacion actualizada correctamente');
        },
        error: (error: unknown) => {
          const message = error instanceof HttpErrorResponse && error.status === 400 ? error.error?.message : null;
          this.#toast.showError(typeof message === 'string' ? message : 'Error al actualizar la calificacion');
        },
      });
  }
}
