import { markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import {
  OnboardingStepsCreateCourseDocument,
  OnboardingStepsGetSchoolsDocument,
  OnboardingStepsGetSubjectsDocument,
  OnboardingStepsStudyPlansBySchoolIdDocument,
} from '../../graphql/generated/graphql';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import { CreatedEntity } from '../setup-wizard';

@Component({
  selector: 'app-courses-step',
  imports: [ReactiveFormsModule],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-5xl text-success">menu_book</span>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-base-content">Crea tu Primer Curso</h1>
        <p class="text-base-content/70">
          Los cursos son las clases que los estudiantes tomarán. Cada curso pertenece a un plan de estudio.
        </p>
      </div>

      <!-- Created Courses List -->
      @if (createdEntities().length > 0) {
        <div class="bg-success/10 rounded-xl p-4 text-left">
          <h3 class="font-medium text-success mb-2">Cursos creados:</h3>
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
                Necesitas crear al menos un plan de estudio antes de crear cursos.
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
            <label for="subjectId" class="label">
              <span class="label-text font-medium">Asignatura</span>
            </label>
            <select id="subjectId" formControlName="subjectId" class="select select-bordered w-full">
              <option value="" disabled>Selecciona una asignatura...</option>
              @for (subject of subjects.value(); track subject.id) {
                <option [value]="subject.id">{{ subject.name }}</option>
              }
            </select>
            <p class="text-xs text-base-content/60 mt-1">
              Si no encuentras la asignatura, podrás crearla después en administración.
            </p>
          </div>

          <div class="fieldset">
            <label for="code" class="label">
              <span class="label-text font-medium">
                Código del Curso
                <span class="text-base-content/50 font-normal">(opcional)</span>
              </span>
            </label>
            <input
              type="text"
              id="code"
              formControlName="code"
              class="input input-bordered w-full"
              placeholder="MAT-101"
            />
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
          <p class="text-xs text-base-content/50 mt-1">Podrás crear cursos más adelante.</p>
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
export default class CoursesStep {
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
        .watchQuery({
          query: OnboardingStepsGetSchoolsDocument,
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

  public studyPlans = rxResource({
    params: () => ({ schoolId: this.schoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery({
          query: OnboardingStepsStudyPlansBySchoolIdDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'cache-and-network',
        })
        .valueChanges.pipe(map((result) => result.data?.studyPlansBySchoolId ?? []));
    },
  });

  public subjects = rxResource({
    stream: () =>
      this.apollo
        .watchQuery({
          query: OnboardingStepsGetSubjectsDocument,
          variables: { take: 100, orderBy: 'name' },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data?.subjects ?? [])),
  });

  // Combine API study plans with newly created ones
  public allStudyPlans = computed(() => {
    const apiPlans = this.studyPlans.value() ?? [];
    const newPlans = this.createdStudyPlans().map((p) => ({ id: p.id, name: p.name }));
    return [...apiPlans, ...newPlans.filter((np) => !apiPlans.some((ap) => ap.id === np.id))];
  });

  public form = this.fb.group({
    code: [''],
    subjectId: ['', [Validators.required]],
    studyPlanId: ['', [Validators.required]],
  });

  public onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Por favor, completa todos los campos requeridos');
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
      .mutate({
        mutation: OnboardingStepsCreateCourseDocument,
        variables: {
          createCourseInput: {
            ...formValue,
            schoolId,
            organizationId,
          },
        },
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          const course = result.data?.createCourse;
          if (course) {
            this.entityCreated.emit({ id: course.id, name: course.name, type: 'course' });
            this.toasts.showSuccess(`Curso "${course.name}" creado`);
          }
          this.form.reset();

          if (!this.addAnother) {
            this.completed.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.message || 'Error al crear el curso');
        },
      });
  }

  public onSkip() {
    this.skipped.emit();
  }
}
