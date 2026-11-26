import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

/** A period as GET /v1/periods/schools/:schoolId returns it. */
export interface SchoolPeriodRow {
  id: string;
  year: number;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  /** The school's own period (false: a global one). */
  custom: boolean;
  /** The school's grade columns and habit evaluations in it. */
  usage: number;
}

export interface SchoolPeriodsYear {
  year: number;
  custom: boolean;
  periods: SchoolPeriodRow[];
}

const day = (iso: string) => iso.slice(0, 10);

/**
 * Creates or edits one of a school's own periods. Dates can cross calendar years (e.g. an American
 * school year from August to June).
 */
@Component({
  selector: 'app-school-period-form',
  imports: [UiField, UiInput, Button, FormsModule],
  template: `
    <form (submit)="onSubmit($event)">
      @if (!data().period && !data().custom) {
        <p class="text-sm text-ink-muted mb-3">
          El colegio pasará a usar periodos propios en {{ data().year }}: se copiarán los periodos globales del año
          (con sus calificaciones) y se agregará este.
        </p>
      }
      <div class="flex flex-col gap-2">
        <ui-field label="Nombre" required>
          <input uiInput type="text" name="name" [(ngModel)]="name" placeholder="Primer trimestre" />
        </ui-field>
        <ui-field label="Nombre corto" hint="Se usa en encabezados del boletín, p. ej. Q1 o T1">
          <input uiInput type="text" name="shortName" [(ngModel)]="shortName" placeholder="Q1" />
        </ui-field>
        <ui-field label="Fecha de inicio" required>
          <input uiInput type="date" name="startDate" [(ngModel)]="startDate" />
        </ui-field>
        <ui-field label="Fecha de fin" required [error]="dateError()">
          <input uiInput type="date" name="endDate" [(ngModel)]="endDate" />
        </ui-field>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()">Guardar</button>
      </div>
    </form>
  `,
})
export default class SchoolPeriodForm {
  public closeModal = output<boolean>();
  public data = input.required<{
    schoolId: string;
    year: number;
    /** Whether the school already uses its own periods this year. */
    custom: boolean;
    /** Absent: a new period. */
    period?: SchoolPeriodRow;
    /** Prefills the start date of a new period (e.g. the day after the last one ends). */
    suggestedStart?: string;
  }>();

  private http = inject(HttpClient);
  private toast = inject(Toast);

  protected readonly saving = signal(false);
  protected readonly name = linkedSignal(() => this.data().period?.name ?? '');
  protected readonly shortName = linkedSignal(() => this.data().period?.shortName ?? '');
  protected readonly startDate = linkedSignal(() => {
    const { period, suggestedStart } = this.data();
    return period ? day(period.startDate) : (suggestedStart ?? '');
  });
  protected readonly endDate = linkedSignal(() => {
    const period = this.data().period;
    return period ? day(period.endDate) : '';
  });

  protected readonly dateError = computed(() => {
    const [start, end] = [this.startDate(), this.endDate()];
    return start && end && start > end ? 'La fecha de fin debe ser posterior a la de inicio' : null;
  });

  async onSubmit(event: Event) {
    event.preventDefault();
    const [name, shortName, startDate, endDate] = [
      this.name().trim(),
      this.shortName().trim(),
      this.startDate(),
      this.endDate(),
    ];
    const invalid = !name ? 'El nombre es obligatorio' : !startDate || !endDate ? 'Indica las fechas' : this.dateError();
    if (invalid) {
      this.toast.showError(invalid);
      return;
    }

    const { schoolId, year, period } = this.data();
    const body = { name, shortName, startDate, endDate };
    this.saving.set(true);
    try {
      await firstValueFrom(
        period
          ? this.http.patch(`/api/v1/periods/schools/${schoolId}/${period.id}`, body)
          : this.http.post(`/api/v1/periods/schools/${schoolId}`, { ...body, year }),
      );
      this.toast.showSuccess(period ? 'Periodo actualizado' : 'Periodo creado');
      this.closeModal.emit(true);
    } catch (error) {
      const message = error instanceof HttpErrorResponse ? error.error?.message : null;
      this.toast.showError(typeof message === 'string' ? message : 'No se pudo guardar el periodo');
    } finally {
      this.saving.set(false);
    }
  }
}
