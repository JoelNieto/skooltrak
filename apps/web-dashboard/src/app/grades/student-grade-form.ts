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
import { HttpClient } from '@angular/common/http';
import { Prisma } from '@generated/prisma';

type Decimal = InstanceType<typeof Prisma.Decimal>;

@Component({
  selector: 'app-student-grade-form',
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
export default class StudentGradeForm {
  public data = input.required<{
    studentGrade: Prisma.StudentGradeGetPayload<{ include: { student: true } }>;
    metric: Prisma.GradeMetricGetPayload<{ include: undefined }>;
  }>();
  #fb = inject(NonNullableFormBuilder);
  #toast = inject(Toast);
  public closeModal = output<boolean>();
  #http = inject(HttpClient);

  public form = this.#fb.group({
    score: this.#fb.control<number | Decimal | null>(0),
    comments: [''],
  });

  constructor() {
    afterRenderEffect(() => {
      this.form.setValue({
        score: this.data().studentGrade.score,
        comments: this.data().studentGrade.comments || '',
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

    this.#http
      .patch('/api/v1/student-grades', {
        score: Number(this.form.getRawValue().score),
        comments: this.form.getRawValue().comments,
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
