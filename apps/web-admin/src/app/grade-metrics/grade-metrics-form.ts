import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-grade-metrics-form',
  imports: [UiField, UiInput, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <ui-field label="Nombre" [field]="form.name">
      <input uiInput type="text" [formField]="form.name" />
    </ui-field>
    <ui-field label="Minimo" [field]="form.minimum">
      <input uiInput type="number" [formField]="form.minimum" />
    </ui-field>
    <ui-field label="Maximo" [field]="form.maximum">
      <input uiInput type="number" [formField]="form.maximum" />
    </ui-field>
    <ui-field label="Minimo de aprobacion" [field]="form.minimumApproval">
      <input uiInput type="number" [formField]="form.minimumApproval" />
    </ui-field>
    <ui-field label="Minimo de excelencia" [field]="form.minimumExcellence">
      <input uiInput type="number" [formField]="form.minimumExcellence" />
    </ui-field>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class GradeMetricsForm {
  public closeModal = output<boolean>();
  public data = input<{
    metric: Prisma.GradeMetricGetPayload<{ include: undefined }>;
  }>();
  private toast = inject(Toast);
  private http = inject(HttpClient);

  private formModel = signal({
    name: '',
    minimum: 0,
    maximum: 0,
    minimumApproval: 0,
    minimumExcellence: 0,
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.minimum, { message: 'Valor minimo requerido' });
    min(schemaPath.minimum, 0, { message: 'Valor minimo de 0' });
    required(schemaPath.maximum, { message: 'Valor maximo requerido' });
    required(schemaPath.minimumApproval, { message: 'Valor minimo aprobacion requerido' });
    required(schemaPath.minimumExcellence, { message: 'Valor minimo excelencia requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.metric) {
        const metric = this.data()!.metric;
        const value = {
          ...metric,
          minimum: metric.minimum as unknown as number,
          maximum: metric.maximum as unknown as number,
          minimumApproval: metric.minimumApproval as unknown as number,
          minimumExcellence: metric.minimumExcellence as unknown as number,
        };
        this.formModel.set(value);
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }

    const body = this.formModel();
    if (this.data()?.metric) {
      void firstValueFrom(this.http.patch('/api/v1/grade-metrics', { ...body, id: this.data()!.metric!.id }))
        .then(() => {
          this.toast.showSuccess('Metrica de calificaciones actualizada exitosamente');
          this.closeModal.emit(true);
        })
        .catch((error) => {
          this.toast.showError('Error al actualizar la metrica de calificaciones');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/grade-metrics', body))
        .then(() => {
          this.toast.showSuccess('Metrica de calificaciones creada exitosamente');
          this.closeModal.emit(true);
        })
        .catch((error) => {
          this.toast.showError('Error al crear la metrica de calificaciones');
          console.error(error);
        });
    }
  }
}
