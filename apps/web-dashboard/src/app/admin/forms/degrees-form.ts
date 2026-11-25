import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import Auth from '../../auth/auth';
import Store from '../../core/store';
import {
  EMPTY_PLAN_SETTINGS,
  periodIncomplete,
  PlanSettingsFields,
  PlanSettingsRow,
  PlanSettingsValue,
  settingsFromRow,
  settingsPayload,
} from './plan-settings-fields';

/** A degree (level) and the settings its study plans inherit. */
@Component({
  selector: 'app-degrees-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField, PlanSettingsFields],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Nombre corto" [field]="form.shortName">
        <input uiInput type="text" id="shortName" [formField]="form.shortName" />
      </ui-field>
      <ui-field label="Escuela" [field]="form.schoolId">
        <select uiSelect id="schoolId" [formField]="form.schoolId">
          @for (school of schools.value(); track school.id) {
            <option [value]="school.id">{{ school.name }}</option>
          }
        </select>
      </ui-field>

      <section class="border-t border-line pt-4 mt-2">
        <h3 class="font-semibold">Configuración de los planes</h3>
        <p class="text-sm text-ink-muted mb-4">
          Todos los planes de estudio de este nivel usan estos valores, salvo los que cada plan personalice.
        </p>
        <app-plan-settings-fields
          [(value)]="settings"
          [metrics]="metrics.value()"
          [financial]="canManageFinancials"
        />
      </section>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" (click)="closeModal.emit()" type="button">Cancelar</button>
      <button uiButton variant="primary" type="submit" [disabled]="saving()">Guardar</button>
    </div>
  </form>`,
})
export default class DegreesForm {
  public store = inject(Store);
  public data = input<{
    degree?: { id: string; name: string; shortName: string; schoolId?: string } & PlanSettingsRow;
  }>();
  public closeModal = output<void>();
  #http = inject(HttpClient);
  private toasts = inject(Toast);
  protected readonly canManageFinancials = inject(Auth).hasPermission('MANAGE_FINANCIALS');
  public schools = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/schools', { defaultValue: [] });
  public metrics = httpResource<{ id: string; name: string }[]>(() => '/api/v1/grade-metrics', { defaultValue: [] });

  private formModel = signal({ name: '', shortName: '', schoolId: '' });
  protected readonly settings = signal<PlanSettingsValue>({ ...EMPTY_PLAN_SETTINGS });
  protected readonly saving = signal(false);

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.shortName, { message: 'Nombre corto requerido' });
    required(schemaPath.schoolId, { message: 'Colegio requerido' });
    disabled(schemaPath.schoolId, { when: () => !!this.data()?.degree });
  });

  private populatedId: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const schoolId = this.store.currentSchoolId();
      if (schoolId && !this.data()?.degree) this.form.schoolId().value.set(schoolId);
    });

    afterRenderEffect(() => {
      const degree = this.data()?.degree;
      if (degree && this.populatedId !== degree.id) {
        this.populatedId = degree.id;
        this.formModel.set({
          name: degree.name,
          shortName: degree.shortName,
          schoolId: degree.schoolId ?? this.store.currentSchoolId() ?? '',
        });
        this.settings.set(settingsFromRow(degree));
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.form.shortName().markAsTouched();
      this.form.name().markAsTouched();
      this.toasts.showError('Llenar todos los campos');
      return;
    }
    if (periodIncomplete(this.settings())) {
      this.toasts.showError('El periodo de colegiatura necesita un mes de inicio y uno de fin');
      return;
    }
    const request = { ...this.formModel(), ...settingsPayload(this.settings(), this.canManageFinancials) };
    const degree = this.data()?.degree;
    const save$ = degree
      ? this.#http.patch('/api/v1/degrees', { ...request, id: degree.id })
      : this.#http.post('/api/v1/degrees', request);

    this.saving.set(true);
    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toasts.showSuccess(degree ? 'Nivel actualizado exitosamente' : 'Nivel guardado exitosamente');
        this.closeModal.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.showError(err.error?.message ?? err.message);
      },
    });
  }
}
