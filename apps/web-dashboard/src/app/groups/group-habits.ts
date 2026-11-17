import { Alert, Button, Icon, Loader, Toast, UiField, UiInput, UiRadio, UiSelect, UiTable } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';

type Student = Prisma.StudentGetPayload<{
  include: { user: true };
}> & {
  name: string;
  initials: string;
};

type HabitMetric = Prisma.HabitMetricGetPayload<{ include: undefined }>;
type Period = Prisma.PeriodGetPayload<{ include: undefined }>;

type StudentEvaluation = {
  studentId: string;
  value: 'X' | 'R' | 'S' | null;
  comments: string;
};

@Component({
  selector: 'app-group-habits',
  imports: [Alert, UiTable, UiInput, UiRadio, UiSelect, Button, FormsModule, Loader, UiField, Icon],
  template: `
    <div class="space-y-4">
      <!-- Empty state: No metrics configured -->
      @if (habitMetrics.isLoading()) {
        <lib-loader />
      } @else if (!habitMetrics.value() || habitMetrics.value()!.length === 0) {
        <div uiAlert>
          <ui-icon name="info" />
          <span
            >No hay criterios de hábitos configurados. Solicite al administrador que configure los criterios desde el
            panel de administración.</span
          >
        </div>
      } @else {
        <!-- Selectors -->
        <div class="grid grid-cols-2 gap-4">
          <ui-field label="Período">
            <select uiSelect id="habits-period" [(ngModel)]="selectedPeriodId" (ngModelChange)="onSelectionChange()">
              <option [value]="null" disabled selected>Seleccione un período</option>
              @for (period of periods.value(); track period.id) {
                <option [value]="period.id">{{ period.name }} - {{ period.year }}</option>
              }
            </select>
          </ui-field>

          <ui-field label="Criterio de evaluación">
            <select uiSelect id="habits-metric" [(ngModel)]="selectedMetricId" (ngModelChange)="onSelectionChange()">
              <option [value]="null" disabled selected>Seleccione un criterio</option>
              @for (metric of activeMetrics(); track metric.id) {
                <option [value]="metric.id">{{ metric.name }}</option>
              }
            </select>
          </ui-field>
        </div>

        <!-- Prompt to select period and metric -->
        @if (!selectedPeriodId() || !selectedMetricId()) {
          <div uiAlert tone="warning">
            <ui-icon name="triangle-alert" />
            <span>Por favor, seleccione un período y un criterio para comenzar la evaluación.</span>
          </div>
        } @else if (evaluationsLoading()) {
          <lib-loader />
        } @else {
          <!-- Legend -->
          <div class="flex gap-4 items-center p-4 bg-surface-0 rounded-lg">
            <span class="font-semibold">Leyenda:</span>
            <div class="flex gap-2 items-center">
              <input uiRadio tone="danger" size="sm" type="radio" disabled />
              <span><strong>X</strong> = Deficiente</span>
            </div>
            <div class="flex gap-2 items-center">
              <input uiRadio tone="warning" size="sm" type="radio" disabled />
              <span><strong>R</strong> = Regular</span>
            </div>
            <div class="flex gap-2 items-center">
              <input uiRadio tone="success" size="sm" type="radio" disabled />
              <span><strong>S</strong> = Satisfactorio</span>
            </div>
          </div>

          <!-- Students Evaluation Table -->
          <div class="overflow-x-auto">
            <table uiTable zebra>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Evaluación</th>
                  <th>Comentarios</th>
                </tr>
              </thead>
              <tbody>
                @for (student of students(); track student.id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="avatar avatar-placeholder">
                          <div
                            class="bg-neutral text-neutral-content w-8 rounded-full"
                            [style.background]="student.user?.color || 'var(--ui-ink-subtle)'"
                          >
                            <span class="text-xs">{{ student.initials }}</span>
                          </div>
                        </div>
                        <div>{{ student.name }}</div>
                      </div>
                    </td>
                    <td>
                      <div class="flex gap-4">
                        <label class="flex items-center gap-1 cursor-pointer">
                          <input
                            uiRadio
                            tone="danger"
                            size="sm"
                            type="radio"
                            [name]="'eval-' + student.id"
                            value="X"
                            [checked]="getValue(student.id) === 'X'"
                            (change)="updateValue(student.id, 'X')"
                          />
                          <span class="text-sm text-error font-semibold">X</span>
                        </label>
                        <label class="flex items-center gap-1 cursor-pointer">
                          <input
                            uiRadio
                            tone="warning"
                            size="sm"
                            type="radio"
                            [name]="'eval-' + student.id"
                            value="R"
                            [checked]="getValue(student.id) === 'R'"
                            (change)="updateValue(student.id, 'R')"
                          />
                          <span class="text-sm text-warning font-semibold">R</span>
                        </label>
                        <label class="flex items-center gap-1 cursor-pointer">
                          <input
                            uiRadio
                            tone="success"
                            size="sm"
                            type="radio"
                            [name]="'eval-' + student.id"
                            value="S"
                            [checked]="getValue(student.id) === 'S'"
                            (change)="updateValue(student.id, 'S')"
                          />
                          <span class="text-sm text-success font-semibold">S</span>
                        </label>
                      </div>
                    </td>
                    <td>
                      <input
                        uiInput
                        size="sm"
                        type="text"
                        [value]="getComments(student.id)"
                        (input)="updateComments(student.id, $any($event.target).value)"
                        placeholder="Comentarios opcionales"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end gap-2">
            <button uiButton [loading]="saving()" variant="primary" (click)="saveAll()">
              @if (saving()) {
                Guardando...
              } @else {
                <ui-icon name="save" />
                Guardar cambios
              }
            </button>
          </div>
        }
      }
    </div>
  `,
})
export default class GroupHabits {
  public groupId = input.required<string>();
  public students = input.required<Student[]>();

  private http = inject(HttpClient);
  private toast = inject(Toast);

  // State
  public selectedPeriodId = signal<string | null>(null);
  public selectedMetricId = signal<string | null>(null);
  public evaluations = signal<Map<string, StudentEvaluation>>(new Map());
  public evaluationsLoading = signal(false);
  public saving = signal(false);

  public periods = httpResource<Period[]>(() => '/api/v1/periods', { defaultValue: [] });

  public habitMetrics = httpResource<HabitMetric[]>(() => '/api/v1/habit-metrics', { defaultValue: [] });

  // Filter active metrics only
  public activeMetrics = computed(() => {
    return this.habitMetrics.value()?.filter((m) => m.active) || [];
  });

  onSelectionChange() {
    const periodId = this.selectedPeriodId();
    const metricId = this.selectedMetricId();

    if (!periodId || !metricId) {
      return;
    }

    this.loadEvaluations(this.groupId(), periodId, metricId);
  }

  loadEvaluations(groupId: string, periodId: string, metricId: string) {
    this.evaluationsLoading.set(true);

    this.http
      .get<
        Array<{
          habitMetricId: string;
          studentEvaluations?: Array<{
            studentId?: string;
            value?: 'X' | 'R' | 'S' | null;
            comments?: string | null;
          }>;
        }>
      >('/api/v1/habit-evaluations/by-group', {
        params: { classGroupId: groupId, periodId },
      })
      .subscribe({
        next: (habitEvaluationsByGroup) => {
          this.evaluationsLoading.set(false);

          const evaluation = habitEvaluationsByGroup?.find((e) => e.habitMetricId === metricId);

          // Initialize evaluations map
          const evalMap = new Map<string, StudentEvaluation>();

          if (evaluation?.studentEvaluations) {
            // Load existing evaluations
            evaluation.studentEvaluations.forEach((se) => {
              if (se.studentId) {
                evalMap.set(se.studentId, {
                  studentId: se.studentId,
                  value: se.value ?? null,
                  comments: se.comments || '',
                });
              }
            });
          } else {
            // Initialize empty evaluations for all students
            this.students().forEach((student) => {
              evalMap.set(student.id, {
                studentId: student.id,
                value: null,
                comments: '',
              });
            });
          }

          this.evaluations.set(evalMap);
        },
        error: (error) => {
          this.evaluationsLoading.set(false);
          console.error('Error loading evaluations:', error);
          this.toast.showError('Error al cargar las evaluaciones');
        },
      });
  }

  getValue(studentId: string): 'X' | 'R' | 'S' | null {
    return this.evaluations().get(studentId)?.value ?? null;
  }

  getComments(studentId: string): string {
    return this.evaluations().get(studentId)?.comments ?? '';
  }

  updateValue(studentId: string, value: 'X' | 'R' | 'S') {
    const current = this.evaluations().get(studentId) || {
      studentId,
      value: null,
      comments: '',
    };
    this.evaluations().set(studentId, { ...current, value });
  }

  updateComments(studentId: string, comments: string) {
    const current = this.evaluations().get(studentId) || {
      studentId,
      value: null,
      comments: '',
    };
    this.evaluations().set(studentId, { ...current, comments });
  }

  saveAll() {
    const periodId = this.selectedPeriodId();
    const metricId = this.selectedMetricId();

    if (!periodId || !metricId) {
      this.toast.showError('Por favor, seleccione un período y un criterio');
      return;
    }

    // Filter out students without evaluations
    const studentEvaluations = Array.from(this.evaluations().values())
      .filter((e) => e.value !== null)
      .map((e) => ({
        studentId: e.studentId,
        value: e.value!,
        comments: e.comments || null,
      }));

    if (studentEvaluations.length === 0) {
      this.toast.showError('Por favor, evalúe al menos un estudiante antes de guardar');
      return;
    }

    this.saving.set(true);

    this.http
      .post('/api/v1/habit-evaluations', {
        classGroupId: this.groupId(),
        periodId,
        habitMetricId: metricId,
        studentEvaluations,
        published: false,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.showSuccess('Evaluaciones guardadas exitosamente');
        },
        error: (error) => {
          this.saving.set(false);
          console.error('Error saving evaluations:', error);
          this.toast.showError('Error al guardar las evaluaciones');
        },
      });
  }
}
