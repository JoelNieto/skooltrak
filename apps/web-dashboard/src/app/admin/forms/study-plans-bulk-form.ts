import { suggestedPlanName } from '#/shared';
import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField, max, min, required, validate } from '@angular/forms/signals';
import Store from '../../core/store';
import { DegreeOption, nextLevel } from './study-plans-forms';

const MAX_PLANS = 20;

/**
 * Creates one study plan per grade of a degree ("1° Primaria" … "6° Primaria"). The plans inherit
 * the degree's grade metric and financial settings; grades the degree already has are skipped.
 */
@Component({
  selector: 'app-study-plans-bulk-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-4">
      <ui-field label="Nivel" [field]="form.degreeId">
        <select uiSelect [formField]="form.degreeId">
          <option value="" disabled>Selecciona nivel...</option>
          @for (degree of degrees.value(); track degree.id) {
            <option [value]="degree.id">{{ degree.name }}</option>
          }
        </select>
      </ui-field>
      <div class="grid grid-cols-2 gap-4">
        <ui-field label="Desde el grado" [field]="form.fromLevel">
          <input uiInput type="number" [formField]="form.fromLevel" />
        </ui-field>
        <ui-field label="Hasta el grado" [field]="form.toLevel">
          <input uiInput type="number" [formField]="form.toLevel" />
        </ui-field>
      </div>

      @if (preview().length) {
        <div>
          <p class="text-sm font-medium text-ink-strong mb-2">Se crearán {{ preview().length }} planes:</p>
          <ul class="flex flex-wrap gap-2" aria-label="Planes a crear">
            @for (name of preview(); track name) {
              <li class="rounded-lg border border-line px-2 py-1 text-sm">{{ name }}</li>
            }
          </ul>
          <p class="text-xs text-ink-muted mt-2">
            Usan la métrica y la configuración financiera del nivel. Los grados que el nivel ya tiene se omiten.
          </p>
        </div>
      }

      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()" [loading]="saving()">
          Crear planes
        </button>
      </div>
    </form>
  `,
})
export default class StudyPlansBulkForm {
  public data = input<{ degreeId?: string }>();
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);

  public degrees = httpResource<DegreeOption[]>(
    () => {
      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return { url: '/api/v1/degrees/by-school', params: { schoolId } };
    },
    { defaultValue: [] },
  );

  private formModel = signal({ degreeId: '', fromLevel: 1, toLevel: 6 });
  protected readonly saving = signal(false);

  public form = form(this.formModel, (path) => {
    required(path.degreeId, { message: 'Nivel requerido' });
    required(path.fromLevel, { message: 'Grado requerido' });
    required(path.toLevel, { message: 'Grado requerido' });
    min(path.fromLevel, 0, { message: 'El grado no puede ser negativo' });
    max(path.toLevel, 30, { message: 'Máximo grado 30' });
    validate(path.toLevel, ({ value, valueOf }) => {
      const span = Number(value()) - Number(valueOf(path.fromLevel)) + 1;
      if (span < 1) return { kind: 'range', message: 'Debe ser mayor o igual al grado inicial' };
      if (span > MAX_PLANS) return { kind: 'range', message: `Máximo ${MAX_PLANS} planes a la vez` };
      return null;
    });
  });

  private readonly selectedDegree = computed(() =>
    this.degrees.value().find((d) => d.id === this.form.degreeId().value()),
  );

  protected readonly preview = computed(() => {
    const degree = this.selectedDegree();
    const from = Number(this.form.fromLevel().value());
    const to = Number(this.form.toLevel().value());
    if (!degree || !Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from + 1 > MAX_PLANS) {
      return [];
    }
    return Array.from({ length: to - from + 1 }, (_, i) => suggestedPlanName(from + i, degree.name));
  });

  constructor() {
    effect(() => {
      const degreeId = this.data()?.degreeId;
      if (degreeId) untracked(() => this.form.degreeId().value.set(degreeId));
    });
    // A degree with plans continues after its highest grade.
    effect(() => {
      const degree = this.selectedDegree();
      if (!degree) return;
      untracked(() => {
        const from = nextLevel(degree);
        this.formModel.update((m) => ({ ...m, fromLevel: from, toLevel: Math.max(from, m.toLevel) }));
      });
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.form.degreeId().markAsTouched();
      this.form.toLevel().markAsTouched();
      this.toast.showError('Revisa el nivel y el rango de grados');
      return;
    }
    const { degreeId, fromLevel, toLevel } = this.formModel();
    this.saving.set(true);
    this.http
      .post<{ created: { id: string; name: string }[]; skipped: number[] }>('/api/v1/study-plans/bulk', {
        schoolId: this.store.currentSchoolId(),
        degreeId,
        fromLevel: Number(fromLevel),
        toLevel: Number(toLevel),
      })
      .subscribe({
        next: ({ created, skipped }) => {
          this.saving.set(false);
          const skippedNote = skipped.length ? ` (omitidos: ${skipped.map((l) => `${l}°`).join(', ')})` : '';
          if (created.length) {
            this.toast.showSuccess(`Se crearon ${created.length} planes de estudio${skippedNote}`);
          } else {
            this.toast.showError(`No se creó ningún plan: el nivel ya tiene esos grados${skippedNote}`);
          }
          this.closeModal.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.showError(err.error?.message ?? 'Error al crear los planes');
        },
      });
  }
}
