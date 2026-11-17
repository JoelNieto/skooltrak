import { BrandLogo, Button, Toast, UiCheckbox, UiChoice, UiField, UiInput } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Store from '../core/store';

@Component({
  selector: 'app-school-acknowledgment',
  imports: [UiCheckbox, UiChoice, UiField, UiInput, Button, BrandLogo, FormField, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-surface-0">
      <!-- Fixed Header -->
      <header class="p-4 md:p-6 flex items-center justify-between">
        <ui-brand-logo class="h-8 md:h-10" />
      </header>

      <!-- Scrollable Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div class="w-full max-w-lg text-center space-y-8 animate-fade-in">
          <!-- Icon -->
          <div class="flex justify-center">
            <div class="w-24 h-24 rounded-full bg-action-subtle flex items-center justify-center">
              <span class="material-symbols-outlined text-6xl text-primary">apartment</span>
            </div>
          </div>

          <!-- Title & Subtitle -->
          <div class="space-y-3">
            <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Crea tu Escuela</h1>
            <p class="text-ink-muted text-lg">Configura tu institución educativa en Skooltrak.</p>
          </div>

          <!-- School Form -->
          <form class="space-y-4 text-left">
            <ui-field label="Nombre de la Escuela" [field]="form.name">
              <input
                uiInput
                type="text"
                id="schoolName"
                placeholder="Escuela Primaria Central"
                [formField]="form.name"
              />
            </ui-field>

            <ui-field
              label="Nombre Corto / Siglas"
              [field]="form.shortName"
              hint="Se usará para identificar rápidamente tu escuela"
            >
              <input uiInput type="text" id="schoolShortName" placeholder="EPC" [formField]="form.shortName" />
            </ui-field>
          </form>

          <!-- Explanation Cards -->
          <div class="space-y-4 text-left">
            <div class="bg-surface-1 rounded-xl p-4 border border-line shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-action-subtle flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary">database</span>
                </div>
                <div>
                  <h3 class="font-semibold text-ink-strong">Tu escuela será el contenedor de todos tus datos</h3>
                  <p class="text-sm text-ink-muted mt-1">
                    Programas académicos, cursos, estudiantes, docentes y toda la información de tu institución estará
                    organizada aquí.
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-surface-1 rounded-xl p-4 border border-line shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-accent">admin_panel_settings</span>
                </div>
                <div>
                  <h3 class="font-semibold text-ink-strong">Serás el administrador principal</h3>
                  <p class="text-sm text-ink-muted mt-1">
                    Tendrás control total sobre la configuración y podrás invitar a otros usuarios como docentes o
                    administradores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Confirmation Checkbox -->
          <div class="bg-surface-0/50 rounded-xl p-4">
            <ui-choice
              label="Entiendo que estoy configurando una nueva escuela y seré el administrador principal de la misma."
              class="items-start"
            >
              <input
                uiCheckbox
                type="checkbox"
                class="mt-0.5"
                [(ngModel)]="acknowledged"
                [ngModelOptions]="{ standalone: true }"
              />
            </ui-choice>
          </div>
        </div>
      </main>

      <!-- Fixed Footer -->
      <footer
        class="p-4 md:p-6 flex justify-between items-center border-t border-line bg-surface-1/80 backdrop-blur-sm"
      >
        <div></div>
        <button
          uiButton
          [loading]="saving()"
          variant="primary"
          [disabled]="!acknowledged() || form().invalid() || saving()"
          (click)="createSchool()"
        >
          @if (saving()) {
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
})
export default class SchoolAcknowledgment {
  private router = inject(Router);
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private store = inject(Store);

  public acknowledged = signal(false);
  public saving = signal(false);
  private formModel = signal({
    name: '',
    shortName: '',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre de la escuela requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto de la escuela requerido' });
    maxLength(schemaPath.shortName, 10, { message: 'Maximo 10 caractered' });
  });

  public createSchool() {
    if (this.form().invalid()) {
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    if (!this.acknowledged()) {
      this.toasts.showError('Debes aceptar los términos para continuar');
      return;
    }

    this.saving.set(true);

    const { name, shortName } = this.formModel();
    const year = new Date().getFullYear();

    (async () => {
      try {
        const school = await firstValueFrom(
          this.http.post<{
            id: string;
            name: string;
            organizationId: string;
            slug?: string | null;
            currencyCode?: string;
            primaryColor?: string | null;
            secondaryColor?: string | null;
            tertiaryColor?: string | null;
          }>('/api/v1/schools', {
            name,
            shortName,
            logo: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            email: '',
            phone: '',
            website: '',
            currentYear: year,
          }),
        );
        this.store.currentSchool.set({
          id: school.id,
          name: school.name,
          slug: school.slug ?? null,
          organizationId: school.organizationId,
          shortName,
          logo: '',
          currencyCode: school.currencyCode ?? 'USD',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          email: '',
          phone: '',
          website: '',
          currentYear: year,
          createdAt: new Date(),
          updatedAt: new Date(),
          primaryColor: school.primaryColor ?? null,
          secondaryColor: school.secondaryColor ?? null,
          tertiaryColor: school.tertiaryColor ?? null,
        });
        this.toasts.showSuccess('Escuela creada exitosamente');
        this.router.navigate(['/onboarding/setup']);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al crear la escuela';
        this.toasts.showError(msg);
      } finally {
        this.saving.set(false);
      }
    })();
  }
}
