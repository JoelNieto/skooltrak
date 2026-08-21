import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-grade-metrics-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="fieldset">
      <label for="name">Nombre</label>
      <input type="text" [formField]="form.name" class="input input-primary" />
    </div>
    <div class="fieldset">
      <label for="minimum">Minimo</label>
      <input type="number" [formField]="form.minimum" class="input input-primary" />
    </div>
    <div class="fieldset">
      <label for="maximum">Maximo</label>
      <input type="number" [formField]="form.maximum" class="input input-primary" />
    </div>
    <div class="fieldset">
      <label for="minimumApproval">Minimo de aprobacion</label>
      <input type="number" [formField]="form.minimumApproval" class="input input-primary" />
    </div>
    <div class="fieldset">
      <label for="minimumExcellence">Minimo de excelencia</label>
      <input type="number" [formField]="form.minimumExcellence" class="input input-primary" />
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
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
