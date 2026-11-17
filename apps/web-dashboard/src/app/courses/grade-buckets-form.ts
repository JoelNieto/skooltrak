import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-grade-bucket-form',
  imports: [UiField, UiInput, Button, FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Ponderacion" [field]="form.weight">
        <input uiInput id="weight" [formField]="form.weight" type="number" />
      </ui-field>
      <div class="flex justify-end gap-2 mt-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
        <button uiButton variant="primary" type="submit">Guardar</button>
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

  public onSubmit(event: Event) {
    event.preventDefault();
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
