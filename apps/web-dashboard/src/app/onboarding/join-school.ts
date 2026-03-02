import { Loader, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import {
  OnboardingAvailableSchoolsDocument,
  OnboardingAvailableSchoolsQuery,
} from '../graphql/generated/graphql';

type AvailableSchool = OnboardingAvailableSchoolsQuery['availableSchools'][number];

@Component({
  selector: 'app-join-school',
  imports: [Loader],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        <div class="w-full max-w-3xl space-y-6 animate-fade-in">
          <div class="text-center space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-base-content">Selecciona tu Escuela</h1>
            <p class="text-base-content/70">Elige la escuela a la que deseas unirte</p>
          </div>

          <!-- Search -->
          <div class="form-control">
            <input
              type="text"
              class="input input-bordered w-full"
              placeholder="Buscar escuela..."
              (input)="onSearch($event)"
            />
          </div>

          @if (loading()) {
            <div class="flex justify-center py-8">
              <lib-loader />
            </div>
          } @else if (filteredSchools().length === 0) {
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-6xl text-base-content/30">school</span>
              <p class="mt-4 text-base-content/60">No se encontraron escuelas</p>
            </div>
          } @else {
            <div class="grid gap-4">
              @for (school of filteredSchools(); track school.id) {
                <button
                  class="card bg-base-100 shadow hover:shadow-lg transition-all cursor-pointer border border-base-200 hover:border-primary text-left w-full"
                  (click)="selectSchool(school)"
                >
                  <div class="card-body flex-row items-center gap-4">
                    <div
                      class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                    >
                      <span class="material-symbols-outlined text-2xl text-primary">school</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-base-content truncate">{{ school.name }}</h3>
                      <p class="text-sm text-base-content/60">{{ school.organizationName ?? '' }}</p>
                      @if (school.city) {
                        <p class="text-xs text-base-content/40">{{ school.city }}{{ school.country ? ', ' + school.country : '' }}</p>
                      }
                    </div>
                    <div class="flex items-center gap-2 text-base-content/50">
                      <span class="material-symbols-outlined text-lg">group</span>
                      <span class="text-sm">{{ school.studentCount }}</span>
                    </div>
                    <span class="material-symbols-outlined text-base-content/30">chevron_right</span>
                  </div>
                </button>
              }
            </div>
          }

          <div class="text-center">
            <button class="btn btn-ghost btn-sm" (click)="goBack()">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
              Volver
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class JoinSchool {
  private apollo = inject(Apollo);
  private router = inject(Router);
  private toasts = inject(Toast);

  public loading = signal(true);
  public schools = signal<OnboardingAvailableSchoolsQuery['availableSchools']>([]);
  public filteredSchools = signal<OnboardingAvailableSchoolsQuery['availableSchools']>([]);
  private searchTerm = '';

  constructor() {
    this.loadSchools();
  }

  private loadSchools() {
    this.apollo
      .query({
        query: OnboardingAvailableSchoolsDocument,
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (res) => {
          const schools = res.data?.availableSchools ?? [];
          this.schools.set(schools);
          this.filteredSchools.set(schools);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al cargar escuelas');
        },
      });
  }

  public onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = term;
    if (!term) {
      this.filteredSchools.set(this.schools());
    } else {
      this.filteredSchools.set(
        this.schools().filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            (s.organizationName ?? '').toLowerCase().includes(term) ||
            s.city?.toLowerCase().includes(term),
        ),
      );
    }
  }

  public selectSchool(school: AvailableSchool) {
    this.router.navigate(['/onboarding/select-role'], { queryParams: { schoolId: school.id, schoolName: school.name } });
  }

  public goBack() {
    this.router.navigate(['/onboarding/choose-path']);
  }
}
