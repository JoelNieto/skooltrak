import { markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { OnboardingCreateSchoolWithOrganizationDocument } from '../graphql/generated/graphql';
import Auth from '../auth/auth';
import Store from '../core/store';

@Component({
  selector: 'app-create-school',
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <!-- Fixed Header -->
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
      </header>

      <!-- Scrollable Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div class="w-full max-w-lg text-center space-y-8 animate-fade-in">
          <!-- Icon -->
          <div class="flex justify-center">
            <div class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-6xl text-primary">apartment</span>
            </div>
          </div>

          <!-- Title & Subtitle -->
          <div class="space-y-3">
            <h1 class="text-2xl md:text-3xl font-bold text-base-content">Crea tu Escuela</h1>
            <p class="text-base-content/70 text-lg">Configura tu institución educativa en Skooltrak.</p>
          </div>

          <!-- School Form -->
          <form [formGroup]="form" class="space-y-4 text-left">
            <div class="fieldset">
              <label for="schoolName" class="label">
                <span class="label-text font-medium">Nombre de la Escuela</span>
              </label>
              <input
                type="text"
                id="schoolName"
                class="input input-bordered w-full"
                placeholder="Escuela Primaria Central"
                formControlName="name"
              />
              @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                <p class="text-error text-xs mt-1">El nombre de la escuela es requerido</p>
              }
            </div>

            <div class="fieldset">
              <label for="schoolShortName" class="label">
                <span class="label-text font-medium">Nombre Corto / Siglas</span>
              </label>
              <input
                type="text"
                id="schoolShortName"
                class="input input-bordered w-full"
                placeholder="EPC"
                formControlName="shortName"
              />
              @if (form.get('shortName')?.touched && form.get('shortName')?.hasError('required')) {
                <p class="text-error text-xs mt-1">El nombre corto es requerido</p>
              }
              <p class="text-xs text-base-content/60 mt-1">Se usará para identificar rápidamente tu escuela</p>
            </div>
          </form>

          <!-- Explanation Cards -->
          <div class="space-y-4 text-left">
            <div class="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary">database</span>
                </div>
                <div>
                  <h3 class="font-semibold text-base-content">Tu escuela será el contenedor de todos tus datos</h3>
                  <p class="text-sm text-base-content/60 mt-1">
                    Programas académicos, cursos, estudiantes, docentes y toda la información de tu institución estará
                    organizada aquí.
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-accent">admin_panel_settings</span>
                </div>
                <div>
                  <h3 class="font-semibold text-base-content">Serás el administrador principal</h3>
                  <p class="text-sm text-base-content/60 mt-1">
                    Tendrás control total sobre la configuración y podrás invitar a otros usuarios como docentes o
                    administradores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Confirmation Checkbox -->
          <div class="bg-base-200/50 rounded-xl p-4">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-primary mt-0.5"
                [(ngModel)]="acknowledged"
                [ngModelOptions]="{ standalone: true }"
              />
              <span class="text-sm text-base-content text-left">
                Entiendo que estoy configurando una nueva escuela y seré el administrador principal de la misma.
              </span>
            </label>
          </div>
        </div>
      </main>

      <!-- Fixed Footer -->
      <footer
        class="p-4 md:p-6 flex justify-between items-center border-t border-base-200 bg-base-100/80 backdrop-blur-sm"
      >
        <button class="btn btn-ghost" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
        <button
          class="btn btn-primary"
          [disabled]="!acknowledged() || form.invalid || saving()"
          (click)="createSchool()"
        >
          @if (saving()) {
            <span class="loading loading-spinner loading-sm"></span>
            Creando escuela...
          } @else {
            Crear Escuela y Continuar
            <span class="material-symbols-outlined text-xl">arrow_forward</span>
          }
        </button>
      </footer>
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
export default class CreateSchool {
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  private store = inject(Store);
  private auth = inject(Auth);

  public acknowledged = signal(false);
  public saving = signal(false);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
  });

  public createSchool() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    if (!this.acknowledged()) {
      this.toasts.showError('Debes aceptar los términos para continuar');
      return;
    }

    this.saving.set(true);

    const { name, shortName } = this.form.getRawValue();

    this.apollo
      .mutate({
        mutation: OnboardingCreateSchoolWithOrganizationDocument,
        variables: {
          input: {
            schoolName: name,
            schoolShortName: shortName,
          },
        },
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          const result = res.data?.createSchoolWithOrganization;
          if (result) {
            // Update the JWT token with the new one that includes org/role info
            this.auth.token.set(result.accessToken);
            localStorage.setItem('access_token', result.accessToken);

            // Set the current school in the store
            this.store.currentSchool.set({
              id: result.schoolId,
              name,
              slug: null,
              organizationId: '', // Will be populated from the token
              shortName,
              logo: '',
              currencyCode: 'USD',
              address: '',
              city: '',
              state: '',
              zip: '',
              country: '',
              email: '',
              phone: '',
              website: '',
              currentYear: new Date().getFullYear(),
              createdAt: new Date(),
              updatedAt: new Date(),
              primaryColor: null,
              secondaryColor: null,
              tertiaryColor: null,
            });
            this.toasts.showSuccess('Escuela creada exitosamente');
            this.router.navigate(['/onboarding/setup']);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.message || 'Error al crear la escuela');
        },
      });
  }

  public goBack() {
    this.router.navigate(['/onboarding/choose-path']);
  }
}
