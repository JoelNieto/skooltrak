import { markGroupDirty, Toast } from '@/ui';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
@Component({
  selector: 'app-grade-student-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-3">
      <div class="fieldset">
        <label for="score">Calificacion</label>
        <input
          type="number"
          formControlName="score"
          id="score"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="comments">Comentarios</label>
        <textarea
          formControlName="comments"
          id="comments"
          class="textarea textarea-primary"
        ></textarea>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-2">
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradeStudentForm {
  public data = input.required<{
    gradeStudent: Prisma.GradeStudentGetPayload<{ include: { student: true } }>;
    metric: Prisma.GradeMetricGetPayload<{ include: undefined }>;
  }>();
  #fb = inject(NonNullableFormBuilder);
  #toast = inject(Toast);
  public closeModal = output<boolean>();
  #apollo = inject(Apollo);

  public form = this.#fb.group({
    score: this.#fb.control<number | Prisma.Decimal | null>(0),
    comments: [''],
  });

  constructor() {
    afterRenderEffect(() => {
      this.form.setValue({
        score: this.data().gradeStudent.score,
        comments: this.data().gradeStudent.comments || '',
      });

      this.form
        .get('score')
        ?.setValidators([
          Validators.min(this.data().metric.minimum as unknown as number),
          Validators.max(this.data().metric.maximum as unknown as number),
        ]);
    });
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.#toast.showError('Formulario invalido');
      markGroupDirty(this.form);
      return;
    }

    this.#apollo
      .mutate({
        mutation: gql`
          mutation UpdateGradeStudent(
            $updateGradeStudentInput: UpdateGradeStudentInput!
          ) {
            updateGradeStudent(
              updateGradeStudentInput: $updateGradeStudentInput
            ) {
              id
              score
              comments
              gradeId
              studentId
              createdAt
              updatedAt
            }
          }
        `,
        variables: {
          updateGradeStudentInput: {
            ...this.form.getRawValue(),
            id: this.data().gradeStudent.id,
          },
        },
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
