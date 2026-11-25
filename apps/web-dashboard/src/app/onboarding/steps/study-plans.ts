import { Button, Icon, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { suggestedPlanName } from '#/shared';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField, min, required, validate } from '@angular/forms/signals';
import Store from '../../core/store';
import { CreatedEntity } from '../setup-wizard';

@Component({
  selector: 'app-study-plans-step',
  imports: [UiField, UiInput, UiSelect, Button, FormField, Icon],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-info/10 flex items-center justify-center">
          <ui-icon name="file-text" class="text-5xl text-info" />
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Configura Planes de Estudio</h1>
        <p class="text-ink-muted">
          Un plan por grado de cada nivel (por ejemplo, 1° a 6° de Primaria). Usan la métrica y los costos del nivel.
        </p>
      </div>

      <!-- Created Study Plans List -->
      @if (createdEntities().length > 0) {
        <div class="bg-success/10 rounded-xl p-4 text-left">
          <h3 class="font-medium text-success mb-2">Planes creados:</h3>
          <ul class="space-y-1">
            @for (entity of createdEntities(); track entity.id) {
              <li class="flex items-center gap-2 text-sm">
                <ui-icon name="circle-check" class="text-success text-lg" />
                {{ entity.name }}
              </li>
            }
          </ul>
        </div>
      }

      <!-- No Degrees Warning -->
      @if (createdDegrees().length === 0 && degrees.value()?.length === 0) {
        <div class="bg-warning/10 rounded-xl p-4 text-left">
          <div class="flex items-start gap-3">
            <ui-icon name="triangle-alert" class="text-warning mt-0.5" />
            <div>
              <h3 class="font-medium text-warning">No hay niveles académicos</h3>
              <p class="text-sm text-ink-muted mt-1">
                Necesitas crear al menos un nivel académico antes de crear planes de estudio.
              </p>
            </div>
          </div>
        </div>
      } @else {
        <!-- Form Fields -->
        <form (submit)="onSubmit($event)" class="space-y-4 text-left">
          <ui-field label="Nivel Académico" [field]="form.degreeId">
            <select uiSelect id="degreeId" [formField]="form.degreeId">
              <option value="" disabled>Selecciona un nivel...</option>
              @for (degree of allDegrees(); track degree.id) {
                <option [value]="degree.id">{{ degree.name }}</option>
              }
            </select>
          </ui-field>

          <div class="grid grid-cols-2 gap-4">
            <ui-field label="Desde el grado" [field]="form.fromLevel">
              <input uiInput type="number" id="fromLevel" [formField]="form.fromLevel" />
            </ui-field>
            <ui-field label="Hasta el grado" [field]="form.toLevel">
              <input uiInput type="number" id="toLevel" [formField]="form.toLevel" />
            </ui-field>
          </div>

          @if (preview().length) {
            <p class="text-sm text-ink-muted">
              Se crearán: <span class="text-ink-strong">{{ preview().join(', ') }}</span>
            </p>
          }

          <div class="flex gap-3 pt-4">
            <button
              uiButton
              [loading]="saving() && addAnother"
              type="submit"
              class="flex-1"
              [disabled]="saving()"
              (click)="addAnother = true"
            >
              @if (!(saving() && addAnother)) {
                <ui-icon name="plus" class="text-xl" />
              }
              Crear y agregar otro nivel
            </button>
            <button
              uiButton
              [loading]="saving() && !addAnother"
              variant="primary"
              type="submit"
              class="flex-1"
              [disabled]="saving()"
              (click)="addAnother = false"
            >
              @if (saving() && !addAnother) {
                Guardando...
              } @else {
                Crear y Continuar
                <ui-icon name="arrow-right" class="text-xl" />
              }
            </button>
          </div>
        </form>
      }

      <!-- Skip Option -->
      @if (createdEntities().length === 0) {
        <div class="text-center">
          <button uiButton variant="ghost" size="sm" type="button" (click)="onSkip()">Omitir por ahora</button>
          <p class="text-xs text-ink-subtle mt-1">Podrás crear planes de estudio más adelante.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export default class StudyPlansStep {
  #http = inject(HttpClient);
  private toasts = inject(Toast);
  private store = inject(Store);

  public createdDegrees = input<CreatedEntity[]>([]);
  public createdEntities = input<CreatedEntity[]>([]);
  public entityCreated = output<CreatedEntity>();
  public completed = output<void>();
  public skipped = output<void>();

  public saving = signal(false);
  public addAnother = false;

  // Fetch schools to get the first one if not in store
  public schools = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/schools', {
    defaultValue: [],
  });

  // Get the school ID from store or first school from API
  public schoolId = computed(() => {
    const storeSchoolId = this.store.currentSchoolId();
    if (storeSchoolId) return storeSchoolId;
    return this.schools.value()?.[0]?.id;
  });

  public degrees = httpResource<Array<{ id: string; name: string; studyPlans?: { level: number }[] }>>(
    () => {
      const schoolId = this.schoolId();
      if (!schoolId) {
        return undefined;
      }
      return { url: '/api/v1/degrees/by-school', params: { schoolId } };
    },
    { defaultValue: [] },
  );

  // Combine API degrees with newly created ones
  public allDegrees = () => {
    const apiDegrees = this.degrees.value() ?? [];
    const newDegrees = this.createdDegrees().map((d) => ({ id: d.id, name: d.name, studyPlans: [] }));
    return [...apiDegrees, ...newDegrees.filter((nd) => !apiDegrees.some((ad) => ad.id === nd.id))];
  };

  private formModel = signal({ degreeId: '', fromLevel: 1, toLevel: 6 });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.degreeId, { message: 'El nivel es requerido' });
    required(schemaPath.fromLevel, { message: 'El grado es requerido' });
    required(schemaPath.toLevel, { message: 'El grado es requerido' });
    min(schemaPath.fromLevel, 0, { message: 'El grado no puede ser negativo' });
    validate(schemaPath.toLevel, ({ value, valueOf }) => {
      const span = Number(value()) - Number(valueOf(schemaPath.fromLevel)) + 1;
      if (span < 1) return { kind: 'range', message: 'Debe ser mayor o igual al grado inicial' };
      if (span > 20) return { kind: 'range', message: 'Máximo 20 planes a la vez' };
      return null;
    });
  });

  /** The plan names the range creates ("1° Primaria"...). */
  public preview = computed(() => {
    const degree = this.allDegrees().find((d) => d.id === this.form.degreeId().value());
    const from = Number(this.form.fromLevel().value());
    const to = Number(this.form.toLevel().value());
    if (!degree || !Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from + 1 > 20) return [];
    return Array.from({ length: to - from + 1 }, (_, i) => suggestedPlanName(from + i, degree.name));
  });

  constructor() {
    // A degree that already has plans continues after its highest grade.
    effect(() => {
      const degree = this.allDegrees().find((d) => d.id === this.form.degreeId().value());
      if (!degree) return;
      untracked(() => {
        const from = (degree.studyPlans?.[0]?.level ?? 0) + 1;
        this.formModel.update((m) => ({ ...m, fromLevel: from, toLevel: Math.max(from, m.toLevel) }));
      });
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.form.degreeId().markAsTouched();
      this.form.toLevel().markAsTouched();
      this.toasts.showError('Revisa el nivel y el rango de grados');
      return;
    }

    const schoolId = this.schoolId();
    if (!schoolId) {
      this.toasts.showError('No se encontró la escuela');
      return;
    }

    this.saving.set(true);
    const { degreeId, fromLevel, toLevel } = this.formModel();

    this.#http
      .post<{ created: { id: string; name: string }[]; skipped: number[] }>('/api/v1/study-plans/bulk', {
        schoolId,
        degreeId,
        fromLevel: Number(fromLevel),
        toLevel: Number(toLevel),
      })
      .subscribe({
        next: ({ created }) => {
          this.saving.set(false);
          for (const plan of created) {
            this.entityCreated.emit({ id: plan.id, name: plan.name, type: 'studyPlan' });
          }
          if (created.length) {
            this.toasts.showSuccess(created.length === 1 ? 'Plan creado' : `${created.length} planes creados`);
          } else {
            this.toasts.showError('El nivel ya tiene esos grados');
          }
          this.form().value.set({ degreeId: '', fromLevel: 1, toLevel: 6 });

          if (!this.addAnother && created.length) {
            this.completed.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.error?.message || err.message || 'Error al crear los planes de estudio');
        },
      });
  }

  public onSkip() {
    this.skipped.emit();
  }
}
