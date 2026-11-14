import { Button, Toast, UiField, UiInput, UiSelect, UiToggle } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, model, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-roles-form',
  imports: [UiField, UiInput, UiSelect, UiToggle, Button, FormField],
  template: `
    <form (submit)="createRole($event)">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Descripción" [field]="form.description">
        <input uiInput id="description" [formField]="form.description" />
      </ui-field>
      <ui-field label="Organización" [field]="$any(form.organizationId)">
        <select uiSelect id="organizationId" [formField]="$any(form.organizationId)">
          <option [value]="null">Seleccionar Organización</option>
          @for (organization of organizations.value(); track organization.id) {
            <option [value]="organization.id">
              {{ organization.name }}
            </option>
          }
        </select>
      </ui-field>
      <div class="fieldset">
        <label for="permissionIds">Permisos</label>
        @for (permission of permissions.value(); track permission.id) {
          <label class="label flex gap-2 items-center">
            <input
              uiToggle
              type="checkbox"
              [checked]="selectedIds().includes(permission.id!)"
              [id]="permission.id"
              (change)="togglePermission(permission.id!)"
            />
            <span class="label-text ml-2">{{ permission.description }} {{ permission.descriptiveId }}</span>
          </label>
        }
      </div>
      <div class="flex justify-end mt-4">
        <button uiButton variant="primary" type="submit">Guardar</button>
      </div>
    </form>
  `,
})
export class RolesForm {
  private http = inject(HttpClient);
  private toast = inject(Toast);
  public closeModal = output<void>();
  public data = input<{
    role?: Prisma.RoleGetPayload<{
      include: { organization: true; permissions: true };
    }>;
  }>();
  public permissions = httpResource<Array<{ id: string; descriptiveId: string; description: string }>>(
    () => ({
      url: '/api/v1/permissions',
      params: { take: '500' },
    }),
    { defaultValue: [] },
  );

  public organizations = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/organizations', {
    defaultValue: [],
  });

  public selectedIds = model<string[]>([]);

  public formModel = signal<{
    name: string;
    description: string;
    organizationId: string | null;
    permissionIds: string[];
  }>({
    name: '',
    description: '',
    organizationId: null,
    permissionIds: [],
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name);
    required(schemaPath.name);
  });

  constructor() {
    afterRenderEffect(() => {
      const role = this.data()?.role;
      if (role) {
        this.formModel.update((value) => ({ ...value, ...role }));
        this.selectedIds.set(role.permissions.map((p) => p.id));
      }
    });
  }

  togglePermission(id: string) {
    this.selectedIds.update((ids) => (ids.includes(id) ? ids.filter((id) => id !== id) : [...ids, id]));
  }

  public createRole(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Formulario inválido');
      return;
    }
    this.form.permissionIds().value.set(this.selectedIds());

    const req = this.formModel();

    if (this.data()?.role) {
      void firstValueFrom(this.http.patch('/api/v1/roles', { ...req, id: this.data()!.role!.id }))
        .then(() => {
          this.toast.showSuccess('Rol actualizado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toast.showError('Error al actualizar el rol');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/roles', req))
        .then(() => {
          this.toast.showSuccess('Rol creado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toast.showError('Error al crear el rol');
          console.error(error);
        });
    }
  }
}
