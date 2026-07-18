import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';

type Decimal = InstanceType<typeof Prisma.Decimal>;

@Component({
  selector: 'app-grade-bucket-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input id="name" formControlName="name" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="weight">Ponderacion</label>
        <input id="weight" formControlName="weight" type="number" class="input input-primary" />
      </div>
      <div class="flex justify-end gap-2 mt-2">
        <button type="button" class="btn btn-ghost" (click)="closeModal.emit(false)">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `,
})
export default class GradeBucketForm implements OnInit {
  public closeModal = output<boolean>();
  public data = input.required<{
    courseId: string;
    bucket?: Prisma.GradeBucketGetPayload<{ include: undefined }>;
  }>();
  #fb = inject(NonNullableFormBuilder);
  #toast = inject(Toast);
  #http = inject(HttpClient);
  public form = this.#fb.group({
    name: ['', [Validators.required]],
    weight: this.#fb.control<number | Decimal>(0, [Validators.required]),
  });

  ngOnInit() {
    if (this.data().bucket) {
      this.form.patchValue(this.data().bucket!);
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.#toast.showError('Formulario invalido');
      return;
    }
    if (this.data().bucket) {
      const raw = this.form.getRawValue();
      this.#http
        .patch('/api/v1/grade-buckets', {
          name: raw.name,
          id: this.data().bucket!.id,
          weight: Number(raw.weight),
        })
        .subscribe({
          next: () => {
            this.closeModal.emit(true);
            this.#toast.showSuccess('Ponderacion actualizada correctamente');
          },
          error: (error) => {
            console.error(error);
            this.#toast.showError('Error al actualizar la ponderacion');
          },
        });
      return;
    }
    const raw = this.form.getRawValue();
    this.#http
      .post('/api/v1/grade-buckets', {
        name: raw.name,
        weight: Number(raw.weight),
        courseId: this.data().courseId,
      })
      .subscribe({
        next: () => {
          this.closeModal.emit(true);
          this.#toast.showSuccess('Ponderacion creada correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al crear la ponderacion');
        },
      });
  }
}
