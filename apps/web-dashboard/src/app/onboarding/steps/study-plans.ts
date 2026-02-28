import { markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import { CreatedEntity } from '../setup-wizard';

@Component({
  selector: 'app-study-plans-step',
  imports: [ReactiveFormsModule],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-info/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-5xl text-info">description</span>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-base-content">Configura Planes de Estudio</h1>
        <p class="text-base-content/70">Los planes de estudio definen el currículo dentro de cada nivel académico.</p>
      </div>

      <!-- Created Study Plans List -->
      @if (createdEntities().length > 0) {
        <div class="bg-success/10 rounded-xl p-4 text-left">
          <h3 class="font-medium text-success mb-2">Planes creados:</h3>
          <ul class="space-y-1">
            @for (entity of createdEntities(); track entity.id) {
              <li class="flex items-center gap-2 text-sm">
                <span class="material-symbols-outlined text-success text-lg">check_circle</span>
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
            <span class="material-symbols-outlined text-warning mt-0.5">warning</span>
            <div>
              <h3 class="font-medium text-warning">No hay niveles académicos</h3>
              <p class="text-sm text-base-content/70 mt-1">
                Necesitas crear al menos un nivel académico antes de crear planes de estudio.
              </p>
            </div>
          </div>
        </div>
      } @else {
        <!-- Form Fields -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-left">
          <div class="fieldset">
            <label for="degreeId" class="label">
              <span class="label-text font-medium">Nivel Académico</span>
            </label>
            <select id="degreeId" formControlName="degreeId" class="select select-bordered w-full">
              <option value="" disabled>Selecciona un nivel...</option>
              @for (degree of allDegrees(); track degree.id) {
                <option [value]="degree.id">{{ degree.name }}</option>
              }
            </select>
          </div>

          <div class="fieldset">
            <label for="name" class="label">
              <span class="label-text font-medium">Nombre del Plan</span>
            </label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="input input-bordered w-full"
              placeholder="Ej: Primer Grado"
            />
            @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
              <p class="text-error text-xs mt-1">El nombre es requerido</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="fieldset">
              <label for="shortName" class="label">
                <span class="label-text font-medium">Nombre Corto</span>
              </label>
              <input
                type="text"
                id="shortName"
                formControlName="shortName"
                class="input input-bordered w-full"
                placeholder="1ro"
              />
            </div>

            <div class="fieldset">
              <label for="level" class="label">
                <span class="label-text font-medium">Grado/Nivel</span>
              </label>
              <input
                type="number"
                id="level"
                formControlName="level"
                class="input input-bordered w-full"
                placeholder="1"
                min="0"
              />
            </div>
          </div>

          <div class="fieldset">
            <label for="gradeMetricId" class="label">
              <span class="label-text font-medium">Métrica de Calificaciones</span>
            </label>
            <select id="gradeMetricId" formControlName="gradeMetricId" class="select select-bordered w-full">
              <option value="" disabled>Selecciona una métrica...</option>
              @for (metric of gradeMetrics.value(); track metric.id) {
                <option [value]="metric.id">{{ metric.name }}</option>
              }
            </select>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="submit" class="btn btn-outline flex-1" [disabled]="saving()" (click)="addAnother = true">
              @if (saving() && addAnother) {
                <span class="loading loading-spinner loading-sm"></span>
              } @else {
                <span class="material-symbols-outlined text-xl">add</span>
              }
              Agregar otro
            </button>
            <button type="submit" class="btn btn-primary flex-1" [disabled]="saving()" (click)="addAnother = false">
              @if (saving() && !addAnother) {
                <span class="loading loading-spinner loading-sm"></span>
                Guardando...
              } @else {
                Guardar y Continuar
                <span class="material-symbols-outlined text-xl">arrow_forward</span>
              }
            </button>
          </div>
        </form>
      }

      <!-- Skip Option -->
      @if (createdEntities().length === 0) {
        <div class="text-center">
          <button type="button" class="btn btn-ghost btn-sm" (click)="onSkip()">Omitir por ahora</button>
          <p class="text-xs text-base-content/50 mt-1">Podrás crear planes de estudio más adelante.</p>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudyPlansStep {
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
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
  public schools = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ schools: { id: string }[] }>({
          query: gql`
            query GetSchools {
              schools {
                id
              }
            }
          `,
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data?.schools ?? [])),
  });

  // Get the school ID from store or first school from API
  public schoolId = computed(() => {
    const storeSchoolId = this.store.currentSchoolId();
    if (storeSchoolId) return storeSchoolId;
    return this.schools.value()?.[0]?.id;
  });

  public degrees = rxResource({
    params: () => ({ schoolId: this.schoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ degreesBySchoolId: { id: string; name: string }[] }>({
          query: gql`
            query DegreesBySchoolId($schoolId: String!) {
              degreesBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'cache-and-network',
        })
        .valueChanges.pipe(map((result) => result.data?.degreesBySchoolId ?? []));
    },
  });

  public gradeMetrics = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ gradeMetrics: { id: string; name: string }[] }>({
          query: gql`
            query GetGradeMetrics {
              gradeMetrics {
                id
                name
              }
            }
          `,
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data?.gradeMetrics ?? [])),
  });

  // Combine API degrees with newly created ones
  public allDegrees = () => {
    const apiDegrees = this.degrees.value() ?? [];
    const newDegrees = this.createdDegrees().map((d) => ({ id: d.id, name: d.name }));
    return [...apiDegrees, ...newDegrees.filter((nd) => !apiDegrees.some((ad) => ad.id === nd.id))];
  };

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    level: [1, [Validators.required]],
    degreeId: ['', [Validators.required]],
    gradeMetricId: ['', [Validators.required]],
  });

  public onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    const schoolId = this.schoolId();
    if (!schoolId) {
      this.toasts.showError('No se encontró la escuela');
      return;
    }

    this.saving.set(true);

    const formValue = this.form.getRawValue();

    this.apollo
      .mutate<{ createStudyPlan: { id: string; name: string } }>({
        mutation: gql`
          mutation CreateStudyPlan($createStudyPlanInput: CreateStudyPlanInput!) {
            createStudyPlan(createStudyPlanInput: $createStudyPlanInput) {
              id
              name
            }
          }
        `,
        variables: {
          createStudyPlanInput: {
            ...formValue,
            description: '',
            schoolId,
          },
        },
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          const studyPlan = result.data?.createStudyPlan;
          if (studyPlan) {
            this.entityCreated.emit({ id: studyPlan.id, name: studyPlan.name, type: 'studyPlan' });
            this.toasts.showSuccess(`Plan "${studyPlan.name}" creado`);
          }
          this.form.reset({ level: 1 });

          if (!this.addAnother) {
            this.completed.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.message || 'Error al crear el plan de estudio');
        },
      });
  }

  public onSkip() {
    this.skipped.emit();
  }
}
