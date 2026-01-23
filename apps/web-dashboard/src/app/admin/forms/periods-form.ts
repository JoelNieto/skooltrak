import { markGroupDirty, Toast } from '@/ui';
import {
  afterRenderEffect,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { format } from 'date-fns';
import Store from '../../core/store';
@Component({
  selector: 'app-periods-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="flex flex-col gap-2">
        <div class="fieldset">
          <label for="name">Nombre</label>
          <input
            type="text"
            id="name"
            formControlName="name"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="shortName">Nombre corto</label>
          <input
            type="text"
            id="shortName"
            formControlName="shortName"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="year">Año</label>
          <input
            type="number"
            id="year"
            formControlName="year"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="startDate">Fecha de inicio</label>
          <input
            type="date"
            id="startDate"
            formControlName="startDate"
            class="input input-primary"
          />
        </div>
        <div class="fieldset">
          <label for="endDate">Fecha de fin</label>
          <input
            type="date"
            id="endDate"
            formControlName="endDate"
            class="input input-primary"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-primary" type="submit">Guardar</button>
      </div>
    </form>
  `,
})
export default class PeriodsForm {
  public closeModal = output<boolean>();
  public data = input<{
    period?: Prisma.PeriodGetPayload<{ include: undefined }>;
  }>();
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private store = inject(Store);
  #fb = inject(NonNullableFormBuilder);
  public form = this.#fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required]],
    startDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
    endDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
  });

  constructor() {
    afterRenderEffect(() => {
      const period = this.data()?.period;
      if (period) {
        this.form.patchValue({
          ...period,
          startDate: format(period.startDate, 'yyyy-MM-dd'),
          endDate: format(period.endDate, 'yyyy-MM-dd'),
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Formulario inválido');
      markGroupDirty(this.form);
      return;
    }

    if (this.data()?.period) {
      this.updatePeriod();
    } else {
      this.createPeriod();
    }
  }

  createPeriod() {
    this.apollo
      .mutate({
        mutation: gql`
          mutation CreatePeriod($createPeriodInput: CreatePeriodInput!) {
            createPeriod(createPeriodInput: $createPeriodInput) {
              id
            }
          }
        `,
        variables: {
          createPeriodInput: {
            ...this.form.getRawValue(),
            schoolId: this.store.currentSchoolId(),
          },
        },
      })
      .subscribe({
        next: () => {
          this.closeModal.emit(true);
          this.toast.showSuccess('Periodo creado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al crear el periodo');
        },
      });
  }

  updatePeriod() {
    this.apollo
      .mutate({
        mutation: gql`
          mutation UpdatePeriod($updatePeriodInput: UpdatePeriodInput!) {
            updatePeriod(updatePeriodInput: $updatePeriodInput) {
              id
            }
          }
        `,
        variables: {
          updatePeriodInput: {
            ...this.form.getRawValue(),
            id: this.data()?.period?.id,
          },
        },
      })
      .subscribe({
        next: () => {
          this.closeModal.emit(true);
          this.toast.showSuccess('Periodo actualizado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al actualizar el periodo');
        },
      });
  }
}
