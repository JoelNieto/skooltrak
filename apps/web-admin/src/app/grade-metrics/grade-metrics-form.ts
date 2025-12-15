import { markGroupDirty, Toast } from '@/ui';
import { Component, inject, input, OnInit, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
@Component({
  selector: 'app-grade-metrics-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="fieldset">
      <label for="name">Nombre</label>
      <input type="text" formControlName="name" class="input input-primary" />
    </div>
    <div class="fieldset">
      <label for="minimum">Minimo</label>
      <input
        type="number"
        formControlName="minimum"
        class="input input-primary"
      />
    </div>
    <div class="fieldset">
      <label for="maximum">Maximo</label>
      <input
        type="number"
        formControlName="maximum"
        class="input input-primary"
      />
    </div>
    <div class="fieldset">
      <label for="minimumApproval">Minimo de aprobacion</label>
      <input
        type="number"
        formControlName="minimumApproval"
        class="input input-primary"
      />
    </div>
    <div class="fieldset">
      <label for="minimumExcellence">Minimo de excelencia</label>
      <input
        type="number"
        formControlName="minimumExcellence"
        class="input input-primary"
      />
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button
        class="btn btn-ghost"
        type="button"
        (click)="closeModal.emit(false)"
      >
        Cancelar
      </button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class GradeMetricsForm implements OnInit {
  public closeModal = output<boolean>();
  public data = input<{
    metric: Prisma.GradeMetricGetPayload<{ include: undefined }>;
  }>();
  private fb = inject(NonNullableFormBuilder);
  private toast = inject(Toast);
  private apollo = inject(Apollo);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    minimum: [0, [Validators.required]],
    maximum: [0, [Validators.required]],
    minimumApproval: [0, [Validators.required]],
    minimumExcellence: [0, [Validators.required]],
  });

  ngOnInit(): void {
    if (this.data()?.metric) {
      const metric = this.data()!.metric;
      const value = {
        ...metric,
        minimum: metric.minimum as unknown as number,
        maximum: metric.maximum as unknown as number,
        minimumApproval: metric.minimumApproval as unknown as number,
        minimumExcellence: metric.minimumExcellence as unknown as number,
      };
      this.form.patchValue(value);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }

    if (this.data()?.metric) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateGradeMetric(
              $updateGradeMetricInput: UpdateGradeMetricInput!
            ) {
              updateGradeMetric(
                updateGradeMetricInput: $updateGradeMetricInput
              ) {
                id
                name
                minimum
                maximum
                minimumApproval
                minimumExcellence
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            updateGradeMetricInput: {
              ...this.form.value,
              id: this.data()!.metric!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess(
              'Metrica de calificaciones actualizada exitosamente'
            );
            this.closeModal.emit(true);
          },
          error: (error) => {
            this.toast.showError(
              'Error al actualizar la metrica de calificaciones'
            );
            console.error(error);
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: gql`
            mutation CreateGradeMetric(
              $createGradeMetricInput: CreateGradeMetricInput!
            ) {
              createGradeMetric(
                createGradeMetricInput: $createGradeMetricInput
              ) {
                id
                name
                minimum
                maximum
                minimumApproval
                minimumExcellence
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            createGradeMetricInput: {
              ...this.form.value,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess(
              'Metrica de calificaciones creada exitosamente'
            );
            this.closeModal.emit(true);
          },
          error: (error) => {
            this.toast.showError('Error al crear la metrica de calificaciones');
            console.error(error);
          },
        });
    }
  }
}
