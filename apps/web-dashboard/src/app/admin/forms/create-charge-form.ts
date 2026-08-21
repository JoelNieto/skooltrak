import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import Store from '../../core/store';

@Component({
  selector: 'app-create-charge-form',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="flex flex-col gap-4">
        <div class="fieldset">
          <label for="targetType">Objetivo</label>
          <select [formField]="form.targetType" class="select select-primary w-full">
            <option value="student">Estudiante</option>
            <option value="studyPlan">Plan de estudio</option>
          </select>
        </div>
        @if (form.targetType().value() === 'student') {
          <div class="fieldset">
            <label for="studentId">Estudiante</label>
            <select [formField]="form.studentId" class="select select-primary w-full">
              <option value="" disabled>Seleccionar estudiante...</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </div>
        }
        @if (form.targetType().value() === 'studyPlan') {
          <div class="fieldset">
            <label for="studyPlanId">Plan de estudio</label>
            <select [formField]="form.studyPlanId" class="select select-primary w-full">
              <option value="" disabled>Seleccionar plan...</option>
              @for (sp of studyPlans.value(); track sp.id) {
                <option [value]="sp.id">{{ sp.name }}</option>
              }
            </select>
          </div>
        }
        <div class="fieldset">
          <label for="amount">Monto</label>
          <input type="number" step="0.01" [formField]="form.amount" class="input input-primary w-full" />
        </div>
        <div class="fieldset">
          <label for="dueDate">Fecha de vencimiento</label>
          <input type="date" [formField]="form.dueDate" class="input input-primary w-full" />
        </div>
        <div class="fieldset">
          <label for="description">Descripción (opcional)</label>
          <input
            type="text"
            [formField]="form.description"
            class="input input-primary w-full"
            placeholder="Ej. Colegiatura Septiembre"
          />
        </div>
        <div class="fieldset">
          <label for="chargeType">Tipo</label>
          <select [formField]="form.chargeType" class="select select-primary w-full">
            <option value="CUSTOM">Personalizado</option>
            <option value="TUITION">Colegiatura</option>
            <option value="ENROLLMENT">Matrícula</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Crear cargo</button>
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
