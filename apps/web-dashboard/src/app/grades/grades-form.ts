import { TextEditor, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
@Component({
  selector: 'app-grades-form',
  imports: [FormField, TextEditor],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col md:grid md:grid-cols-4 gap-4">
      <div class="fieldset md:col-span-2">
        <label for="title">Titulo</label>
        <input
          type="text"
          [formField]="form.title"
          class="input input-primary"
          [class.ng-invalid]="form.title().touched() && form.title().invalid()"
        />
        @if (form.title().touched() && form.title().invalid()) {
          @for (error of form.title().errors(); track error) {
            <p class="text-error text-sm">{{ error.message }}</p>
          }
        }
      </div>
      <div class="fieldset">
        <label for="bucketId">Tipo</label>
        <select
          [formField]="form.bucketId"
          class="select select-primary"
          [class.ng-invalid]="form.bucketId().touched() && form.bucketId().invalid()"
        >
          @for (bucket of bucketsResource.value()!; track bucket.id) {
            <option [value]="bucket.id">{{ bucket.name }}</option>
          }
        </select>
        @if (form.bucketId().touched() && form.bucketId().invalid()) {
          @for (error of form.bucketId().errors(); track error) {
            <p class="text-error text-sm">{{ error.message }}</p>
          }
        }
      </div>
      <div class="fieldset">
        <label for="date">Fecha</label>
        <input
          type="date"
          [formField]="form.date"
          class="input input-primary"
          [class.ng-invalid]="form.date().touched() && form.date().invalid()"
        />
        @if (form.date().touched() && form.date().invalid()) {
          @for (error of form.date().errors(); track error) {
            <p class="text-error text-sm">{{ error.message }}</p>
          }
        }
      </div>
      <div class="fieldset md:col-span-4">
        <label for="comments">Comentarios</label>
        <lib-text-editor [formField]="form.comments" [bordered]="true" />
      </div>

      <div class="fieldset">
        <label for="published">Publicada</label>
        <input type="checkbox" [formField]="form.published" class="checkbox checkbox-primary" />
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

  public bucketsResource = httpResource<Array<{ id: string; name: string }>>(
    () => {
      const courseId = this.data().courseId;
      return courseId ? `/api/v1/grade-buckets/by-course/${courseId}` : undefined;
    },
    { defaultValue: [] },
  );

  private formModel = signal({
    title: '',
    comments: '',
    bucketId: '',
    published: false,
    date: '',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Titulo requerido' });
    required(schemaPath.bucketId, { message: 'Tipo de calificacion requerido' });
    required(schemaPath.date, { message: 'Fecha requerida' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.#toast.showError('Por favor, completa todos los campos');
      return;
    }

    this.#http
      .post('/api/v1/grades', {
        ...this.formModel(),
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
