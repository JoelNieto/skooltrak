import { Button, Toast, UiField, UiInput, UiToggle } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

/** A habit metric as GET /v1/habit-metrics/schools/:schoolId returns it. */
export interface SchoolHabitMetricRow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  order: number;
  /** The school's own metric (false: a global one). */
  custom: boolean;
  /** The school's habit evaluations of it. */
  usage: number;
}

export interface SchoolHabitMetricsResponse {
  custom: boolean;
  metrics: SchoolHabitMetricRow[];
}

/** Creates or edits one of a school's own habits and aptitudes. */
@Component({
  selector: 'app-school-habit-metric-form',
  imports: [UiField, UiInput, UiToggle, Button, FormsModule],
  template: `
    <form (submit)="onSubmit($event)">
      @if (!data().metric && !data().custom) {
        <p class="text-sm text-ink-muted mb-3">
          El colegio pasará a usar hábitos propios: se copiarán los hábitos globales (con sus evaluaciones) y se
          agregará este.
        </p>
      }
      <div class="flex flex-col gap-2">
        <ui-field label="Nombre" required>
          <input uiInput type="text" name="name" [(ngModel)]="name" placeholder="Responsabilidad" />
        </ui-field>
        <ui-field label="Descripción">
          <textarea uiInput name="description" rows="3" [(ngModel)]="description"></textarea>
        </ui-field>
        <ui-field label="Orden" hint="Posición en la lista y en el boletín">
          <input uiInput type="number" name="order" [(ngModel)]="order" />
        </ui-field>
        <label class="flex items-center gap-2 text-sm">
          <input uiToggle type="checkbox" name="active" [(ngModel)]="active" />
          Activo (se evalúa y aparece en el boletín)
        </label>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(false)">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()">Guardar</button>
      </div>
    </form>
  `,
})
export default class SchoolHabitMetricForm {
  public closeModal = output<boolean>();
  public data = input.required<{
    schoolId: string;
    /** Whether the school already uses its own habits. */
    custom: boolean;
    /** Absent: a new metric. */
    metric?: SchoolHabitMetricRow;
    /** Order for a new metric (last). */
    nextOrder: number;
  }>();

  private http = inject(HttpClient);
  private toast = inject(Toast);

  protected readonly saving = signal(false);
  protected readonly name = linkedSignal(() => this.data().metric?.name ?? '');
  protected readonly description = linkedSignal(() => this.data().metric?.description ?? '');
  protected readonly order = linkedSignal(() => this.data().metric?.order ?? this.data().nextOrder);
  protected readonly active = linkedSignal(() => this.data().metric?.active ?? true);

  async onSubmit(event: Event) {
    event.preventDefault();
    const name = this.name().trim();
    if (!name) {
      this.toast.showError('El nombre es obligatorio');
      return;
    }
    const { schoolId, metric } = this.data();
    const body = {
      name,
      description: this.description().trim() || null,
      order: Number(this.order()) || 0,
      active: this.active(),
    };
    this.saving.set(true);
    try {
      await firstValueFrom(
        metric
          ? this.http.patch(`/api/v1/habit-metrics/schools/${schoolId}/${metric.id}`, body)
          : this.http.post(`/api/v1/habit-metrics/schools/${schoolId}`, body),
      );
      this.toast.showSuccess(metric ? 'Hábito actualizado' : 'Hábito creado');
      this.closeModal.emit(true);
    } catch (error) {
      const message = error instanceof HttpErrorResponse ? error.error?.message : null;
      this.toast.showError(typeof message === 'string' ? message : 'No se pudo guardar el hábito');
    } finally {
      this.saving.set(false);
    }
  }
}
