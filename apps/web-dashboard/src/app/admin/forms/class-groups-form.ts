import { markGroupDirty, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import Store from '../../core/store';
@Component({
  selector: 'app-class-groups-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input type="text" id="name" name="name" formControlName="name" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="studyPlanId">Plan de estudio</label>
        <select id="studyPlanId" name="studyPlanId" formControlName="studyPlanId" class="select select-primary">
          <option value="" disabled>Seleccionar plan...</option>
          @for (studyPlan of studyPlans.value(); track studyPlan.id) {
            <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="teacherId">Profesor <span class="text-base-content/50 text-xs">(opcional)</span></label>
        <select id="teacherId" name="teacherId" formControlName="teacherId" class="select select-primary">
          <option [value]="null" disabled>Seleccionar profesor...</option>
          @for (teacher of teachers.value(); track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="active">Activo</label>
        <input type="checkbox" id="active" name="active" formControlName="active" class="checkbox checkbox-primary" />
      </div>
    </div>
    <div class="flex justify-end mt-4 gap-2">
      <button class="btn btn-ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
      <button class="btn btn-primary" type="submit">Guardar</button>
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
    return `/api/v1/study-plans/by-school/${currentSchoolId}`;
  });

  private fb = inject(NonNullableFormBuilder);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    teacherId: this.fb.control<string | null>(null),
    studyPlanId: ['', [Validators.required]],
    active: [true],
  });

  constructor() {
    afterRenderEffect(() => {
      console.log(this.data()?.group);
      if (this.data()?.group) {
        this.form.patchValue(this.data()!.group!);
      }
    });
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Formulario inválido');
      markGroupDirty(this.form);
      return;
    }

    const req = this.form.getRawValue();
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
