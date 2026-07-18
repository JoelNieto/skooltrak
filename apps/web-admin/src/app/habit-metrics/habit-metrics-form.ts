import { markGroupDirty, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, input, OnInit, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-habit-metrics-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="fieldset">
      <label for="name">Nombre</label>
      <input
        type="text"
        formControlName="name"
        class="input input-primary"
        placeholder="Ej: Responsabilidad, Respeto, Puntualidad"
      />
    </div>
    <div class="fieldset">
      <label for="description">Descripción</label>
      <textarea
        formControlName="description"
        class="textarea textarea-primary"
        rows="3"
        placeholder="Descripción opcional del criterio"
      ></textarea>
    </div>
    <div class="fieldset">
      <label for="order">Orden de visualización</label>
      <input type="number" formControlName="order" class="input input-primary" min="0" />
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-start gap-4">
        <input type="checkbox" formControlName="active" class="checkbox" />
        <span class="label-text">Activo</span>
      </label>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class HabitMetricsForm implements OnInit {
  public closeModal = output<boolean>();
  public data = input<{
    metric?: Prisma.HabitMetricGetPayload<{ include: undefined }>;
  }>();
  private fb = inject(NonNullableFormBuilder);
  private toast = inject(Toast);
  private http = inject(HttpClient);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    order: [0, [Validators.required]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data()?.metric) {
      const metric = this.data()!.metric!;
      this.form.patchValue({
        name: metric.name,
        description: metric.description ?? '',
        order: metric.order,
        active: metric.active,
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toast.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    const body = this.form.getRawValue();
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
