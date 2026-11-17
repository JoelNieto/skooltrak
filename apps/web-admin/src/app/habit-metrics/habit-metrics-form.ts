import { Button, Toast, UiCheckbox, UiChoice, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-habit-metrics-form',
  imports: [UiCheckbox, UiChoice, UiField, UiInput, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <ui-field label="Nombre" [field]="form.name">
      <input uiInput type="text" [formField]="form.name" placeholder="Ej: Responsabilidad, Respeto, Puntualidad" />
    </ui-field>
    <ui-field label="Descripción" [field]="form.description">
      <textarea
        uiInput
        [formField]="form.description"
        rows="3"
        placeholder="Descripción opcional del criterio"
      ></textarea>
    </ui-field>
    <ui-field label="Orden de visualización" [field]="form.order">
      <input uiInput type="number" [formField]="form.order" />
    </ui-field>
    <div class="form-control">
      <ui-choice label="Activo">
        <input uiCheckbox tone="neutral" type="checkbox" [formField]="form.active" />
      </ui-choice>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class HabitMetricsForm {
  public closeModal = output<boolean>();
  public data = input<{
    metric?: Prisma.HabitMetricGetPayload<{ include: undefined }>;
  }>();
  private toast = inject(Toast);
  private http = inject(HttpClient);
  private habitMetricsModel = signal<{
    name: string;
    description: string;
    order: number;
    active: boolean;
  }>({
    name: '',
    description: '',
    order: 0,
    active: true,
  });

  public form = form(this.habitMetricsModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre es requerido' });
    required(schemaPath.order, { message: 'El orden es requerido' });
    min(schemaPath.order, 0, { message: 'El orden debe ser mayor o igual a 0' });
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.metric) {
        const metric = this.data()!.metric!;
        this.form().value.set({
          name: metric.name,
          description: metric.description ?? '',
          order: metric.order,
          active: metric.active,
        });
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    const body = this.form().value();
    if (this.data()?.metric) {
      void firstValueFrom(this.http.patch('/api/v1/habit-metrics', { ...body, id: this.data()!.metric!.id }))
        .then(() => {
          this.toast.showSuccess('Criterio actualizado exitosamente');
          this.closeModal.emit(true);
        })
        .catch((error) => {
          this.toast.showError('Error al actualizar el criterio');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/habit-metrics', body))
        .then(() => {
          this.toast.showSuccess('Criterio creado exitosamente');
          this.closeModal.emit(true);
        })
        .catch((error) => {
          this.toast.showError('Error al crear el criterio');
          console.error(error);
        });
    }
  }
}
