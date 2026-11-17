import { afterRenderEffect, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BrandLogo, Button, Card, CardBody, Icon, UiIconName } from '#/ui';

interface RoleOption {
  id: string;
  label: string;
  description: string;
  icon: UiIconName;
  color: string;
}

@Component({
  selector: 'app-select-role',
  imports: [Card, CardBody, Button, BrandLogo, Icon],
  template: `
    <div class="min-h-screen flex flex-col bg-surface-0">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <ui-brand-logo class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl text-center space-y-8 animate-fade-in">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-action-subtle flex items-center justify-center">
              <ui-icon name="id-card" class="text-5xl text-primary" />
            </div>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">¿Cuál es tu rol?</h1>
            <p class="text-ink-muted">
              Selecciona tu rol en <strong>{{ schoolName() }}</strong>
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            @for (role of roles; track role.id) {
              <button uiCard class="text-left w-full" (click)="selectRole(role.id)">
                <div uiCardBody class="items-center text-center space-y-3">
                  <div
                    class="w-14 h-14 rounded-full flex items-center justify-center"
                    [style.background]="role.color + '15'"
                  >
                    <ui-icon [name]="role.icon" class="text-3xl" [style.color]="role.color" />
                  </div>
                  <h3 class="font-semibold text-ink-strong">{{ role.label }}</h3>
                  <p class="text-sm text-ink-muted">{{ role.description }}</p>
                </div>
              </button>
            }
          </div>

          <button uiButton variant="ghost" size="sm" (click)="goBack()">
            <ui-icon name="arrow-left" class="text-lg" />
            Cambiar escuela
          </button>
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
export default class SelectRole {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public schoolId = signal('');
  public schoolName = signal('');

  public roles: RoleOption[] = [
    {
      id: 'ORG_ADMIN',
      label: 'Administrador',
      description: 'Gestionar la escuela, docentes y estudiantes',
      icon: 'shield-user',
      color: '#ef4444',
    },
    {
      id: 'TEACHER',
      label: 'Docente',
      description: 'Dar clases, calificar y gestionar cursos',
      icon: 'school',
      color: '#3b82f6',
    },
    {
      id: 'STUDENT',
      label: 'Estudiante',
      description: 'Acceder a cursos, tareas y calificaciones',
      icon: 'user',
      color: '#22c55e',
    },
    {
      id: 'PARENT',
      label: 'Padre / Tutor',
      description: 'Ver el progreso académico de tus hijos',
      icon: 'users-round',
      color: '#f59e0b',
    },
  ];

  constructor() {
    afterRenderEffect(() => {
      this.schoolId.set(this.route.snapshot.queryParamMap.get('schoolId') || '');
      this.schoolName.set(this.route.snapshot.queryParamMap.get('schoolName') || '');

      if (!this.schoolId()) {
        this.router.navigate(['/onboarding/join-school']);
      }
    });
  }

  selectRole(roleId: string) {
    const schoolId = this.schoolId();

    if (roleId === 'STUDENT') {
      this.router.navigate(['/onboarding/verify-student'], {
        queryParams: { schoolId, schoolName: this.schoolName() },
      });
    } else if (roleId === 'PARENT') {
      this.router.navigate(['/onboarding/verify-parent'], { queryParams: { schoolId, schoolName: this.schoolName() } });
    } else {
      // Admin or Teacher -> direct request, navigate to waiting
      this.router.navigate(['/onboarding/confirm-request'], {
        queryParams: { schoolId, schoolName: this.schoolName(), role: roleId },
      });
    }
  }

  goBack() {
    this.router.navigate(['/onboarding/join-school']);
  }
}
