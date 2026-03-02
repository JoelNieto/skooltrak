import { Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { OnboardingCompleteOnboardingDocument } from '../graphql/generated/graphql';
import Auth from '../auth/auth';

// Step components
import CoursesStep from './steps/courses';
import DegreesStep from './steps/degrees';
import GroupsStep from './steps/groups';
import SchoolBasicsStep from './steps/school-basics';
import StudyPlansStep from './steps/study-plans';

export type CreatedEntity = {
  id: string;
  name: string;
  type: 'degree' | 'studyPlan' | 'course' | 'group';
};

@Component({
  selector: 'app-setup-wizard',
  imports: [SchoolBasicsStep, DegreesStep, StudyPlansStep, CoursesStep, GroupsStep],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <!-- Fixed Header -->
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
        <div class="flex items-center gap-3">
          <span class="text-sm text-base-content/60 hidden sm:inline">
            Paso {{ currentStep() }} de {{ totalSteps }}
          </span>
          <div class="flex gap-2">
            @for (step of steps; track step; let i = $index) {
              <div
                class="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                [class.bg-primary]="i < currentStep()"
                [class.bg-primary]="i + 1 === currentStep()"
                [class.bg-base-300]="i + 1 > currentStep()"
              ></div>
            }
          </div>
        </div>
      </header>

      <!-- Step Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        @switch (currentStep()) {
          @case (1) {
            <app-school-basics-step (completed)="onStepCompleted()" />
          }
          @case (2) {
            <app-degrees-step
              [createdEntities]="createdDegrees()"
              (entityCreated)="onEntityCreated($event)"
              (completed)="onStepCompleted()"
              (skipped)="onStepSkipped()"
            />
          }
          @case (3) {
            <app-study-plans-step
              [createdDegrees]="createdDegrees()"
              [createdEntities]="createdStudyPlans()"
              (entityCreated)="onEntityCreated($event)"
              (completed)="onStepCompleted()"
              (skipped)="onStepSkipped()"
            />
          }
          @case (4) {
            <app-courses-step
              [createdStudyPlans]="createdStudyPlans()"
              [createdEntities]="createdCourses()"
              (entityCreated)="onEntityCreated($event)"
              (completed)="onStepCompleted()"
              (skipped)="onStepSkipped()"
            />
          }
          @case (5) {
            <app-groups-step
              [createdStudyPlans]="createdStudyPlans()"
              [createdEntities]="createdGroups()"
              (entityCreated)="onEntityCreated($event)"
              (completed)="onStepCompleted()"
              (skipped)="onStepSkipped()"
            />
          }
        }
      </main>

      <!-- Fixed Footer -->
      <footer
        class="p-4 md:p-6 flex justify-between items-center border-t border-base-200 bg-base-100/80 backdrop-blur-sm"
      >
        <div>
          @if (currentStep() > 1) {
            <button type="button" class="btn btn-ghost" (click)="previousStep()">
              <span class="material-symbols-outlined text-xl">arrow_back</span>
              Anterior
            </button>
          }
        </div>

        <div class="flex items-center gap-3">
          @if (currentStep() > 1 && currentStep() < totalSteps) {
            <button type="button" class="btn btn-ghost" (click)="skipStep()">Omitir por ahora</button>
          }

          @if (currentStep() === totalSteps) {
            <button type="button" class="btn btn-primary" (click)="completeOnboarding()" [disabled]="completing()">
              @if (completing()) {
                <span class="loading loading-spinner loading-sm"></span>
                Finalizando...
              } @else {
                Finalizar configuración
                <span class="material-symbols-outlined text-xl">check</span>
              }
            </button>
          }
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SetupWizard {
  private router = inject(Router);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  private auth = inject(Auth);

  public currentStep = signal(1);
  public completing = signal(false);
  public readonly totalSteps = 5;
  public readonly steps = Array.from({ length: this.totalSteps }, (_, i) => i + 1);

  // Track created entities for each step
  private createdEntities = signal<CreatedEntity[]>([]);

  public createdDegrees = computed(() => this.createdEntities().filter((e) => e.type === 'degree'));

  public createdStudyPlans = computed(() => this.createdEntities().filter((e) => e.type === 'studyPlan'));

  public createdCourses = computed(() => this.createdEntities().filter((e) => e.type === 'course'));

  public createdGroups = computed(() => this.createdEntities().filter((e) => e.type === 'group'));

  public onEntityCreated(entity: CreatedEntity) {
    this.createdEntities.update((entities) => [...entities, entity]);
  }

  public onStepCompleted() {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
    }
  }

  public onStepSkipped() {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
    }
  }

  public previousStep() {
    this.currentStep.update((step) => Math.max(step - 1, 1));
  }

  public skipStep() {
    this.onStepSkipped();
  }

  public completeOnboarding() {
    this.completing.set(true);

    this.apollo
      .mutate({
        mutation: OnboardingCompleteOnboardingDocument,
      })
      .subscribe({
        next: async () => {
          // Reload user data so guards see onboardingStep: 'completed'
          await this.auth.reloadUser();
          this.completing.set(false);
          this.toasts.showSuccess('Configuración completada exitosamente');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.completing.set(false);
          this.toasts.showError(err.message || 'Error al completar la configuración');
        },
      });
  }
}
