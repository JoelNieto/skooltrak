import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-grade-bucket-form',
  imports: [FormField],
  template: `
    <form (ngSubmit)="onSubmit()">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input id="name" [formField]="form.name" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="weight">Ponderacion</label>
        <input id="weight" [formField]="form.weight" type="number" class="input input-primary" />
      </div>
      <div class="flex justify-end gap-2 mt-2">
        <button type="button" class="btn btn-ghost" (click)="closeModal.emit(false)">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `,
})
export default class GradeBucketForm {
  public closeModal = output<boolean>();
  public data = input.required<{
    courseId: string;
    bucket?: { name: string; weight: number; id: string };
  }>();
  #toast = inject(Toast);
  #http = inject(HttpClient);
  formModel = signal<{ name: string; weight: number }>({
    name: '',
    weight: 0,
  });
  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre es requerido' });
    required(schemaPath.weight, { message: 'La ponderacion es requerida' });
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data().bucket) {
        this.formModel.set({
          name: this.data().bucket!.name,
          weight: this.data().bucket?.weight ?? 0,
        });
      }
    });
  }

  public onSubmit() {
    if (this.form().invalid()) {
      this.#toast.showError('Formulario invalido');
      return;
    }
    if (this.data().bucket) {
      const raw = this.form().value();
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
    const raw = this.form().value();
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
