import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import Store from '../../core/store';
@Component({
  selector: 'app-degrees-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input type="text" id="name" [formField]="form.name" class="input input-primary" ç />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input
          type="text"
          id="shortName"
          [formField]="form.shortName"
          class="input input-primary"
          [class.ng-invalid]="form.shortName().touched() && form.shortName().invalid()"
        />
      </div>
      <div class="fieldset">
        <label for="schoolId">Escuela</label>
        <select
          id="schoolId"
          [formField]="form.schoolId"
          class="select select-primary"
          [class.ng-invalid]="form.schoolId().touched() && form.schoolId().invalid()"
        >
          @for (school of schools.value(); track school.id) {
            <option [value]="school.id">{{ school.name }}</option>
          }
        </select>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" (click)="closeModal.emit()" type="button">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class DegreesForm {
  public store = inject(Store);
  public data = input<{
    degree?: Prisma.DegreeGetPayload<{ include: { school: true } }>;
  }>();
  public closeModal = output<void>();
  #http = inject(HttpClient);
  private toasts = inject(Toast);
  public schools = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/schools', { defaultValue: [] });

  private formModel = signal({ name: '', shortName: '', schoolId: '' });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto requerido' });
    required(schemaPath.schoolId, { message: 'Colegio requerido' });
    disabled(schemaPath.schoolId, { when: () => !!this.data()?.degree });
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.store.currentSchoolId()) {
        this.form.schoolId().value.set(this.store.currentSchoolId()!);
      }
    });

    afterRenderEffect(() => {
      if (this.data()?.degree) {
        this.formModel.set(this.data()!.degree!);
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.form.shortName().markAsTouched();
      this.form.name().markAsTouched();
      this.toasts.showError('Llenar todos los campos');
      return;
    }
    const request = this.formModel();

    if (this.data()?.degree) {
      this.#http.patch('/api/v1/degrees', { ...request, id: this.data()!.degree!.id }).subscribe({
        next: () => {
          this.toasts.showSuccess('Nivel actualizado exitosamente');
          this.closeModal.emit();
        },
        error: (err) => {
          this.toasts.showError(err.message);
        },
      });
      return;
    }

    this.#http.post('/api/v1/degrees', request).subscribe({
      next: () => {
        this.toasts.showSuccess('Nivel guardado exitosamente');
        this.closeModal.emit();
      },
      error: (err) => {
        this.toasts.showError(err.message);
      },
    });
  }
}
