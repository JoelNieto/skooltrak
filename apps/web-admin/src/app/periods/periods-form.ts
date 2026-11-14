import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { format } from 'date-fns';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-periods-form',
  imports: [UiField, UiInput, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Nombre corto" [field]="form.shortName">
        <input uiInput type="text" id="shortName" [formField]="form.shortName" />
      </ui-field>
      <ui-field label="Año" [field]="form.year">
        <input uiInput type="number" id="year" [formField]="form.year" />
      </ui-field>
      <ui-field label="Fecha de inicio" [field]="form.startDate">
        <input uiInput type="date" id="startDate" [formField]="form.startDate" />
      </ui-field>
      <ui-field label="Fecha de fin" [field]="form.endDate">
        <input uiInput type="date" id="endDate" [formField]="form.endDate" />
      </ui-field>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
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
