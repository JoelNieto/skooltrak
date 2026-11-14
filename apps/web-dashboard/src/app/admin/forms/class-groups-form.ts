import { Button, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import Store from '../../core/store';
@Component({
  selector: 'app-class-groups-form',
  imports: [UiCheckbox, UiChoice, UiField, UiInput, UiSelect, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-2">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Plan de estudio" [field]="form.studyPlanId">
        <select uiSelect id="studyPlanId" [formField]="form.studyPlanId">
          <option value="" disabled>Seleccionar plan...</option>
          @for (studyPlan of studyPlans.value(); track studyPlan.id) {
            <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </ui-field>
      <ui-field label="Profesor" [field]="$any(form.teacherId)" optional>
        <select uiSelect id="teacherId" [formField]="$any(form.teacherId)">
          <option [value]="null" disabled>Seleccionar profesor...</option>
          @for (teacher of teachers.value(); track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </ui-field>
      <ui-choice label="Activo" [field]="form.active">
        <input uiCheckbox type="checkbox" id="active" [formField]="form.active" />
      </ui-choice>
    </div>
    <div class="flex justify-end mt-4 gap-2">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class ClassGroupsForm {
  public data = input<{
    group?: Prisma.ClassGroupGetPayload<{
      include: { teacher: true; studyPlan: true };
    }>;
  }>();
  private store = inject(Store);
  private http = inject(HttpClient);
  private toast = inject(Toast);
  public closeModal = output<void>();

  public teachers = httpResource<{ id: string; name: string }[]>(() => {
    const currentOrganizationId = this.store.currentOrganizationId();
    if (!currentOrganizationId) {
      return undefined;
    }
    return `/api/v1/teachers/by-organization/${currentOrganizationId}`;
  });

  public studyPlans = httpResource<{ id: string; name: string }[]>(() => {
    const currentSchoolId = this.store.currentSchoolId();
    if (!currentSchoolId) {
      return undefined;
    }
    return `/api/v1/study-plans/by-school?schoolId=${currentSchoolId}`;
  });

  private formModel = signal<{ name: string; teacherId: null | string; studyPlanId: string; active: boolean }>({
    name: '',
    teacherId: '',
    studyPlanId: '',
    active: true,
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.studyPlanId, { message: 'Plan de estudios requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      const group = this.data()?.group;
      if (group) {
        this.formModel.set({
          name: group.name ?? '',
          teacherId: group.teacherId ?? null,
          studyPlanId: group.studyPlanId ?? '',
          active: group.active ?? true,
        });
      }
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.form.studyPlanId().markAsTouched();
      this.toast.showError('Formulario inválido');
      return;
    }

    const req = this.formModel();
    const groupId = this.data()?.group?.id ?? '';

    if (this.data()?.group) {
      this.http
        .patch('/api/v1/class-groups', {
          ...req,
          teacherId: req.teacherId || undefined,
          id: groupId,
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Grupo actualizado correctamente');
            this.closeModal.emit();
          },
          error: (err) => {
            console.error(err);
            this.toast.showError('Error al actualizar el grupo');
          },
        });
    } else {
      this.http
        .post('/api/v1/class-groups', {
          ...req,
          teacherId: req.teacherId || undefined,
          schoolId: this.store.currentSchoolId() ?? '',
          organizationId: this.store.currentOrganizationId() ?? '',
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Grupo creado correctamente');
            this.closeModal.emit();
          },
          error: (err) => {
            console.error(err);
            this.toast.showError('Error al crear el grupo');
          },
        });
    }
  }
}
