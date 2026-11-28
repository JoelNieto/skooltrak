import { Button, Icon, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import Auth from '../../auth/auth';
import Store, { CurrentSchool } from '../../core/store';

/**
 * Wizard step 1.
 * - Invited admins (IAM-001 FR .15) arrive with an organization and no school: this step creates
 *   the organization's first school ("Tu primera escuela"), prefilled with the organization name.
 * - Admins from the legacy self-service path already have their school: this step only sets the
 *   academic year, as before.
 */
@Component({
  selector: 'app-school-basics-step',
  imports: [UiField, UiInput, UiSelect, Button, FormField, Icon],
  template: `
    <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-action-subtle flex items-center justify-center">
          <ui-icon [name]="needsSchool() ? 'building-2' : 'settings'" class="text-5xl text-primary" />
        </div>
      </div>

      <div class="space-y-2">
        @if (needsSchool()) {
          <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Tu primera escuela</h1>
          <p class="text-ink-muted">
            Si tu organización tiene varias sedes, empieza por una. Las demás se agregan después desde Escuelas.
          </p>
        } @else {
          <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Configura tu Escuela</h1>
          <p class="text-ink-muted">Establece la configuración básica de tu institución educativa.</p>
        }
      </div>

      @if (schools.isLoading()) {
        <p class="text-ink-muted" role="status">Cargando…</p>
      } @else {
        <form (submit)="onSubmit($event)" class="space-y-4 text-left">
          @if (needsSchool()) {
            <ui-field label="Nombre de la escuela" [field]="form.name" hint="Prellenado con el nombre de la organización.">
              <input uiInput type="text" id="schoolName" [formField]="form.name" />
            </ui-field>
            <ui-field label="Nombre corto o siglas" [field]="form.shortName">
              <input uiInput type="text" id="schoolShortName" [formField]="form.shortName" />
            </ui-field>
          }
          <ui-field
            label="Año Académico Actual"
            [field]="form.currentYear"
            hint="El año académico vigente para los cursos y asignaciones."
          >
            <select uiSelect id="currentYear" [formField]="form.currentYear">
              @for (year of years; track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </ui-field>

          <div class="pt-4">
            <button uiButton [loading]="saving()" variant="primary" type="submit" class="w-full" [disabled]="saving()">
              @if (saving()) {
                Guardando...
              } @else {
                {{ needsSchool() ? 'Crear escuela y continuar' : 'Guardar y Continuar' }}
                <ui-icon name="arrow-right" class="text-xl" />
              }
            </button>
          </div>
        </form>
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
export default class SchoolBasicsStep {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private store = inject(Store);
  private auth = inject(Auth);

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

  /** Invited organization with no school yet (IAM-001). */
  public needsSchool = computed(() => !this.schools.isLoading() && !this.schools.error() && !this.schoolId());

  private formModel = signal({ name: '', shortName: '', currentYear: new Date().getFullYear().toString() });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.currentYear);
    required(schemaPath.name, { message: 'Nombre de la escuela requerido', when: () => this.needsSchool() });
    required(schemaPath.shortName, { message: 'Nombre corto requerido', when: () => this.needsSchool() });
    maxLength(schemaPath.shortName, 10, { message: 'Máximo 10 caracteres' });
  });

  constructor() {
    // Prefill the school name with the organization name once, when the step needs it.
    effect(() => {
      const orgName = (this.auth.user() as { organization?: { name?: string } | null } | null)?.organization?.name;
      if (this.needsSchool() && orgName && !this.formModel().name) {
        this.formModel.update((m) => ({ ...m, name: orgName }));
      }
    });
  }

  public async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }

    const { name, shortName, currentYear } = this.formModel();
    this.saving.set(true);
    try {
      if (this.needsSchool()) {
        const school = await firstValueFrom(
          this.http.post<CurrentSchool>('/api/v1/auth/setup/first-school', {
            name,
            shortName,
            currentYear: Number(currentYear),
          }),
        );
        // Later steps read the school from the store.
        this.store.currentSchool.set(school);
        this.toasts.showSuccess('Escuela creada');
      } else {
        const schoolId = this.schoolId();
        if (!schoolId) {
          this.toasts.showError('No se encontró la escuela. Vuelve al paso anterior.');
          return;
        }
        await firstValueFrom(this.http.patch('/api/v1/schools', { id: schoolId, currentYear: Number(currentYear) }));
        this.toasts.showSuccess('Configuración guardada');
      }
      this.completed.emit();
    } catch (err) {
      const message = err instanceof HttpErrorResponse ? err.error?.message : null;
      this.toasts.showError(
        (Array.isArray(message) ? message[0] : message) ?? 'Error al guardar la configuración',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
