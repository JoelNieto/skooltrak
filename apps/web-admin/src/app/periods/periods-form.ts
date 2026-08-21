import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { format } from 'date-fns';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-periods-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input type="text" id="name" [formField]="form.name" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input type="text" id="shortName" [formField]="form.shortName" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="year">Año</label>
        <input type="number" id="year" [formField]="form.year" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="startDate">Fecha de inicio</label>
        <input type="date" id="startDate" [formField]="form.startDate" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="endDate">Fecha de fin</label>
        <input type="date" id="endDate" [formField]="form.endDate" class="input input-primary" />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class PeriodsForm {
  public closeModal = output<boolean>();
  public data = input<{
    period?: Prisma.PeriodGetPayload<{ include: undefined }>;
  }>();
  private toast = inject(Toast);
  private http = inject(HttpClient);

  private formModel = signal({
    name: '',
    shortName: '',
    year: new Date().getFullYear(),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto requerido' });
    required(schemaPath.year);
    required(schemaPath.startDate);
    required(schemaPath.endDate);
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.period) {
        const period = this.data()!.period!;
        this.formModel.set({
          ...period,
          startDate: format(period.startDate, 'yyyy-MM-dd'),
          endDate: format(period.endDate, 'yyyy-MM-dd'),
        });
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
    if (this.data()?.period) {
      void firstValueFrom(this.http.patch('/api/v1/periods', { ...body, id: this.data()!.period!.id }))
        .then(() => {
          this.toast.showSuccess('Periodo actualizado correctamente');
          this.closeModal.emit(true);
        })
        .catch((error) => {
          this.toast.showError('Error al actualizar el periodo');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/periods', body))
        .then(() => {
          this.toast.showSuccess('Periodo creado correctamente');
          this.closeModal.emit(true);
        })
        .catch((error) => {
          this.toast.showError('Error al crear el periodo');
          console.error(error);
        });
    }
  }
}
