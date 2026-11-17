import { Breadcrumbs, Button, Card, CardBody, Loader, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { disabled, email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Store from '../core/store';
import { isValidId } from '../core/validators';

type TeacherDetail = {
  firstName?: string;
  middleName?: string;
  fatherName?: string;
  motherName?: string;
  documentId?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  personalEmail?: string;
  about?: string;
  teacherSince?: number | null;
  memberSince?: string;
  user?: { email?: string };
};

interface TeacherFormData {
  firstName: string;
  middleName: string;
  fatherName: string;
  motherName: string;
  documentId: string;
  email: string;
  birthDate: string;
  gender: string;
  address: string;
  phoneNumber: string;
  personalEmail: string;
  about: string;
  teacherSince: string;
  memberSince: string;
}

@Component({
  selector: 'app-teacher-form',
  imports: [Breadcrumbs, Card, CardBody, UiField, UiInput, UiSelect, Button, FormField, RouterLink, Loader],
  template: `
    <ui-breadcrumbs
      [items]="[
        { label: 'Inicio', link: '/' },
        { label: 'Docentes', link: '/teachers' },
        { label: isEditMode() ? 'Editar' : 'Nuevo' },
      ]"
    />

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode() ? 'Editar Docente' : 'Nuevo Docente' }}
      </h1>
    </div>

    @if (isEditMode() && teacherResource.isLoading()) {
      <lib-loader />
    } @else {
      <form (submit)="onSubmit($event)" novalidate="novalidate">
        <div class="flex flex-col gap-6 divide-y divide-line">
          <!-- Personal Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-ink-strong">Datos Personales</h2>
              <p class="mt-1 text-sm text-ink-muted">Información personal del docente.</p>
            </div>
            <div class="sm:col-span-3">
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Primer nombre" [field]="teacherForm.firstName" class="col-span-3">
                      <input uiInput id="firstName" type="text" [formField]="teacherForm.firstName" />
                    </ui-field>
                    <ui-field label="Segundo nombre" [field]="teacherForm.middleName" optional class="col-span-3">
                      <input uiInput id="middleName" type="text" [formField]="teacherForm.middleName" />
                    </ui-field>
                    <ui-field label="Apellido paterno" [field]="teacherForm.fatherName" class="col-span-3">
                      <input uiInput id="fatherName" type="text" [formField]="teacherForm.fatherName" />
                    </ui-field>
                    <ui-field label="Apellido materno" [field]="teacherForm.motherName" optional class="col-span-3">
                      <input uiInput id="motherName" type="text" [formField]="teacherForm.motherName" />
                    </ui-field>
                    <ui-field label="Nro. documento" [field]="teacherForm.documentId" class="col-span-2">
                      <input uiInput id="documentId" type="text" [formField]="teacherForm.documentId" />
                    </ui-field>
                    <ui-field label="Fecha de nacimiento" [field]="teacherForm.birthDate" class="col-span-2">
                      <input uiInput id="birthDate" type="date" [formField]="teacherForm.birthDate" />
                    </ui-field>
                    <ui-field label="Género" [field]="teacherForm.gender" class="col-span-2">
                      <select uiSelect id="gender" [formField]="teacherForm.gender">
                        <option value="" disabled>---Seleccionar---</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                      </select>
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-ink-strong">Contacto</h2>
              <p class="mt-1 text-sm text-ink-muted">Información de contacto del docente.</p>
            </div>
            <div class="sm:col-span-3">
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field label="Correo institucional" [field]="teacherForm.email" class="col-span-3">
                      <input uiInput id="email" type="email" [formField]="teacherForm.email" />
                    </ui-field>
                    <ui-field label="Correo personal" [field]="teacherForm.personalEmail" optional class="col-span-3">
                      <input uiInput id="personalEmail" type="email" [formField]="teacherForm.personalEmail" />
                    </ui-field>
                    <ui-field label="Teléfono" [field]="teacherForm.phoneNumber" optional class="col-span-3">
                      <input uiInput id="phoneNumber" type="text" [formField]="teacherForm.phoneNumber" />
                    </ui-field>
                    <ui-field label="Dirección" [field]="teacherForm.address" optional class="col-span-3">
                      <input uiInput id="address" type="text" [formField]="teacherForm.address" />
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Professional Information Section -->
          <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
            <div class="mb-4">
              <h2 class="text-lg/7 font-semibold text-ink-strong">Información Profesional</h2>
              <p class="mt-1 text-sm text-ink-muted">Datos profesionales y de trayectoria.</p>
            </div>
            <div class="sm:col-span-3">
              <div uiCard>
                <div uiCardBody class="gap-y-4">
                  <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                    <ui-field
                      label="Docente desde (año)"
                      [field]="teacherForm.teacherSince"
                      optional
                      class="col-span-3"
                    >
                      <input
                        uiInput
                        id="teacherSince"
                        type="number"
                        [formField]="teacherForm.teacherSince"
                        placeholder="Ej: 2015"
                      />
                    </ui-field>
                    <ui-field label="Miembro desde" [field]="teacherForm.memberSince" optional class="col-span-3">
                      <input uiInput id="memberSince" type="date" [formField]="teacherForm.memberSince" />
                    </ui-field>
                    <ui-field label="Acerca de" [field]="teacherForm.about" optional class="col-span-6">
                      <textarea
                        uiInput
                        id="about"
                        [formField]="teacherForm.about"
                        rows="4"
                        placeholder="Biografía breve, especialidades, intereses..."
                      ></textarea>
                    </ui-field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 my-6 pt-6 border-t border-line">
          <a uiButton variant="ghost" routerLink="/teachers">Cancelar</a>
          <button uiButton [loading]="isSaving()" variant="primary" type="submit" [disabled]="isSaving()">
            {{ isEditMode() ? 'Guardar cambios' : 'Crear docente' }}
          </button>
        </div>
      </form>
    }
  `,
})
export default class TeacherForm {
  public id = input<string>();

  private http = inject(HttpClient);
  private store = inject(Store);
  private router = inject(Router);
  private toasts = inject(Toast);

  public isEditMode = computed(() => !!this.id());
  public isSaving = signal(false);

  #teacherModel = signal<TeacherFormData>({
    firstName: '',
    middleName: '',
    fatherName: '',
    motherName: '',
    documentId: '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    phoneNumber: '',
    personalEmail: '',
    about: '',
    teacherSince: '',
    memberSince: '',
  });

  public teacherForm = form(this.#teacherModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Primer nombre es requerido' });
    required(schemaPath.fatherName, { message: 'Apellido paterno es requerido' });
    required(schemaPath.documentId, { message: 'Nro. documento es requerido' });
    required(schemaPath.email, { message: 'Correo electrónico es requerido' });
    email(schemaPath.email, { message: 'Ingrese un correo válido' });
    required(schemaPath.birthDate, { message: 'Fecha de nacimiento es requerida' });
    required(schemaPath.gender, { message: 'Género es requerido' });
    disabled(schemaPath.email, { when: () => this.isEditMode() });
  });

  public teacherResource = httpResource<TeacherDetail | null>(() =>
    isValidId(this.id() ?? '') ? `/api/v1/teachers/${this.id()}` : undefined,
  );

  constructor() {
    afterRenderEffect(() => {
      const teacher = this.teacherResource.value();
      if (teacher) {
        this.#teacherModel.set({
          firstName: teacher.firstName ?? '',
          middleName: teacher.middleName ?? '',
          fatherName: teacher.fatherName ?? '',
          motherName: teacher.motherName ?? '',
          documentId: teacher.documentId ?? '',
          email: teacher.user?.email ?? '',
          birthDate: teacher.birthDate ? new Date(teacher.birthDate).toISOString().split('T')[0] : '',
          gender: teacher.gender ?? '',
          address: teacher.address ?? '',
          phoneNumber: teacher.phoneNumber ?? '',
          personalEmail: teacher.personalEmail ?? '',
          about: teacher.about ?? '',
          teacherSince: teacher.teacherSince?.toString() ?? '',
          memberSince: teacher.memberSince ? new Date(teacher.memberSince).toISOString().split('T')[0] : '',
        });
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Mark all required fields as touched for validation display
    this.teacherForm.firstName().markAsTouched();
    this.teacherForm.fatherName().markAsTouched();
    this.teacherForm.documentId().markAsTouched();
    this.teacherForm.email().markAsTouched();
    this.teacherForm.birthDate().markAsTouched();
    this.teacherForm.gender().markAsTouched();

    submit(this.teacherForm, async () => {
      this.isSaving.set(true);
      const formValue = this.teacherForm().value();

      // Convert dates and numbers to proper format
      const request = {
        ...formValue,
        birthDate: formValue.birthDate ? new Date(formValue.birthDate) : null,
        teacherSince: formValue.teacherSince ? parseInt(formValue.teacherSince, 10) : null,
        memberSince: formValue.memberSince ? new Date(formValue.memberSince) : null,
      };

      if (this.isEditMode()) {
        await firstValueFrom(
          this.http.patch('/api/v1/teachers', {
            ...request,
            id: this.id()!,
          }),
        );
        this.isSaving.set(false);
        this.toasts.showSuccess('Docente actualizado exitosamente');
        this.router.navigate(['/teachers', this.id()!]);
      } else {
        const created = await firstValueFrom(
          this.http.post<{ id: string }>('/api/v1/teachers', {
            ...request,
            organizationId: this.store.currentOrganizationId()!,
          }),
        );
        this.isSaving.set(false);
        this.toasts.showSuccess('Docente creado exitosamente');
        const id = created?.id;
        if (id) {
          this.router.navigate(['/teachers', id]);
        }
      }
    });
  }
}
