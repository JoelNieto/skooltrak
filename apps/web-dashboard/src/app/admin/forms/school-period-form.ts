import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface PeriodValues {
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
}

/** A period as GET /v1/periods/schools/:schoolId returns it. */
export interface SchoolPeriodRow extends PeriodValues {
  id: string;
  year: number;
  overridden: boolean;
  defaults: PeriodValues;
  override: { [K in keyof PeriodValues]: string | null } | null;
}

const day = (iso: string) => iso.slice(0, 10);

/**
 * Overrides one global period for a school. Fields equal to the global value (or left empty) use it.
 */
@Component({
  selector: 'app-school-period-form',
  imports: [UiField, UiInput, Button, FormsModule],
  template: `
    @let defaults = period().defaults;
    <form (submit)="onSubmit($event)">
      <p class="text-sm text-ink-muted mb-3">
        Deja un campo vacío o con el valor global para seguir usando el de la plataforma.
      </p>
      <div class="flex flex-col gap-2">
        <ui-field label="Nombre" [hint]="'Global: ' + defaults.name">
          <input uiInput type="text" name="name" [(ngModel)]="name" [placeholder]="defaults.name" />
        </ui-field>
        <ui-field label="Nombre corto" [hint]="'Global: ' + (defaults.shortName || '—')">
          <input
            uiInput
            type="text"
            name="shortName"
            [(ngModel)]="shortName"
            [placeholder]="defaults.shortName"
          />
        </ui-field>
        <ui-field label="Fecha de inicio" [hint]="'Global: ' + defaultStart()">
          <input uiInput type="date" name="startDate" [(ngModel)]="startDate" />
        </ui-field>
        <ui-field label="Fecha de fin" [hint]="'Global: ' + defaultEnd()" [error]="dateError()">
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
  public data = input.required<{ schoolId: string; period: SchoolPeriodRow }>();

  private http = inject(HttpClient);
  private toast = inject(Toast);

  protected readonly period = computed(() => this.data().period);
  protected readonly defaultStart = computed(() => this.format(this.period().defaults.startDate));
  protected readonly defaultEnd = computed(() => this.format(this.period().defaults.endDate));
  protected readonly saving = signal(false);

  // Start from the effective values (override applied).
  protected readonly name = linkedSignal(() => this.period().name);
  protected readonly shortName = linkedSignal(() => this.period().shortName);
  protected readonly startDate = linkedSignal(() => day(this.period().startDate));
  protected readonly endDate = linkedSignal(() => day(this.period().endDate));

  protected readonly dateError = computed(() => {
    const start = this.startDate() || day(this.period().defaults.startDate);
    const end = this.endDate() || day(this.period().defaults.endDate);
    return start > end ? 'La fecha de fin debe ser posterior a la de inicio' : null;
  });

  private format(iso: string): string {
    const [y, m, d] = day(iso).split('-');
    return `${d}/${m}/${y}`;
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const dateError = this.dateError();
    if (dateError) {
      this.toast.showError(dateError);
      return;
    }
    const [name, shortName, startDate, endDate] = [this.name(), this.shortName(), this.startDate(), this.endDate()];
    const { schoolId, period } = this.data();
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.http.put(`/api/v1/periods/schools/${schoolId}/${period.id}`, {
          name: name.trim() || null,
          shortName: shortName.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      );
      this.toast.showSuccess('Periodo actualizado');
      this.closeModal.emit(true);
    } catch (error) {
      const message = error instanceof HttpErrorResponse ? error.error?.message : null;
      this.toast.showError(typeof message === 'string' ? message : 'No se pudo guardar el periodo');
    } finally {
      this.saving.set(false);
    }
  }
}
