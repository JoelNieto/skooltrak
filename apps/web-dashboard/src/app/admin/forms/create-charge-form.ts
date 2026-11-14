import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import Store from '../../core/store';

@Component({
  selector: 'app-create-charge-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="flex flex-col gap-4">
        <ui-field label="Objetivo" [field]="form.targetType">
          <select uiSelect [formField]="form.targetType">
            <option value="student">Estudiante</option>
            <option value="studyPlan">Plan de estudio</option>
          </select>
        </ui-field>
        @if (form.targetType().value() === 'student') {
          <ui-field label="Estudiante" [field]="form.studentId">
            <select uiSelect [formField]="form.studentId">
              <option value="" disabled>Seleccionar estudiante...</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </ui-field>
        }
        @if (form.targetType().value() === 'studyPlan') {
          <ui-field label="Plan de estudio" [field]="form.studyPlanId">
            <select uiSelect [formField]="form.studyPlanId">
              <option value="" disabled>Seleccionar plan...</option>
              @for (sp of studyPlans.value(); track sp.id) {
                <option [value]="sp.id">{{ sp.name }}</option>
              }
            </select>
          </ui-field>
        }
        <ui-field label="Monto" [field]="form.amount">
          <input uiInput type="number" step="0.01" [formField]="form.amount" />
        </ui-field>
        <ui-field label="Fecha de vencimiento" [field]="form.dueDate">
          <input uiInput type="date" [formField]="form.dueDate" />
        </ui-field>
        <ui-field label="Descripción (opcional)" [field]="form.description">
          <input uiInput type="text" [formField]="form.description" placeholder="Ej. Colegiatura Septiembre" />
        </ui-field>
        <ui-field label="Tipo" [field]="form.chargeType">
          <select uiSelect [formField]="form.chargeType">
            <option value="CUSTOM">Personalizado</option>
            <option value="TUITION">Colegiatura</option>
            <option value="ENROLLMENT">Matrícula</option>
          </select>
        </ui-field>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit">Crear cargo</button>
      </div>
    </form>
  `,
})
export default class CreateChargeForm {
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);

  public students = httpResource<{ id: string; firstName: string; fatherName: string }[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/students/by-school/${schoolId}`,
    };
  });

  public studyPlans = httpResource<{ id: string; name: string }[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/study-plans/by-school/`,
      params: { schoolId },
    };
  });

  private formModel = signal<{
    targetType: 'studyPlan' | 'student';
    studentId: string;
    studyPlanId: string;
    amount: number;
    dueDate: string;
    description: string;
    chargeType: 'CUSTOM' | 'TUITION' | 'ENROLLMENT';
  }>({
    targetType: 'student',
    studentId: '',
    studyPlanId: '',
    amount: 0,
    dueDate: '',
    description: '',
    chargeType: 'CUSTOM',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.amount, { message: 'Monto requerido' });
    required(schemaPath.dueDate, { message: 'Fecha de vencimiento requerida' });
    min(schemaPath.amount, 0.01, { message: 'Monto minimo requerido' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Completa los campos requeridos');
      return;
    }
    const v = this.formModel();
    const schoolId = this.store.currentSchoolId();
    const school = this.store.currentSchool();
    if (!schoolId || !school) {
      this.toast.showError('No hay escuela seleccionada');
      return;
    }
    const year = school.currentYear ?? new Date().getFullYear();
    const input =
      v.targetType === 'student'
        ? (() => {
            if (!v.studentId) {
              this.toast.showError('Selecciona un estudiante');
              return null;
            }
            return {
              schoolId,
              year,
              amount: v.amount,
              dueDate: v.dueDate,
              description: v.description || undefined,
              chargeType: v.chargeType,
              studentId: v.studentId,
            };
          })()
        : (() => {
            if (!v.studyPlanId) {
              this.toast.showError('Selecciona un plan de estudio');
              return null;
            }
            return {
              schoolId,
              year,
              amount: v.amount,
              dueDate: v.dueDate,
              description: v.description || undefined,
              chargeType: v.chargeType,
              studyPlanId: v.studyPlanId,
            };
          })();
    if (!input) return;
    this.http.post('/api/v1/financial/charges', input).subscribe({
      next: () => {
        this.toast.showSuccess('Cargo creado correctamente');
        this.closeModal.emit();
      },
      error: (err) => this.toast.showError(err?.message ?? 'Error al crear'),
    });
  }
}
