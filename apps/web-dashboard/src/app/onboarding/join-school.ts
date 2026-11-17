import { BrandLogo, Button, Card, CardBody, Loader, Toast, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

type AvailableSchool = {
  id: string;
  name: string;
  organizationName?: string;
  city?: string | null;
  country?: string | null;
};

@Component({
  selector: 'app-join-school',
  imports: [Card, CardBody, UiInput, Button, BrandLogo, Loader],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <ui-brand-logo class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        <div class="w-full max-w-3xl space-y-6 animate-fade-in">
          <div class="text-center space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Selecciona tu Escuela</h1>
            <p class="text-ink-muted">Escribe al menos 3 caracteres para buscar tu escuela</p>
          </div>

          <!-- Search -->
          <div>
            <input uiInput type="text" placeholder="Buscar escuela..." (input)="onSearch($event)" />
          </div>

          @if (loading()) {
            <div class="flex justify-center py-8">
              <lib-loader />
            </div>
          } @else if (searched() && filteredSchools().length === 0) {
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-6xl text-ink-subtle">school</span>
              <p class="mt-4 text-ink-muted">No se encontraron escuelas</p>
            </div>
          } @else if (searched()) {
            <div class="grid gap-4">
              @for (school of filteredSchools(); track school.id) {
                <button uiCard class="text-left w-full" (click)="selectSchool(school)">
                  <div uiCardBody class="flex-row items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-action-subtle flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-2xl text-primary">school</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-ink-strong truncate">{{ school.name }}</h3>
                      <p class="text-sm text-ink-muted">{{ school.organizationName ?? '' }}</p>
                      @if (school.city) {
                        <p class="text-xs text-ink-subtle">
                          {{ school.city }}{{ school.country ? ', ' + school.country : '' }}
                        </p>
                      }
                    </div>
                    <span class="material-symbols-outlined text-ink-subtle">chevron_right</span>
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-6xl text-ink-subtle">search</span>
              <p class="mt-4 text-ink-subtle">Comienza a escribir para buscar escuelas</p>
            </div>
          }

          <div class="text-center">
            <button uiButton variant="ghost" size="sm" (click)="goBack()">
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
export default class JoinSchool {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toasts = inject(Toast);

  public loading = signal(true);
  public schools = signal<AvailableSchool[]>([]);
  public filteredSchools = signal<AvailableSchool[]>([]);
  public searched = signal(false);
  private searchTerm = '';

  constructor() {
    this.loading.set(false);
  }

  public onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = term;
    this.searched.set(true);

    if (term.length < 3) {
      this.schools.set([]);
      this.filteredSchools.set([]);
      return;
    }

    this.loading.set(true);
    this.http.get<AvailableSchool[]>('/api/v1/auth/available-schools', { params: { query: term } }).subscribe({
      next: (schools) => {
        this.schools.set(schools ?? []);
        this.filteredSchools.set(schools ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toasts.showError(err.message || 'Error al buscar escuelas');
      },
    });
  }

  public selectSchool(school: AvailableSchool) {
    this.router.navigate(['/onboarding/select-role'], {
      queryParams: { schoolId: school.id, schoolName: school.name },
    });
  }

  public goBack() {
    this.router.navigate(['/onboarding/choose-path']);
  }
}
