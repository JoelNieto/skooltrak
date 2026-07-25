import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export type OnboardingSummary = {
  schoolName?: string;
  degreesCount: number;
  studyPlansCount: number;
  coursesCount: number;
  groupsCount: number;
};

@Component({
  selector: 'app-welcome-banner',
  imports: [RouterLink],
  template: `
    @if (!dismissed()) {
      <div
        class="bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-6 relative overflow-hidden"
      >
        <!-- Background decoration -->
        <div class="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

        <div class="relative">
          <!-- Close button (only after first view) -->
          @if (canDismiss()) {
            <button
              class="absolute right-0 top-0 btn btn-ghost btn-sm btn-circle"
              (click)="dismiss()"
              aria-label="Cerrar"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          }

          <!-- Header -->
          <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-2xl text-primary">celebration</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-base-content">
                ¡Bienvenido{{ summary().schoolName ? ' a ' + summary().schoolName : '' }}!
              </h2>
              <p class="text-base-content/70 mt-1">Tu escuela está configurada y lista para usarse.</p>
            </div>
          </div>

          <!-- Setup Summary -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div class="bg-base-100 rounded-xl p-3 text-center border border-base-200">
              <div class="text-2xl font-bold text-primary">{{ summary().degreesCount }}</div>
              <div class="text-xs text-base-content/60">Niveles</div>
            </div>
            <div class="bg-base-100 rounded-xl p-3 text-center border border-base-200">
              <div class="text-2xl font-bold text-accent">{{ summary().studyPlansCount }}</div>
              <div class="text-xs text-base-content/60">Planes</div>
            </div>
            <div class="bg-base-100 rounded-xl p-3 text-center border border-base-200">
              <div class="text-2xl font-bold text-info">{{ summary().coursesCount }}</div>
              <div class="text-xs text-base-content/60">Cursos</div>
            </div>
            <div class="bg-base-100 rounded-xl p-3 text-center border border-base-200">
              <div class="text-2xl font-bold text-success">{{ summary().groupsCount }}</div>
              <div class="text-xs text-base-content/60">Grupos</div>
            </div>
          </div>

          <!-- Next Actions -->
          <div class="space-y-2">
            <h3 class="text-sm font-medium text-base-content/70">Próximos pasos recomendados:</h3>
            <div class="flex flex-wrap gap-2">
              <a routerLink="/teachers/new" class="btn btn-primary btn-sm">
                <span class="material-symbols-outlined text-lg">person_add</span>
                Invitar Docentes
              </a>
              <a routerLink="/students/new" class="btn btn-outline btn-sm">
                <span class="material-symbols-outlined text-lg">school</span>
                Registrar Estudiantes
              </a>
              <a routerLink="/admin/schools" class="btn btn-ghost btn-sm">
                <span class="material-symbols-outlined text-lg">settings</span>
                Personalizar Escuela
              </a>
              <a
                href="https://docs.skooltrak.com"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-sm"
              >
                <span class="material-symbols-outlined text-lg">help</span>
                Ver Guía
              </a>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export default class WelcomeBanner {
  public summary = input.required<OnboardingSummary>();
  public firstVisit = input(false);

  private STORAGE_KEY = 'skooltrak_welcome_dismissed';

  public dismissed = signal(this.isDismissed());
  public canDismiss = computed(() => !this.firstVisit());

  private isDismissed(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  public dismiss() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, 'true');
    }
    this.dismissed.set(true);
  }
}
