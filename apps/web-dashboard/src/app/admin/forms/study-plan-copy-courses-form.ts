import { Button, Toast, UiCheckbox, UiChoice, UiField, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import Store from '../../core/store';

type PlanCourse = { id: string; subjectId: string; subject: { name: string } };

/**
 * Copies courses (subjects) from another plan of the school into this one. Subjects the plan
 * already has are shown but cannot be picked; the copies keep color, icon and grade categories,
 * get no teacher, and enroll the plan's students.
 */
@Component({
  selector: 'app-study-plan-copy-courses-form',
  imports: [UiField, UiSelect, UiChoice, UiCheckbox, Button],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-4">
      <p class="text-sm text-ink-muted">Copia materias de otro plan a {{ data()?.studyPlan?.name }}.</p>
      <ui-field label="Copiar desde" required>
        <select uiSelect (change)="sourceId.set(selectValue($event))">
          <option value="" [selected]="!sourceId()" disabled>Selecciona un plan...</option>
          @for (plan of sourcePlans(); track plan.id) {
            <option [value]="plan.id" [selected]="plan.id === sourceId()">{{ plan.name }}</option>
          }
        </select>
      </ui-field>

      @if (sourceId()) {
        @if (sourceCourses.isLoading()) {
          <p class="text-sm text-ink-muted">Cargando materias...</p>
        } @else if (!sourceCourses.value().length) {
          <p class="text-sm text-ink-muted">Ese plan no tiene materias.</p>
        } @else {
          <fieldset>
            <div class="flex items-center justify-between mb-2">
              <legend class="text-sm font-medium text-ink-strong">Materias</legend>
              @if (available().length) {
                <button uiButton variant="ghost" size="sm" type="button" (click)="toggleAll()">
                  {{ allSelected() ? 'Quitar todas' : 'Seleccionar todas' }}
                </button>
              }
            </div>
            <div class="flex flex-col gap-1">
              @for (course of sourceCourses.value(); track course.id) {
                <ui-choice
                  [label]="course.subject.name"
                  [hint]="targetSubjects().has(course.subjectId) ? 'Ya está en este plan' : ''"
                >
                  <input
                    uiCheckbox
                    type="checkbox"
                    [disabled]="targetSubjects().has(course.subjectId)"
                    [checked]="selected().has(course.subjectId)"
                    (change)="toggle(course.subjectId)"
                  />
                </ui-choice>
              }
            </div>
          </fieldset>
          <p class="text-xs text-ink-muted">
            Las copias mantienen color, ícono y categorías de calificación, sin docente. Los alumnos del plan quedan
            inscritos.
          </p>
        }
      }

      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving() || !selected().size" [loading]="saving()">
          Copiar {{ selected().size ? selected().size : '' }} {{ selected().size === 1 ? 'materia' : 'materias' }}
        </button>
      </div>
    </form>
  `,
})
export default class StudyPlanCopyCoursesForm {
  public data = input<{ studyPlan?: { id: string; name: string } }>();
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);

  protected readonly sourceId = signal('');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly saving = signal(false);

  private plans = httpResource<{ id: string; name: string }[]>(
    () => {
      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return { url: '/api/v1/study-plans/by-school', params: { schoolId } };
    },
    { defaultValue: [] },
  );

  protected readonly sourcePlans = computed(() =>
    this.plans.value().filter((p) => p.id !== this.data()?.studyPlan?.id),
  );

  protected readonly sourceCourses = httpResource<PlanCourse[]>(
    () => (this.sourceId() ? `/api/v1/courses/by-study-plan/${this.sourceId()}` : undefined),
    { defaultValue: [] },
  );

  private targetCourses = httpResource<PlanCourse[]>(
    () => {
      const id = this.data()?.studyPlan?.id;
      return id ? `/api/v1/courses/by-study-plan/${id}` : undefined;
    },
    { defaultValue: [] },
  );

  protected readonly targetSubjects = computed(() => new Set(this.targetCourses.value().map((c) => c.subjectId)));

  /** The source subjects the plan does not have yet. */
  protected readonly available = computed(() =>
    this.sourceCourses
      .value()
      .map((c) => c.subjectId)
      .filter((id) => !this.targetSubjects().has(id)),
  );

  protected readonly allSelected = computed(
    () => this.available().length > 0 && this.available().every((id) => this.selected().has(id)),
  );

  constructor() {
    // A new source plan starts with all its copyable subjects selected.
    effect(() => this.selected.set(new Set(this.available())));
  }

  protected toggle(subjectId: string) {
    const next = new Set(this.selected());
    if (next.has(subjectId)) next.delete(subjectId);
    else next.add(subjectId);
    this.selected.set(next);
  }

  protected toggleAll() {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.available()));
  }

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const target = this.data()?.studyPlan;
    if (!target || !this.sourceId() || !this.selected().size) return;
    this.saving.set(true);
    this.http
      .post<{ copied: { id: string }[]; skipped: string[] }>(`/api/v1/study-plans/${target.id}/copy-courses`, {
        sourceStudyPlanId: this.sourceId(),
        subjectIds: [...this.selected()],
      })
      .subscribe({
        next: ({ copied }) => {
          this.saving.set(false);
          this.toast.showSuccess(copied.length === 1 ? 'Se copió 1 materia' : `Se copiaron ${copied.length} materias`);
          this.closeModal.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.showError(err.error?.message ?? 'Error al copiar las materias');
        },
      });
  }
}
