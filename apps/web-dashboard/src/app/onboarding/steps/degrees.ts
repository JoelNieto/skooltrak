import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import Store from '../../core/store';
import { CreatedEntity } from '../setup-wizard';

@Component({
  selector: 'app-degrees-step',
  imports: [FormField],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-5xl text-accent">school</span>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-base-content">Crea tu Primer Nivel Académico</h1>
        <p class="text-base-content/70">
          Los niveles representan programas académicos como "Primaria", "Secundaria" o "Bachillerato".
        </p>
      </div>

      <!-- Created Degrees List -->
      @if (createdEntities().length > 0) {
        <div class="bg-success/10 rounded-xl p-4 text-left">
          <h3 class="font-medium text-success mb-2">Niveles creados:</h3>
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

      <!-- Form Fields -->
      <form (submit)="onSubmit($event)" class="space-y-4 text-left">
        <div class="fieldset">
          <label for="name" class="label">
            <span class="label-text font-medium">Nombre del Nivel</span>
          </label>
          <input
            type="text"
            id="name"
            [formField]="form.name"
            class="input input-bordered w-full"
            placeholder="Ej: Educación Primaria"
          />
          @if (form.name().touched() && form.name().invalid()) {
            @for (error of form.name().errors(); track error) {
              <p class="text-error text-sm">{{ error.message }}</p>
            }
          }
        </div>

        <div class="fieldset">
          <label for="shortName" class="label">
            <span class="label-text font-medium">Nombre Corto / Siglas</span>
          </label>
          <input
            type="text"
            id="shortName"
            [formField]="form.shortName"
            class="input input-bordered w-full"
            placeholder="Ej: PRIM"
          />
          @if (form.shortName().touched() && form.shortName().invalid()) {
            @for (error of form.shortName().errors(); track error) {
              <p class="text-error text-sm">{{ error.message }}</p>
            }
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
              Guardar y Continuar
              <span class="material-symbols-outlined text-xl">arrow_forward</span>
            }
          </button>
        </div>
      </form>

      <!-- Skip Option -->
      @if (createdEntities().length === 0) {
        <div class="text-center">
          <button type="button" class="btn btn-ghost btn-sm" (click)="onSkip()">Omitir por ahora</button>
          <p class="text-xs text-base-content/50 mt-1">
            Podrás crear niveles más adelante desde el panel de administración.
          </p>
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
})
export default class DegreesStep {
  #http = inject(HttpClient);
  private toasts = inject(Toast);
  private store = inject(Store);

  public createdEntities = input<CreatedEntity[]>([]);
  public entityCreated = output<CreatedEntity>();
  public completed = output<void>();
  public skipped = output<void>();

  public saving = signal(false);
  public addAnother = false;

  // Fetch schools to get the first one if not in store
  public schools = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/schools', { defaultValue: [] });

  // Get the school ID from store or first school from API
  public schoolId = computed(() => {
    const storeSchoolId = this.store.currentSchoolId();
    if (storeSchoolId) return storeSchoolId;
    return this.schools.value()?.[0]?.id;
  });

  private formModel = signal({ name: '', shortName: '' });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre es requerido' });
    required(schemaPath.shortName, { message: 'El nombre corto es requerido' });
  });
  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    const schoolId = this.schoolId();
    if (!schoolId) {
      this.toasts.showError('No se encontró la escuela');
      return;
    }

    this.saving.set(true);

    const { name, shortName } = this.formModel();

    this.#http
      .post<{ id: string; name: string }>('/api/v1/degrees', {
        name,
        shortName,
        schoolId,
      })
      .subscribe({
        next: (degree) => {
          this.saving.set(false);
          if (degree) {
            this.entityCreated.emit({ id: degree.id, name: degree.name, type: 'degree' });
            this.toasts.showSuccess(`Nivel "${degree.name}" creado`);
          }
          this.form().reset();

          if (!this.addAnother) {
            this.completed.emit();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.showError(err.message || 'Error al crear el nivel');
        },
      });
  }

  public onSkip() {
    this.skipped.emit();
  }
}
