import { Button, TextEditor, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
@Component({
  selector: 'app-grades-form',
  imports: [UiCheckbox, UiChoice, UiField, UiInput, UiSelect, Button, FormField, TextEditor],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col md:grid md:grid-cols-4 gap-4">
      <ui-field
        label="Asignación"
        [field]="form.assignmentId"
        class="md:col-span-4"
        optional
        [hint]="form.assignmentId().value() ? 'La calificación toma el título y la fecha de la asignación.' : 'Vincula la calificación a una asignación del curso.'"
      >
        <select uiSelect [formField]="form.assignmentId">
          <option value="">Sin asignación</option>
          @for (assignment of linkable(); track assignment.id) {
            <option [value]="assignment.id">{{ assignment.title }}</option>
          }
        </select>
      </ui-field>
      <ui-field label="Titulo" [field]="form.title" class="md:col-span-2">
        <input uiInput type="text" [formField]="form.title" />
      </ui-field>
      <ui-field label="Tipo" [field]="form.bucketId">
        <select uiSelect [formField]="form.bucketId">
          @for (bucket of bucketsResource.value()!; track bucket.id) {
            <option [value]="bucket.id">{{ bucket.name }}</option>
          }
        </select>
      </ui-field>
      <ui-field label="Fecha" [field]="form.date">
        <input uiInput type="date" [formField]="form.date" />
      </ui-field>
      <ui-field label="Comentarios" class="md:col-span-4">
        <lib-text-editor [formField]="form.comments" [bordered]="true" />
      </ui-field>

      <ui-choice label="Publicada" [field]="form.published">
        <input uiCheckbox type="checkbox" [formField]="form.published" />
      </ui-choice>
    </div>
    <div class="flex justify-end gap-2">
      <button uiButton type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
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

  /** FR-ASM-001.11: the course's assignments not linked to a column yet (BR-ASM-001.11). */
  public assignmentsResource = httpResource<{ assignments: { id: string; title: string; date: string; gradeId: string | null }[] }>(
    () => {
      const courseId = this.data().courseId;
      return courseId ? `/api/v1/gradebook/${courseId}/assignments` : undefined;
    },
  );
  protected readonly linkable = computed(() => (this.assignmentsResource.value()?.assignments ?? []).filter((a) => !a.gradeId));

  private formModel = signal({
    assignmentId: '',
    title: '',
    comments: '',
    bucketId: '',
    published: false,
    date: '',
  });

  /** Only the picked assignment: the effect below writes the rest of the model. */
  private readonly assignmentId = computed(() => this.formModel().assignmentId);

  constructor() {
    // Picking an assignment fills the title and date the column takes from it (the API enforces it).
    effect(() => {
      const id = this.assignmentId();
      if (!id) return;
      const assignment = untracked(() => this.linkable().find((a) => a.id === id));
      if (!assignment) return;
      untracked(() =>
        this.formModel.update((model) => ({ ...model, title: assignment.title, date: assignment.date.slice(0, 10) })),
      );
    });
  }

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
        assignmentId: this.formModel().assignmentId || undefined,
        courseId: this.data().courseId,
        periodId: this.data().periodId,
      })
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Calificacion creada exitosamente');
          this.closeModal.emit(true);
        },
        error: (error) => {
          this.#toast.showError(typeof error?.error?.message === 'string' ? error.error.message : error.message);
        },
      });
  }
}
