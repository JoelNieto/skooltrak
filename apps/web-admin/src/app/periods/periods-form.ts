import { markGroupDirty, Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { format } from 'date-fns';

@Component({
  selector: 'app-periods-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input type="text" id="name" formControlName="name" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input type="text" id="shortName" formControlName="shortName" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="year">Año</label>
        <input type="number" id="year" formControlName="year" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="startDate">Fecha de inicio</label>
        <input type="date" id="startDate" formControlName="startDate" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="endDate">Fecha de fin</label>
        <input type="date" id="endDate" formControlName="endDate" class="input input-primary" />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class PeriodsForm implements OnInit {
  public closeModal = output<boolean>();
  public data = input<{
    period?: Prisma.PeriodGetPayload<{ include: undefined }>;
  }>();
  private fb = inject(NonNullableFormBuilder);
  private toast = inject(Toast);
  private http = inject(HttpClient);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required]],
    startDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
    endDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
  });

  ngOnInit(): void {
    if (this.data()?.period) {
      const period = this.data()!.period!;
      this.form.patchValue({
        ...period,
        startDate: format(period.startDate, 'yyyy-MM-dd'),
        endDate: format(period.endDate, 'yyyy-MM-dd'),
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }

    const body = this.form.getRawValue();
    if (this.data()?.period) {
      void firstValueFrom(
        this.http.patch('/api/v1/periods', { ...body, id: this.data()!.period!.id }),
      )
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
