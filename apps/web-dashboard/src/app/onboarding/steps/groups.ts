import { markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import { CreatedEntity } from '../setup-wizard';

@Component({
  selector: 'app-groups-step',
  imports: [ReactiveFormsModule],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-5xl text-warning">groups</span>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-base-content">Crea Grupos de Estudiantes</h1>
        <p class="text-base-content/70">
          Los grupos organizan a los estudiantes por clase o cohorte (ej: "Generación 2025").
        </p>
      </div>

      <!-- Created Groups List -->
      @if (createdEntities().length > 0) {
        <div class="bg-success/10 rounded-xl p-4 text-left">
          <h3 class="font-medium text-success mb-2">Grupos creados:</h3>
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

      <!-- No Study Plans Warning -->
      @if (allStudyPlans().length === 0) {
        <div class="bg-warning/10 rounded-xl p-4 text-left">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-warning mt-0.5">warning</span>
            <div>
              <h3 class="font-medium text-warning">No hay planes de estudio</h3>
              <p class="text-sm text-base-content/70 mt-1">
                Necesitas crear al menos un plan de estudio antes de crear grupos.
              </p>
            </div>
          </div>
        </div>
      } @else {
        <!-- Form Fields -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-left">
          <div class="fieldset">
            <label for="studyPlanId" class="label">
              <span class="label-text font-medium">Plan de Estudio</span>
            </label>
            <select id="studyPlanId" formControlName="studyPlanId" class="select select-bordered w-full">
              <option value="" disabled>Selecciona un plan...</option>
              @for (plan of allStudyPlans(); track plan.id) {
                <option [value]="plan.id">{{ plan.name }}</option>
              }
            </select>
          </div>

          <div class="fieldset">
            <label for="name" class="label">
              <span class="label-text font-medium">Nombre del Grupo</span>
            </label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="input input-bordered w-full"
              placeholder="Ej: Grupo A - Generación 2025"
            />
            @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
              <p class="text-error text-xs mt-1">El nombre es requerido</p>
            }
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
                Finalizar
                <span class="material-symbols-outlined text-xl">check</span>
              }
            </button>
          </div>
        </form>
      }

      <!-- Skip Option -->
      @if (createdEntities().length === 0) {
        <div class="text-center">
          <button type="button" class="btn btn-ghost btn-sm" (click)="onSkip()">Omitir por ahora</button>
          <p class="text-xs text-base-content/50 mt-1">Podrás crear grupos más adelante.</p>
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
export default class GroupsStep {
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  private store = inject(Store);

  public createdStudyPlans = input<CreatedEntity[]>([]);
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
        .valueChanges.pipe(map((result) => result.data.schools)),
  });

  // Get the school ID from store or first school from API
  public schoolId = computed(() => {
    const storeSchoolId = this.store.currentSchoolId();
    if (storeSchoolId) return storeSchoolId;
    return this.schools.value()?.[0]?.id;
  });

  public studyPlans = rxResource({
    params: () => ({ schoolId: this.schoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ studyPlansBySchoolId: { id: string; name: string }[] }>({
          query: gql`
            query StudyPlansBySchoolId($schoolId: String!) {
              studyPlansBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'cache-and-network',
        })
        .valueChanges.pipe(map((result) => result.data.studyPlansBySchoolId));
    },
  });

  // Combine API study plans with newly created ones
  public allStudyPlans = computed(() => {
    const apiPlans = this.studyPlans.value() ?? [];
    const newPlans = this.createdStudyPlans().map((p) => ({ id: p.id, name: p.name }));
    return [...apiPlans, ...newPlans.filter((np) => !apiPlans.some((ap) => ap.id === np.id))];
  });

  public form = this.fb.group({
    name: ['', [Validators.required]],
    studyPlanId: ['', [Validators.required]],
    active: [true],
  });

  public onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    const schoolId = this.schoolId();
    const organizationId = this.store.currentOrganizationId();
    if (!schoolId || !organizationId) {
      this.toasts.showError('No se encontró la escuela');
      return;
    }

    this.saving.set(true);

    const formValue = this.form.getRawValue();

    this.apollo
      .mutate<{ createClassGroup: { id: string; name: string } }>({
        mutation: gql`
          mutation CreateClassGroup($createClassGroupInput: CreateClassGroupInput!) {
            createClassGroup(createClassGroupInput: $createClassGroupInput) {
              id
              name
            }
          }
        `,
        variables: {
          createClassGroupInput: {
            ...formValue,
            schoolId,
            organizationId,
          },
        },
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          const group = result.data?.createClassGroup;
          if (group) {
            this.entityCreated.emit({ id: group.id, name: group.name, type: 'group' });
            this.toasts.showSuccess(`Grupo "${group.name}" creado`);
          }
          this.form.reset({ active: true });

          if (!this.addAnother) {
            this.completed.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.message || 'Error al crear el grupo');
        },
      });
  }

  public onSkip() {
    this.skipped.emit();
  }
}
