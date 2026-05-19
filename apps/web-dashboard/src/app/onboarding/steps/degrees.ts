import { markGroupDirty, Toast } from '#/ui';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { httpResource, HttpClient } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Store from '../../core/store';
import { CreatedEntity } from '../setup-wizard';

@Component({
  selector: 'app-degrees-step',
  imports: [ReactiveFormsModule],
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
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-left">
        <div class="fieldset">
          <label for="name" class="label">
            <span class="label-text font-medium">Nombre del Nivel</span>
          </label>
          <input
            type="text"
            id="name"
            formControlName="name"
            class="input input-bordered w-full"
            placeholder="Ej: Educación Primaria"
          />
          @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
            <p class="text-error text-xs mt-1">El nombre es requerido</p>
          }
        </div>

        <div class="fieldset">
          <label for="shortName" class="label">
            <span class="label-text font-medium">Nombre Corto / Siglas</span>
          </label>
          <input
            type="text"
            id="shortName"
            formControlName="shortName"
            class="input input-bordered w-full"
            placeholder="Ej: PRIM"
          />
          @if (form.get('shortName')?.touched && form.get('shortName')?.hasError('required')) {
            <p class="text-error text-xs mt-1">El nombre corto es requerido</p>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DegreesStep {
  private fb = inject(NonNullableFormBuilder);
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
  public schools = httpResource<Array<{ id: string; name: string }>>(
    () => '/api/v1/schools',
    { defaultValue: [] },
  );

  // Get the school ID from store or first school from API
  public schoolId = computed(() => {
    const storeSchoolId = this.store.currentSchoolId();
    if (storeSchoolId) return storeSchoolId;
    return this.schools.value()?.[0]?.id;
  });

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
  });

  public onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    const schoolId = this.schoolId();
    if (!schoolId) {
      this.toasts.showError('No se encontró la escuela');
      return;
    }

    this.saving.set(true);

    const { name, shortName } = this.form.getRawValue();

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
          this.form.reset();

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
