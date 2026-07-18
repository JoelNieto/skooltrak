import { markGroupDirty, TextEditor, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({
  selector: 'app-grades-form',
  imports: [ReactiveFormsModule, TextEditor],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-4 gap-4">
      <div class="fieldset md:col-span-2">
        <label for="title">Titulo</label>
        <input type="text" formControlName="title" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="bucketId">Tipo</label>
        <select formControlName="bucketId" class="select select-primary">
          @for (bucket of bucketsResource.value()!; track bucket.id) {
            <option [value]="bucket.id">{{ bucket.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="date">Fecha</label>
        <input type="date" formControlName="date" class="input input-primary" />
      </div>
      <div class="fieldset md:col-span-4">
        <label for="comments">Comentarios</label>
        <lib-text-editor formControlName="comments" [bordered]="true" />
      </div>

      <div class="fieldset">
        <label for="published">Publicada</label>
        <input type="checkbox" formControlName="published" class="checkbox checkbox-primary" />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <button class="btn btn-soft" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class GradesForm {
  public closeModal = output<boolean>();
  public data = input.required<{ courseId: string; periodId: string }>();
  #http = inject(HttpClient);
  #toast = inject(Toast);

  #fb = inject(NonNullableFormBuilder);
  public bucketsResource = httpResource<Array<{ id: string; name: string }>>(
    () => {
      const courseId = this.data().courseId;
      return courseId ? `/api/v1/grade-buckets/by-course/${courseId}` : undefined;
    },
    { defaultValue: [] },
  );

  public form = this.#fb.group({
    title: ['', [Validators.required]],
    comments: ['', []],
    bucketId: ['', [Validators.required]],
    published: [false, []],
    date: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.form.invalid) {
      this.#toast.showError('Por favor, completa todos los campos');
      markGroupDirty(this.form);
      return;
    }

    this.#http
      .post('/api/v1/grades', {
        ...this.form.getRawValue(),
        courseId: this.data().courseId,
        periodId: this.data().periodId,
      })
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Calificacion creada exitosamente');
          this.closeModal.emit(true);
        },
        error: (error) => {
          this.#toast.showError(error.message);
        },
      });
  }
}
