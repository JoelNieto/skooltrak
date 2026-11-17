import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import Auth from '../../auth/auth';
import Store from '../../core/store';

type ChargeOption = {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  status: string;
  chargeType: string;
};

@Component({
  selector: 'app-create-payment-form',
  imports: [UiField, UiInput, UiSelect, Button, DecimalPipe, FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="flex flex-col gap-4">
        <ui-field label="Estudiante" [field]="form.studentId">
          <select uiSelect [formField]="form.studentId" (change)="onStudentChange()">
            <option value="" disabled>Seleccionar estudiante...</option>
            @for (s of students.value(); track s.id) {
              <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
            }
          </select>
        </ui-field>
        <ui-field label="Monto" [field]="form.amount">
          <input uiInput type="number" step="0.01" [formField]="form.amount" />
        </ui-field>
        <ui-field label="Fecha de pago" [field]="form.paidAt">
          <input uiInput type="date" [formField]="form.paidAt" />
        </ui-field>
        @if (form.studentId().value()) {
          <ui-field label="Aplicar a un cargo (opcional)" [field]="form.chargeId">
            <select uiSelect [formField]="form.chargeId">
              <option value="">Sin cargo específico</option>
              @for (c of charges.value(); track c.id) {
                <option [value]="c.id" [disabled]="c.status === 'PAID'">
                  {{ c.description || c.chargeType }} — {{ c.amount | number: '1.2-2' }} ({{ c.status }})
                </option>
              }
            </select>
          </ui-field>
        }
        <ui-field label="Referencia (opcional)" [field]="form.reference">
          <input
            uiInput
            type="text"
            [formField]="form.reference"
            placeholder="Ej. Comprobante, número de transferencia"
          />
        </ui-field>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit">Registrar pago</button>
      </div>
    </form>
  `,
})
export default class CreatePaymentForm {
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);
  private auth = inject(Auth);

  public students = httpResource<{ id: string; firstName: string; fatherName: string }[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/students/by-school/${schoolId}`,
    };
  });

  public charges = httpResource<ChargeOption[]>(() => {
    const studentId = this.formModel().studentId;
    if (!studentId) return undefined;
    return {
      url: '/api/v1/financial/charges/by-student',
      params: { studentId },
    };
  });

  private formModel = signal<{
    studentId: string;
    amount: number;
    paidAt: string;
    reference: string;
    chargeId: string;
  }>({
    studentId: '',
    amount: 0,
    paidAt: new Date().toISOString().slice(0, 10),
    reference: '',
    chargeId: '',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.studentId, { message: 'Estudiante requerido' });
    required(schemaPath.paidAt, { message: 'Fecha de pago requerida' });
    required(schemaPath.amount, { message: 'Monto requerido' });
    min(schemaPath.amount, 0.01, { message: 'Monto minimo requerido' });
  });

  onStudentChange() {
    this.form.chargeId().value.set('');
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Completa los campos requeridos');
      return;
    }
    const v = this.formModel();
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) {
      this.toast.showError('No hay escuela seleccionada');
      return;
    }
    const payload = {
      studentId: v.studentId,
      amount: v.amount,
      paidAt: v.paidAt,
      reference: v.reference || undefined,
      chargeId: v.chargeId || undefined,
      createdBy: this.auth.user()?.id,
    };
    this.http.post('/api/v1/financial/payments', payload).subscribe({
      next: () => {
        this.toast.showSuccess('Pago registrado correctamente');
        this.closeModal.emit();
      },
      error: (err) => this.toast.showError(err?.message ?? 'Error al registrar pago'),
    });
  }
}
