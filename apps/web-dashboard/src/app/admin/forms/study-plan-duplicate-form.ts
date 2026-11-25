import { suggestedPlanName, suggestedPlanShortName } from '#/shared';
import { Button, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import Store from '../../core/store';
import { DegreeOption } from './study-plans-forms';

/**
 * A copy of a study plan as the next grade: its overrides, enrollment costs and courses (subjects,
 * colors, icons and grade categories; teachers are assigned again).
 */
@Component({
  selector: 'app-study-plan-duplicate-form',
  imports: [UiField, UiInput, UiSelect, UiChoice, UiCheckbox, Button, FormField],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-4">
      <p class="text-sm text-ink-muted">Copia de {{ data()?.studyPlan?.name }}.</p>
      <div class="flex flex-col md:grid md:grid-cols-4 gap-2 md:gap-4">
        <ui-field label="Nivel" [field]="form.degreeId" class="md:col-span-3">
          <select uiSelect [formField]="form.degreeId">
            @for (degree of degrees.value(); track degree.id) {
              <option [value]="degree.id">{{ degree.name }}</option>
            }
          </select>
        </ui-field>
        <ui-field label="Grado" [field]="form.level">
          <input uiInput type="number" [formField]="form.level" />
        </ui-field>
        <ui-field label="Nombre" [field]="form.name" class="md:col-span-3">
          <input uiInput type="text" [formField]="form.name" (input)="nameEdited.set(true)" />
        </ui-field>
        <ui-field label="Nombre corto" [field]="form.shortName">
          <input uiInput type="text" [formField]="form.shortName" (input)="shortNameEdited.set(true)" />
        </ui-field>
      </div>
      <ui-choice label="Copiar las materias" hint="Con su color, ícono y categorías de calificación; sin docente.">
        <input uiCheckbox type="checkbox" [formField]="form.copyCourses" />
      </ui-choice>
      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()" [loading]="saving()">Duplicar</button>
      </div>
    </form>
  `,
})
export default class StudyPlanDuplicateForm {
  public data = input<{ studyPlan?: { id: string; name: string; level: number; degreeId: string } }>();
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

  private formModel = signal({ degreeId: '', level: 1, name: '', shortName: '', copyCourses: true });
  protected readonly saving = signal(false);
  protected readonly nameEdited = signal(false);
  protected readonly shortNameEdited = signal(false);

  public form = form(this.formModel, (path) => {
    required(path.degreeId, { message: 'Nivel requerido' });
    required(path.level, { message: 'Grado requerido' });
    min(path.level, 0, { message: 'El grado no puede ser negativo' });
    required(path.name, { message: 'Nombre requerido' });
    required(path.shortName, { message: 'Nombre corto requerido' });
  });

  private readonly selectedDegree = computed(() =>
    this.degrees.value().find((d) => d.id === this.form.degreeId().value()),
  );

  constructor() {
    // Start as the source plan's next grade, in the same degree.
    effect(() => {
      const source = this.data()?.studyPlan;
      if (!source) return;
      untracked(() =>
        this.formModel.update((m) => ({ ...m, degreeId: source.degreeId, level: source.level + 1 })),
      );
    });
    effect(() => {
      const degree = this.selectedDegree();
      const level = Number(this.form.level().value());
      if (!degree || !Number.isFinite(level)) return;
      untracked(() => {
        if (!this.nameEdited()) this.form.name().value.set(suggestedPlanName(level, degree.name));
        if (!this.shortNameEdited()) this.form.shortName().value.set(suggestedPlanShortName(level, degree.shortName));
      });
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const source = this.data()?.studyPlan;
    if (!source) return;
    if (this.form().invalid()) {
      this.form.name().markAsTouched();
      this.form.shortName().markAsTouched();
      this.toast.showError('Por favor, completa todos los campos');
      return;
    }
    const { degreeId, level, name, shortName, copyCourses } = this.formModel();
    this.saving.set(true);
    this.http
      .post<{ name: string; copiedCourses: number }>(`/api/v1/study-plans/${source.id}/duplicate`, {
        degreeId,
        level: Number(level),
        name,
        shortName,
        copyCourses,
      })
      .subscribe({
        next: (plan) => {
          this.saving.set(false);
          const courses = plan.copiedCourses === 1 ? '1 materia' : `${plan.copiedCourses} materias`;
          this.toast.showSuccess(`Plan "${plan.name}" creado con ${courses}`);
          this.closeModal.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.showError(err.error?.message ?? 'Error al duplicar el plan');
        },
      });
  }
}
