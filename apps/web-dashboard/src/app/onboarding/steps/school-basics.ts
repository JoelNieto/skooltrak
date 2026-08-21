import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import Store from '../../core/store';

@Component({
  selector: 'app-school-basics-step',
  imports: [FormField],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-5xl text-primary">settings</span>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-base-content">Configura tu Escuela</h1>
        <p class="text-base-content/70">Establece la configuración básica de tu institución educativa.</p>
      </div>

      <!-- Form Fields -->
      <form (ngSubmit)="onSubmit($event)" class="space-y-4 text-left">
        <div class="fieldset">
          <label for="currentYear" class="label">
            <span class="label-text font-medium">Año Académico Actual</span>
          </label>
          <select id="currentYear" [formField]="form.currentYear" class="select select-bordered w-full">
            @for (year of years; track year) {
              <option [value]="year">{{ year }}</option>
            }
          </select>
          <p class="text-xs text-base-content/60 mt-1">El año académico vigente para los cursos y asignaciones.</p>
        </div>

        <div class="pt-4">
          <button type="submit" class="btn btn-primary w-full" [disabled]="saving()">
            @if (saving()) {
              <span class="loading loading-spinner loading-sm"></span>
              Guardando...
            } @else {
              Guardar y Continuar
              <span class="material-symbols-outlined text-xl">arrow_forward</span>
            }
          </button>
        </div>
      </form>
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
export default class SchoolBasicsStep {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private store = inject(Store);

  public completed = output<void>();
  public saving = signal(false);

  // Generate years array (current year +/- 2)
  public years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Fetch schools to get the first one if not in store
  public schools = httpResource<Array<{ id: string }>>(() => '/api/v1/schools', { defaultValue: [] });

  // Get the school ID from store or first school from API
  public schoolId = computed(() => {
    const storeSchoolId = this.store.currentSchoolId();
    if (storeSchoolId) return storeSchoolId;

    const schools = this.schools.value();
    return schools?.[0]?.id;
  });

  private formModel = signal({ currentYear: new Date().getFullYear().toString() });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.currentYear);
  });

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    const schoolId = this.schoolId();
    if (!schoolId) {
      this.toasts.showError('No se encontró la escuela. Vuelve al paso anterior.');
      return;
    }

    this.saving.set(true);

    const { currentYear } = this.formModel();

    this.http
      .patch('/api/v1/schools', {
        id: schoolId,
        currentYear,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toasts.showSuccess('Configuración guardada');
          this.completed.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.message || 'Error al guardar la configuración');
        },
      });
  }
}
